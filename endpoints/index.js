const path = require('path');
const os = require('node:os');

module.exports = function (app) {
	
    app.get('/', (req, res) => {
        // #swagger.ignore = true

        return res.status(200).send(`Start API Keeper ${os.platform()}, ${os.type()} ${os.release()}`);
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