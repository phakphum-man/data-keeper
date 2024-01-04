require('dotenv').config();
const path = require('path');
const { generateAndWriteCSV } = require("../libraries/fakerWriteCsv");
const googleDrive = require('../libraries/googleDrive');

module.exports = function (app) {
	
    app.get('/', async (req, res) => {
        // #swagger.ignore = true
        return res.status(200).send(`Start API Keeper`);
    });

    app.get('/csv/fake/:record', async (req, res) => {
        // #swagger.ignore = true
        if (req.params.record && req.query.f) {
            let file_id_data = req.query.f;
            if (file_id_data.indexOf("/file/d/") > -1) {
                const dns = file_id_data.slice(0, file_id_data.indexOf("/file/d/"));
                const fileId = file_id_data.replace(`${dns}/file/d/`, "");
                file_id_data = fileId.slice(0, fileId.indexOf("/"));
            }
            const url = `https://drive.google.com/uc?export=download&id=${file_id_data}`;
            const fileName = `output${(new Date()).toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "")}.csv`;
            const sourcefile = await generateAndWriteCSV(req.params.record, url, fileName);

            const uploadResult = await googleDrive.exportToDriveAndShare(sourcefile, process.env.GDRIVE_PARENT_ID);

            if(uploadResult && uploadResult.id){
                return res.status(200).send(`Download <a href="https://drive.google.com/uc?export=download&id=${uploadResult.id}">here</a>`);
            }else{
                return res.status(500).send(`error uploading.`);
            }
        }
        return res.status(404).send();
    });

    app.get('/download', (req, res) => {
        // #swagger.ignore = true
        const file = req.query.f;

        if(!file)
            return res.status(404).send("Not Found");

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        // HTML jquery script download chunks
        return res.sendFile(`${rootPath}/download.html`);
    });
}
