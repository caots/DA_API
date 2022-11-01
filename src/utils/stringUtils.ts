import stringSimilarity from "string-similarity";
export const isSame = (string1: string, string2: string) => {
  try {
    if (!string1 || !string2) { return false; }
    string1 = string1.toLowerCase().trim();
    string2 = string2.toLowerCase().trim();
    const similarity = stringSimilarity.compareTwoStrings(string1, string2);
    if (similarity >= 0.9) { return true; }
    return false;
  } catch (e) {
    return false;
  }

};