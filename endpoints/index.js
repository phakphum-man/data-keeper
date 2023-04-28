const path = require('path');
const googleDrive = require("../libraries/googleDrive");

module.exports = function (app) {
	
    app.get('/', async (req, res) => {
        // #swagger.ignore = true
        return res.status(200).send(`Start API Keeper`);
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