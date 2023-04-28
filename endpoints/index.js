const path = require('path');
const googleDrive = require("../libraries/googleDrive");

module.exports = function (app) {
	
    app.get('/', async (req, res) => {
        // #swagger.ignore = true
        try{
            const { googleDriveV3 } = await googleDrive('ssGerCn6y69GgzFhyXfmjA==');
            const result = await googleDriveV3.files.list({
                pageSize: 10,
                fields: "nextPageToken, files(id, name)",
            });
            res.status(200).send(result.data);
        } catch (err) {
            res
            .status(500)
            .send({ type: "Error", message: err.message, stack: err.stack });
        }
    });

    app.get('/testfile', async (req, res) => {
        // #swagger.ignore = true
        try{
            const { googleDriveV3 } = await googleDrive('ssGerCn6y69GgzFhyXfmjA==');

            const fileMimeType = "text/plain";
            const result = await googleDriveV3.files.create({
                requestBody: {
                  name: "testfile-from-nodejs.txt",
                  mimeType: fileMimeType,
                  parents: ["1dY1s1gMMHShjlsmiqA6DnzWjRK7DZQpc"],
                },
                media: {
                  mimeType: fileMimeType,
                  body: "test data",
                },
            });
            res.status(200).send(result.data);
        } catch (err) {
            res
            .status(500)
            .send({ type: "Error", message: err.message, stack: err.stack });
        }
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