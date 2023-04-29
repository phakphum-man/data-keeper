require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require("crypto");
const { google } = require("googleapis");

const googleDrive = async (iv) => {
  //const keyFile = "credentials.json";
  const algorithm = process.env.ALGORITHM;
  const key = process.env.PRIVATE_KEY;
  const credentials =  process.env.GDRIVE_CREDENTIAL;

  const keyFile = path.join(process.cwd(), "4bcb9ac3-8de1-4330-9f08-f0046774f7ad.json");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
  let decryptedData = decipher.update(credentials, "hex", "utf-8")
  decryptedData += decipher.final("utf8");
  
  fs.writeFileSync(keyFile, decryptedData, {
      encoding: "utf-8",
      mode: 0o600
  });

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/drive.file"
    ],
  });

  // Create client instance
  const client = await auth.getClient();

  // Instance of google Drive
  const googleDriveV3 = google.drive({ version: "v3", auth: client });
  return { googleDriveV3, auth };
};

const exportToDrive = async (iv, parentId, fileMimeType, filePath) => {
  const { googleDriveV3 } = await googleDrive(iv);

  const result = await googleDriveV3.files.create({
    requestBody: {
      name: path.basename(filePath),
      mimeType: fileMimeType,
      parents: [parentId],
    },
    media: {
      mimeType: fileMimeType,
      body: fs.createReadStream(filePath),
    },
  });
  const keyFile = path.join(process.cwd(), "4bcb9ac3-8de1-4330-9f08-f0046774f7ad.json");
  fs.unlink(keyFile);
  return result.data;
};

module.exports = { googleDrive, exportToDrive };