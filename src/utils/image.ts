import config, { FolderPath, UPLOAD_TYPE } from "@src/config";
import { logger } from "@src/middleware";
import AWS from 'aws-sdk';
import fs from "fs";
import moment from "moment";
import multer from "multer";
import path from "path";
import sharp from "sharp";

// Enter copied or downloaded access ID and secret key here
const ID = '';
const SECRET = '';

// The name of the bucket that you have created
const BUCKET_NAME = 'test-bucket';
export default class ImageUtils {
  public upload: multer.Multer;
  public enableFile = false;
  constructor(enableFile = false) {
    const pathUpload = !enableFile ? `${FolderPath.uploadPath}/draft` : `${FolderPath.uploadPath}/file`;

    const pathFile = `${FolderPath.uploadFilePath}`;
    const pathProfile = `${FolderPath.uploadProfilePath}`;
    if (!fs.existsSync(pathUpload)) {
      fs.mkdirSync(pathUpload, { recursive: true });
    }
    if (!fs.existsSync(pathFile)) {
      fs.mkdirSync(pathFile, { recursive: true });
    }
    if (!fs.existsSync(pathProfile)) {
      fs.mkdirSync(pathProfile, { recursive: true });
    }
    let whiteFile = [".png", ".jpeg", ".jpg", ".tiff"];
    if (enableFile) {
      const fileExt = [".doc", ".docx", ".pdf", ".xls", ".xlsx", ".bmp", ".ppt", ".pptx", ".gif", ".json", ".xml",
        ".txt", ".csv", ".rtf", ".mp3", ".mp4", ".flv", ".mkv", ".mov", ".3gp", ".zip", ".7z", ".rar"];
      whiteFile = whiteFile.concat(fileExt);
    }
    const storage = multer.diskStorage({
      destination(req, file, cb) {
        cb(null, pathUpload);
      },
      filename(req, file, cb) {
        const datetimestamp = Date.now();
        let nameOfFile;

        if (enableFile) {
          const ext = path.extname(file.originalname);
          const indexOfExt = file.originalname.lastIndexOf(ext);
          const name = file.originalname.substring(0, indexOfExt);
          nameOfFile = `${name}-${datetimestamp}${ext}`;
          nameOfFile = nameOfFile.replace(/ /g, "");
          // console.log(nameOfFile);
        } else {
          nameOfFile = `${FolderPath.profilePicture}-draft-${datetimestamp}.${file.originalname.split(".")[file.originalname.split(".").length - 1]}`;
        }
        cb(null, nameOfFile);
      }
      // fileFilter(req, file, cb) {
      //   var ext = path.extname(file.originalname)
      //   if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      //     return cb( /*res.end('Only images are allowed')*/ null, false)
      //   }

      //   cb(null, true)
      // }
    });

    this.upload = multer({
      storage,
      limits: {
        fileSize: 5 * 1024 * 1024
      },
      fileFilter(req, file, cb) {
        const ext = path.extname(file.originalname);
        // if (ext !== ".png" && ext !== ".jpg" && ext !== ".gif" && ext !== ".jpeg") {
        //   return cb(/*res.end('Only images are allowed')*/ null, false);
        // }
        if (!whiteFile.includes(ext)) {
          return cb(/*res.end('Only images are allowed')*/ null, false);
        }
        cb(null, true);
      }
    });
  }
  public async resizeImage(file: any, userId: number) {
    try {
      const datetimestamp = Date.now();
      let nameOfFile = `${FolderPath.profilePicture}-${userId}-${datetimestamp}.${file.originalname.split(".")[file.originalname.split(".").length - 1]}`;
      const pathFileOutPut = `${FolderPath.uploadProfilePath}/${nameOfFile}`;
      const resizeWith = 400;
      const resizeHeight = 400;
      const ext = path.extname(file.originalname);
      if (ext == '.tiff') {
        nameOfFile = nameOfFile.replace('.tiff', '.jpg');
      }
      const result = await sharp(file.path).resize(resizeWith, resizeHeight).jpeg({ mozjpeg: true }).toFile(pathFileOutPut);
      const url = await this.uploadToS3(pathFileOutPut.substring(2), nameOfFile, file.mimetype);
      if (!url) { return null; }
      const filePath = path.join(__dirname, `../../${file.path}`);
      const filePathOutPut = path.join(__dirname, `../../${pathFileOutPut.substring(2)}`);
      fs.unlinkSync(filePath);
      if (filePathOutPut != filePath) {
        fs.unlinkSync(filePathOutPut);
      };
      return url;
    } catch (e) {
      logger.error(JSON.stringify(e));
      console.log(JSON.stringify(e));
      return null;
    }
  }
  
