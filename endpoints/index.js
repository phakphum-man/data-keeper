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
        const data = req.body.filedata || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/pdf/data.csv';
        const template = req.body.template || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/pdf/ap203_form50_original.pdf';
        const reportType = req.body.report_type || 'ap203_form50_original';
        const inputData = req.body.input_extension || 'csv';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ fileData: data, extension: "pdf", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system-online" }, true);

        const output = `<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.post('/run-report/gdrive-pdf', async (req, res) => {
        // #swagger.ignore = true
        const file_id_data = req.body.file_id_data || '1akFSZQOyk-XavCeu7Xi2bs0XeQfc6K3a';
        const file_id_template = req.body.file_id_template || '1Tgkn-zXCGwGFSNi2THWx4XmAVwE7hm6G';
        const reportType = req.body.report_type || 'ap203_form50_original';
        const inputData = req.body.input_extension || 'csv';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ 
            fileData: `https://drive.google.com/uc?export=download&id=${file_id_data}`, 
            extension: "pdf", 
            fileTemplate: `https://drive.google.com/uc?export=download&id=${file_id_template}`, 
            reportType: reportType, 
            inputData: inputData,
            referLink: referLink,
            createBy: "system-online"
        }, true);
        
        const output = `<h4 style="color:red">Before running, Please give permission to access the file "Anyone with the link".</h4><br/>\r\n<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.post('/run-report/online-excel', async (req, res) => {
        // #swagger.ignore = true
        const data = req.body.filedata || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/excel/data.csv';
        const template = req.body.template || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/excel/test-tables.xlsx';
        const reportType = req.body.report_type || 'test-tables';
        const inputData = req.body.input_extension || 'csv';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ fileData: data, extension: "xlsx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"}, true);

        const output = `<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.post('/run-report/gdrive-excel', async (req, res) => {
        // #swagger.ignore = true
        const file_id_data = req.body.file_id_data || '1T9A42OKbhx2cFEybonenSwf270PJFOg9';
        const file_id_template = req.body.file_id_template || '1CeXeSFKnK_Pw_WsoYpwpUR7ewhk0fAu7';
        const reportType = req.body.report_type || 'icetax-form';
        const inputData = req.body.input_extension || 'json';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ 
            fileData: `https://drive.google.com/uc?export=download&id=${file_id_data}`, 
            extension: "xlsx", 
            fileTemplate: `https://drive.google.com/uc?export=download&id=${file_id_template}`, 
            reportType: reportType, 
            inputData: inputData, 
            referLink: referLink,
            createBy: "system-online"
        }, true);
        
        const output = `<h4 style="color:red">Before running, Please give permission to access the file "Anyone with the link".</h4><br/>\r\n<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.post('/run-report/online-docx', async (req, res) => {
        // #swagger.ignore = true
        const data = req.body.filedata || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/docx/myTemplate.json';
        const template = req.body.template || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/docx/myTemplate.docx';
        const reportType = req.body.report_type || 'myTemplate';
        const inputData = req.body.input_extension || 'json';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ fileData: data, extension: "docx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system-online" }, true);

        const output = `<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.post('/run-report/gdrive-docx', async (req, res) => {
        // #swagger.ignore = true
        const file_id_data = req.body.file_id_data || '1FwaIKeS2ss9EakNE-8O2qbrO9fthvNPk';
        const file_id_template = req.body.file_id_template || '1btb4Osz5U-Nx1RlK33t_C-obr_I1zxmb';
        const reportType = req.body.report_type || 'myTemplate';
        const inputData = req.body.input_extension || 'json';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ 
            fileData: `https://drive.google.com/uc?export=download&id=${file_id_data}`, 
            extension: "docx", 
            fileTemplate: `https://drive.google.com/uc?export=download&id=${file_id_template}`, 
            reportType: reportType, 
            inputData: inputData,
            referLink: referLink,
            createBy: "system-online"
        }, true);
        
        const output = `<h4 style="color:red">Before running, Please give permission to access the file "Anyone with the link".</h4><br/>\r\n<a href="${result.referLink}" target="_blank">download</a>`;
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
        const logData = await mongodb.getAll("bindreports", ["job_id", "merge_job_id", "report_type", "start_datetime", "end_datetime", "status", "parameters", "extension_file", "failed_reason", "fileOutput", "createBy"],filter);

        return res.status(200).send({ data: logData});
    });

    app.get('/run-report/excel', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || './reports/excel/icetax-form.json';
        const template = req.query.ft || './reports/excel/icetax-form.xlsx';
        const reportType = req.query.t || 'icetax-form';
        const inputData = req.query.ext || 'json';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ fileData: data, extension: "xlsx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"});

        const output = `<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.get('/run-report/pdf', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || './reports/pdf/data.csv';
        const template = req.query.ft || './reports/pdf/ap203_form50_original.pdf';
        const reportType = req.query.t || 'ap203_form50_originals';
        const inputData = req.query.ext || 'csv';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ fileData: data, extension: "pdf", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"});

        const output = `<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.get('/run-report/docx', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || './reports/docx/myTemplate.json';
        const template = req.query.ft || './reports/docx/myTemplate.docx';
        const reportType = req.query.t || 'myTemplate';
        const inputData = req.query.ext || 'json';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runQueueJobs({ fileData: data, extension: "docx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"});
        
        const output = `<a href="${result.referLink}" target="_blank">download</a>`;
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
