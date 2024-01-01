require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { google } = require("googleapis");
const { JWT } = require("google-auth-library");

const googleDrive = async () => {
  //const keyFile = "credentials.json";
  let keyContent = process.env.GDRIVE_CREDENTIAL;
  if(process.env.NODE_ENV === "production"){
    keyContent = fs.readFileSync("/etc/secrets/gdrive_private_key", "utf8");
    //console.log(keyContent);
  }
  const optionJwt = {
    email: process.env.GG_CLIENT_EMAIL,
    key: keyContent,
    scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file"
    ]
  };
  console.log(`email => ${optionJwt.email}`);
  console.log(`key => "${optionJwt.key}"`);
  const auth = new JWT(optionJwt);

  // Instance of google Drive
  const googleDriveV3 = google.drive({ version: "v3", auth: auth });
  return { googleDriveV3, auth };
};

const getMimeType = (filePath) => {
  let fileMimeType = null;
  const ext = path.extname(filePath);
  switch (ext) {
    case ".pdf":
      fileMimeType = "application/pdf";
      break;
    case ".docx":
      fileMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      break;
    case ".xls":
        fileMimeType = "application/vnd.ms-excel";
        break;
    case ".xlsx":
      fileMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      break;
    case ".ppt":
      fileMimeType = "application/vnd.ms-powerpoint";
      break;
    case ".pptx":
      fileMimeType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      break;
    case ".zip":
      fileMimeType = "application/zip";
      break;
    case ".rtf":
      fileMimeType = "application/rtf";
      break;
    case ".csv":
      fileMimeType = "text/csv";
      break;
    case ".json":
      fileMimeType = "application/json";
      break;
    default:
      fileMimeType = null;
  }
  return fileMimeType;
}

const exportToDrive = async ( parentId, filePath) => {
  if(!fs.existsSync(filePath)) return;
  const { googleDriveV3 } = await googleDrive();

  const mimeType = getMimeType(filePath);
  const result = await googleDriveV3.files.create({
    requestBody: {
      name: path.basename(filePath),
      mimeType: mimeType,
      parents: [parentId],
    },
    media: {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    },
  });
  console.log(`${(new Date()).toISOString()}: Upload GDrive complete.`);
  return result.data;
};

const exportToDriveAndShare = async ( parentId, filePath, setPermission = { "role": "reader", "type": "anyone" }) => {
  if(!fs.existsSync(filePath)) return;
  const { googleDriveV3 } = await googleDrive();

  const mimeType = getMimeType(filePath);
  const result = await googleDriveV3.files.create({
    requestBody: {
      name: path.basename(filePath),
      mimeType: mimeType,
      parents: [parentId],
    },
    media: {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    },
  });
  console.log(`${(new Date()).toISOString()}: Upload GDrive complete.`);

  const permResult = await googleDriveV3.permissions.create({fileId: result.data.id, resource: setPermission});
  if(permResult.status === 200){
    console.log(`${(new Date()).toISOString()}: Set permission successfully.`);
  }

  return result.data;
};

module.exports = { googleDrive, exportToDrive, exportToDriveAndShare };