  // public async resizeUploadImage(file: any, userId: number, uploadType: number) {
  //   try {
  //     const datetimestamp = Date.now();
  //     const pathFile = `${FolderPath.uploadFilePath}/${userId}`;
  //     if (!fs.existsSync(pathFile)) {
  //       fs.mkdirSync(pathFile, { recursive: true });
  //     }
  //     let nameOfFile = file.filename;
  //     let resizeWith, resizeHeight;
  //     switch (uploadType) {
  //       case UPLOAD_TYPE.EmployerAvatar:
  //         nameOfFile = `${FolderPath.company}-${nameOfFile}`;
  //         resizeWith = 400;
  //         resizeHeight = 400;
  //         break;
  //       case UPLOAD_TYPE.EmployerPhoto:
  //         nameOfFile = `${FolderPath.company}-${nameOfFile}`;
  //         resizeWith = 800;
  //         resizeHeight = 400;
  //         break;
  //       case UPLOAD_TYPE.CompanyAvatar:
  //         nameOfFile = `${FolderPath.company}-${nameOfFile}`;
  //         resizeWith = 700;
  //         resizeHeight = 400;
  //         break;
  //       case UPLOAD_TYPE.Chat:
  //         break;
  //       case UPLOAD_TYPE.QuesionImage:
  //         nameOfFile = `${FolderPath.question}-${nameOfFile}`;
  //         break;
  //       default:
  //         break;
  //     }
  //     let pathFileOutPut = `${pathFile}/${nameOfFile}`;
  //     const ext = path.extname(file.originalname);
  //     if (uploadType == UPLOAD_TYPE.Chat || uploadType == UPLOAD_TYPE.QuesionImage) {
  //       const imageMimeType = [".png", ".jpeg", ".jpg"];
  //       // if (!imageMimeType.includes(ext)) {
  //       //   pathFileOutPut = `${pathFile}/${file.filename}`;
  //       //   const result = await fs.renameSync(file.path, `${pathFileOutPut}`);
  //       //   return pathFileOutPut.substring(1);
  //       // }
  //       pathFileOutPut = `${pathFile}/${file.filename}`;
  //       const result = await fs.renameSync(file.path, `${pathFileOutPut}`);
  //       return pathFileOutPut.substring(1);
  //     }
  //     const result = await sharp(file.path).resize(resizeWith, resizeHeight).toFile(pathFileOutPut)
  //     const filePath = path.join(__dirname, `../../${file.path}`);
  //     await fs.unlinkSync(filePath);
  //     return pathFileOutPut.substring(1);
  //   } catch (e) {
  //     logger.error(JSON.stringify(e));
  //     return null;
  //   }
  // }
  public async resizeUploadImage(file: any, userId: number, uploadType: number) {
    try {
      // const datetimestamp = Date.now();
      const pathFile = `${FolderPath.uploadFilePath}/${userId}`;
      if (!fs.existsSync(pathFile)) {
        fs.mkdirSync(pathFile, { recursive: true });
      }
      let nameOfFile = file.filename;
      let resizeWith, resizeHeight;
      switch (uploadType) {
        case UPLOAD_TYPE.EmployerAvatar:
          nameOfFile = `${FolderPath.company}-${nameOfFile}`;
          resizeWith = 400;
          resizeHeight = 400;
          break;
        case UPLOAD_TYPE.EmployerPhoto:
          nameOfFile = `${FolderPath.company}-${nameOfFile}`;
          resizeWith = 800;
          resizeHeight = 400;
          break;
        case UPLOAD_TYPE.CompanyAvatar:
          nameOfFile = `${FolderPath.company}-${nameOfFile}`;
          resizeWith = 700;
          resizeHeight = 400;
          break;
        case UPLOAD_TYPE.Chat:
          break;
        case UPLOAD_TYPE.QuesionImage:
          nameOfFile = `${FolderPath.question}-${nameOfFile}`;
          break;
        default:
          break;
      }
      const ext = path.extname(file.originalname);

      let pathFileOutPut = `${pathFile}/${nameOfFile}`;
      if (uploadType != UPLOAD_TYPE.Chat && uploadType != UPLOAD_TYPE.QuesionImage && uploadType != UPLOAD_TYPE.JsonFileCrawler) {
        const result = await sharp(file.path).resize(resizeWith, resizeHeight).jpeg({ mozjpeg: true }).toFile(pathFileOutPut);
        pathFileOutPut = pathFileOutPut.substring(2);
      } else {
        const imageFile = [".png", ".jpeg", ".jpg", ".tiff"];
        if (imageFile.includes(ext)) {
          const result = await sharp(file.path).resize(resizeWith, resizeHeight).jpeg({ mozjpeg: true }).toFile(pathFileOutPut);
          pathFileOutPut = pathFileOutPut.substring(2);
        } else {
          pathFileOutPut = file.path;
        }
      }

      const url = await this.uploadToS3(pathFileOutPut, nameOfFile, file.mimetype);
      if (!url) { return null; }
      const filePath = path.join(__dirname, `../../${file.path}`);
      const filePathOutPut = path.join(__dirname, `../../${pathFileOutPut}`);
      fs.unlinkSync(filePath);
      if (filePathOutPut != filePath) {
        fs.unlinkSync(filePathOutPut);
      };
      return url;
    } catch (e) {
      logger.error(JSON.stringify(e));
      console.log(JSON.stringify(e));
      return null;
    }

  }
  public async uploadToS3(pathFileOutPut: string, nameOfFile: string, mimetype: string) {
    const s3 = new AWS.S3({
      accessKeyId: config.S3_ID,
      secretAccessKey: config.S3_SECRET
    });
    console.log(`Before upload s3.`);
    console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss"));
    const fileContent = fs.readFileSync(pathFileOutPut);
    const params = {
      Bucket: config.S3_BUCKET_NAME,
      Key: "uploads/" + nameOfFile, // File name you want to save as in S3
      Body: fileContent,
      ContentType: mimetype
    };
    const dataUpload = await s3.upload(params).promise();
    // Uploading files to the bucket
    if (!dataUpload) {
      return null;
    }
    console.log("done update payment log");
    console.log(`File uploaded successfully.`);
    console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss"));
    console.log(dataUpload);

    return dataUpload.Location;
  }
}