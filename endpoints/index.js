require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongodb = require('../libraries/mongodb');
const { runQueueJobs, removeAllJob } = require("../libraries/jobBullMq");

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
        const result = await runQueueJobs({ fileData: data, fileTemplate: template, createBy: "system-online" }, true);
        
        const fileName = path.basename(result.fileOutput);
        const output = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileName}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.post('/run-report/online-excel', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/excel/data.csv';
        const template = req.query.ft || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/excel/test-tables.xlsx';
        const result = await runQueueJobs({ fileData: data, fileTemplate: template, createBy: "system"}, true);

        const fileName = path.basename(result.fileOutput);
        const output = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileName}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.get('/run-report/logs', async (req, res) => {
        // #swagger.ignore = true
        const type = req.query.type || '';
        const by = req.query.by || '';
        
        let filter = (type === '')? {} :{ report_type: type};

        if( by!=='' ) {
            filter = Object.assign({ createBy: by }, filter);
        }
        const logData = await mongodb.getAll("bindreports", ["job_id", "report_type", "start_datetime", "end_datetime", "status", "parameters", "fileOutput", "createBy"],filter);

        return res.status(200).send({ data: logData});
    });

    app.get('/run-report/excel', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || './reports/excel/data.csv';
        const template = req.query.ft || './reports/excel/test-tables.xlsx';
        const result = await runQueueJobs({ fileData: data, fileTemplate: template, createBy: "system"});

        const fileName = path.basename(result.fileOutput);
        const output = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileName}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.get('/run-report/pdf', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || './reports/pdf/data.csv';
        const template = req.query.ft || './reports/pdf/ap203_form50_original.pdf';
        const result = await runQueueJobs({ fileData: data, fileTemplate: template, createBy: "system"});

        const fileName = path.basename(result.fileOutput);
        const output = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileName}" target="_blank">download</a>`;
        return res.status(200).send(output);
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
