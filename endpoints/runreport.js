require('dotenv').config();
const path = require('path');
const fs = require('fs');
const googleDrive = require('../libraries/googleDrive');
const { db, sqlInParam, dbGetOnce, dbGetAll, migrateDefault } = require('../libraries/sqllitedb');
// const mongo = require('mongodb');
// const mongodb = require('../libraries/mongodb');
const { runJobQueue, removeAllJob } = require("../libraries/jobBullMq");

module.exports = function(app) {
    app.get('/run-report', async(req, res) => {
        // #swagger.ignore = true

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        let data = fs.readFileSync(`${rootPath}/template.html`, 'utf8');
        
        // HTML Content
        return res.send(data);
    });

    app.get('/run-report/gdrive', async(req, res) => {
        // #swagger.ignore = true

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        let tabs = [{
            id: 'pdf',
            name: '',
            tempate: '',
            data: '',
            class: true
        },{
            id: 'xlsx',
            name: '',
            tempate: '',
            data: '',
            class: false
        },{
            id: 'docx',
            name: '',
            tempate: '',
            data: '',
            class: false
        }];

        let data = fs.readFileSync(`${rootPath}/gdrive.html`, 'utf8');
        if(req.query.tid){
            const temp = await dbGetOnce("SELECT * FROM templates WHERE id = ?",[req.query.tid]);
            // const filter = { "_id": new mongo.ObjectId(req.query.tid) };
            // const temp = await mongodb.get("templates", ["type", "linkTemplate", "linkFileData", "extensionFile"],filter);

            if(temp && temp.extensionFile){
                //set default to none select
                tabs[0].class = false;

                let tab = tabs.find(t => t.id == temp.extensionFile);
                if(temp.type){
                    tab.name = temp.type;
                }
                if(temp.linkTemplate){
                    tab.tempate = temp.linkTemplate;
                }
                if(temp.linkFileData){
                    tab.data = temp.linkFileData;
                }
                tab.class = true;
            }
        }

        tabs.forEach((t) => {
            data = data.replace(`{{${t.id}FileType}}`,t.name);
            data = data.replace(`{{${t.id}FileTemplate}}`,t.tempate);
            data = data.replace(`{{${t.id}FileData}}`,t.data);
            data = data.replaceAll(`{{${t.id}ClassHtml}}`, t.class ? 'class="active"': '');
        });
        // HTML Content
        return res.send(data);
    });

    app.post('/run-report/online-pdf', async (req, res) => {
        // #swagger.ignore = true
        const data = req.body.filedata || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/pdf/data.csv';
        const template = req.body.template || 'https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/pdf/ap203_form50_original.pdf';
        const reportType = req.body.report_type || 'ap203_form50_original';
        const inputData = req.body.input_extension || 'csv';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runJobQueue({ fileData: data, extension: "pdf", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system-online" }, true);

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
        const result = await runJobQueue({ 
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
        const result = await runJobQueue({ fileData: data, extension: "xlsx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"}, true);

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
        const result = await runJobQueue({ 
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
        const result = await runJobQueue({ fileData: data, extension: "docx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system-online" }, true);

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
        const result = await runJobQueue({ 
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

        if( by !== '' ) {
            filter = Object.assign({ createBy: by }, filter);
        }

        let logData = await dbGetAll("SELECT job_id, merge_job_id, report_type, datetime(start_datetime,'LOCALTIME') start_datetime, COALESCE(datetime(end_datetime,'LOCALTIME'),'...') end_datetime, status, parameters, failed_reason, fileOutput, createBy extension_file FROM bindreports ORDER BY start_datetime DESC");
        // let logData = await mongodb.getAll("bindreports", ["job_id", "merge_job_id", "report_type", "start_datetime", "end_datetime", "status", "parameters", "extension_file", "failed_reason", "fileOutput", "createBy"],filter, { start_datetime: -1});

        const dns = `${req.protocol}://${req.get('host')}`;
        let deleteJobIds = [];
        logData.forEach((x) => {
            const p = JSON.parse(x.parameters);
            if(p.referLink.startsWith(dns) && x.status == "completed" && fs.existsSync(x.fileOutput) === false) {
                deleteJobIds.push(x.job_id);
            }
        });

        if(deleteJobIds.length > 0){
            db.serialize(() => {
                db.run(sqlInParam(`DELETE FROM bindreports WHERE job_id IN(?#)`, deleteJobIds),
                deleteJobIds);
            });
            //await mongodb.deleteOne("bindreports", { "job_id": {"$in": deleteJobIds}});

            deleteJobIds.forEach((jobId)=>{
                logData.splice(logData.findIndex(e => e.job_id === jobId), 1);
            });
        }

        return res.status(200).send({ data: logData});
    });

    app.get('/run-report/getTemplates', async (req, res) => {
        // #swagger.ignore = true
        let list = await dbGetAll("SELECT id as _id, type, extensionFile, description FROM templates");
        //let list = await mongodb.getAll("templates", ["_id","type", "extensionFile", "description"]);

        return res.status(200).send({ data: list});
    });

    app.get('/run-report/excel', async (req, res) => {
        // #swagger.ignore = true
        const data = req.query.fd || './reports/excel/icetax-form.json';
        const template = req.query.ft || './reports/excel/icetax-form.xlsx';
        const reportType = req.query.t || 'icetax-form';
        const inputData = req.query.ext || 'json';

        const referLink = `${req.protocol}://${req.get('host')}/download?f=`;
        const result = await runJobQueue({ fileData: data, extension: "xlsx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"});

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
        const result = await runJobQueue({ fileData: data, extension: "pdf", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"});

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
        const result = await runJobQueue({ fileData: data, extension: "docx", fileTemplate: template, reportType: reportType, inputData: inputData, referLink: referLink, createBy: "system"});
        
        const output = `<a href="${result.referLink}" target="_blank">download</a>`;
        return res.status(200).send(output);
    });

    app.get('/run-report/remove', (req, res) => {
        
        const file = req.query.f || 'output.pdf';
        const sourcefile = `${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${file}`;
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

    app.get('/run-report/migrate', async (req, res) => {
        // #swagger.ignore = true

        db.serialize(async() => {
            await migrateDefault();
        });
        return res.status(200).send(`database migrated.`);
    });

    app.get('/run-report/up-gdrive', async(req, res) => {
        
        const file = req.query.f || 'ใบสั่งซื้อ2024-01-01_115027.pdf';
        const sourcefile = `${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${file}`;
        const upload = await googleDrive.exportToDriveAndShare("1dY1s1gMMHShjlsmiqA6DnzWjRK7DZQpc", sourcefile);
        return res.status(200).send(`upload file <a href="https://drive.google.com/uc?export=download&id=${upload.id}">${file}</a> to gdrive.`);
    });
}