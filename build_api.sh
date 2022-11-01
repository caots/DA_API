#!/bin/bash

# content of your script
sudo rm  -rf /var/www/html/measuredskill/qa/api/src
cd /var/www/html/measuredskill/qa/api
sudo unzip src.zip
npm run build
pm2 restart 15
sudo rm  -rf /var/www/html/measuredskill/qa/api/src.zip
