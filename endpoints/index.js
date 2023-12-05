require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { runPdfJobs, removeAllJob } = require("../libraries/jobBullMq");

module.exports = function (app) {
	
    app.get('/', async (req, res) => {
        // #swagger.ignore = true
        return res.status(200).send(`Start API Keeper`);
    });

    app.get('/wakeup', async (req, res) => {
        // #swagger.ignore = true
        console.log("Start Wake Up");
        return res.status(200).send(`Wake Up`);
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

    app.post('/run-report/online-pdf', async (req, res) => {
        // #swagger.ignore = true
        const data = req.params.filedata || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/pdf/data.csv';
        const template = req.params.template || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/pdf/ap203_form50_original.pdf';
        const result = await runPdfJobs({ fileData: data, fileTemplate: template },true);
        
        const fileName = path.basename(result.fileOutput);
        const output = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileName}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.get('/run-report/pdf', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || './reports/pdf/data.csv';
        const template = req.query.ft || './reports/pdf/ap203_form50_original.pdf';
        await runPdfJobs({ fileData: data, fileTemplate: template });

        return res.status(200).send(`Start Job`);
    });

    app.get('/run-report/remove', (req, res) => {
        
        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        const file = req.query.f || 'output.pdf';
        const sourcefile = `${rootPath}/servicefiles/${file}`;
        fs.unlink(sourcefile, (err) => {
            if (err) throw err;
        });
        return res.status(200).send(`removed ${file}`);
    });

    app.get('/run-report/clear', async (req, res) => {
        // #swagger.ignore = true

        await removeAllJob();

        return res.status(200).send(`clear`);
    });
}
