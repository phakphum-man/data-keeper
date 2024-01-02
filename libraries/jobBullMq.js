require('dotenv').config();
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const moment = require('moment-timezone');
const path = require('path');
const fs = require('fs');
const googleDrive = require('./googleDrive');
const reportPdf = require("./reportPdf");
const reportExcel = require("./reportExcel");
const reportDocx = require('./reportDocx');
const dataReport = require('./dataReport');
const { db, dbGetOnce } = require('./sqllitedb');
//const { MongoPool } = require('./mongodb');
const line = require("./lineNotify");
const os = require('os');
const { v4: uuidv4 } = require('uuid');
//const { MongoServerError } = require('mongodb');
const QueueNameBinding = `work${os.hostname()}`;

if(!process.env.REDIS_URL) console.warn('REDIS_URL is not defined');
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false});

console.log(`Create Queue name: ${QueueNameBinding}`);

// Create a new connection in every instance
const bindingQueue = new Queue(QueueNameBinding, { connection, defaultJobOptions: { attempts: 2,removeOnComplete: true, removeOnFail: true } });

// Imprement Logic of Queue
const workBinding = new Worker(QueueNameBinding, async (job)=>{
    const reportParams = job.data;
    const extension = reportParams.extension;
    try{
        await job.updateProgress({ status: 'running' });
        if(job.name === 'jobExportGDrive'){
            const sourcefile = dataReport.getSavePath(reportParams);
            const uploadResult = await googleDrive.exportToDriveAndShare(sourcefile, process.env.GDRIVE_PARENT_ID);

            if(uploadResult && uploadResult.id){
                let upParams = reportParams;
                upParams.referLink = `https://drive.google.com/uc?export=download&id=${uploadResult.id}`;
                db.run(`UPDATE bindreports set
                    parameters = ?
                    WHERE final_job_id = ?`,
                    [JSON.stringify(upParams), job.id ],
                    (err, result) => {
                        if (err){
                            console.error(err);
                            return;
                        }
                        console.log(`SQLite update success (status=completed)`);
                        return;
                    });
                fs.unlink(sourcefile, (err) => {
                    if (err) throw err;
                });
            }
            return true;
        } else {
            switch(extension) {
                case 'xlsx':
                    return reportExcel.dataBinding(reportParams);
                case 'docx':
                    if(job.name === 'jobMergeFiles'){
                        return reportDocx.mergeDocx(reportParams);
                    } else {
                        return reportDocx.dataBinding(reportParams);
                    }
                case 'pdf':
                default:
                    if(job.name === 'jobMergeFiles'){
                        return reportPdf.mergePdf(reportParams);
                    } else {
                        return reportPdf.dataBinding(reportParams);
                    }
            }
        }
    }catch (error) {
        console.log(`Error worth logging: ${error}`);
        throw error; // still want to crash
    }

},{ connection, autorun: true, useWorkerThreads: true });

workBinding.on('waiting', async (job) => {
    try
    {
        if(job && job.id) {
            db.serialize(() => {
                db.run(`UPDATE bindreports set 
                status = COALESCE(?,status)
                WHERE job_id = ?`,
                ['waiting', job.id],
                (err, result) => {
                    if (err){
                        console.error(err);
                        return;
                    }
                    console.log(`SQLite update success (status=waiting)`);
                    return;
                });
            });
            // MongoPool.getInstance(async (clientJob) =>{
            //     const collection = clientJob.db().collection('bindreports');
            //     await collection.updateOne({job_id: job.id}, { $set: { status: 'waiting' } });
            // });
        }
    } catch (error) {
        // if (error instanceof MongoServerError) {
        //     console.log(`Error worth logging: ${error}`); // special case for some reason
        // }
        throw error; // still want to crash
    }
    
    console.log(`${job?.id} has waiting!`);
});

workBinding.on('active', async ( job, prev ) => {
    try
    {
        if(job && job.id) {
            db.serialize(() => {
                db.run(`UPDATE bindreports set 
                status = COALESCE(?,status)
                WHERE job_id = ?`,
                ['active', job.id ],
                (err, result) => {
                    if (err){
                        console.error(err);
                        return;
                    }
                    console.log(`SQLite update success (status=active)`);
                    return;
                });
            });
            // MongoPool.getInstance(async (clientJob) =>{
            //     const collection = clientJob.db().collection('bindreports');
            //     await collection.updateOne({job_id: job.id}, { $set: { status: 'active' } });
            // });
        }
    } catch (error) {
        // if (error instanceof MongoServerError) {
        //     console.log(`Error worth logging: ${error}`); // special case for some reason
        // }
        throw error;
    }
    
    console.log(`${job?.id} has active`);
});

workBinding.on('progress', async ( job, data ) => {
    try
    {
        if(job && job.id) {
            db.serialize(() => {
                db.run(`UPDATE bindreports set 
                status = COALESCE(?,status)
                WHERE (job_id = ? OR merge_job_id = ?)`,
                [ data.status, job.id, job.id],
                (err, result) => {
                    if (err){
                        console.error(err);
                        return;
                    }
                    console.log(`SQLite update success (status=${data.status})`);
                    return;
                });
            });

            // MongoPool.getInstance(async (clientJob) =>{
            //     const collection = clientJob.db().collection('bindreports');
            //     const findResult = await collection.findOne({
            //         $or:[
            //             { job_id: job.id }, 
            //             { merge_job_id: job.id }
            //         ]
            //     });
            //     if(findResult) {
            //         const jobId = findResult.job_id;
            //         await collection.updateOne({ job_id: jobId }, { $set: { status: data.status } });
            //     }
            // });
        }
    } catch (error) {
        // if (error instanceof MongoServerError) {
        //     console.log(`Error worth logging: ${error}`); // special case for some reason
        // }
        throw error;
    }
    
    console.log(`${job?.id} reported progress ${ JSON.stringify(data)}`);
});

workBinding.on('completed', async ( job, returnvalue ) => {
    try
    {
        if(job && job.id && returnvalue) {
            db.serialize(async() => {
                let findResult = await dbGetOnce("SELECT job_id, parameters, report_type, start_datetime FROM bindreports WHERE final_job_id = ?", [job.id]);

                if(findResult) {
                    const params = JSON.parse(findResult.parameters);
                    const fileSavePath = params.referLink;//dataReport.getSavePath(params);

                    findResult.end_datetime = moment().toISOString();
                    db.run(`UPDATE bindreports set 
                    status = COALESCE(?,status),
                    fileOutput = COALESCE(?,fileOutput),
                    end_datetime = COALESCE(?,end_datetime)
                    WHERE final_job_id = ?`,
                    ['completed', fileSavePath, findResult.end_datetime, job.id ],
                    (err, result) => {
                        if (err){
                            console.error(err);
                            return;
                        }
                        console.log(`SQLite update success (status=completed)`);
                        return;
                    });

                    sendLineNotify(findResult, `Result is successful.\n(${params.referLink})`);
                }
            });

            // MongoPool.getInstance(async (clientJob) =>{
            //     const collection = clientJob.db().collection('bindreports');
            //     const findResult = await collection.findOne({
            //         $or:[
            //             { job_id: job.id }, 
            //             { merge_job_id: job.id }
            //         ]
            //     });
            //     if(findResult) {
            //         const jobId = findResult.job_id;
            //         const params = JSON.parse(findResult.parameters);
            //         const fileSavePath = dataReport.getSavePath(params);
            //         await collection.updateOne({job_id: jobId}, { $set: { fileOutput: fileSavePath, status: 'completed', end_datetime: moment().toDate() } });
            //         sendLineNotify(findResult, `Result is successful.\n(${params.referLink})`);
            //     }
            // });
        }else if(job && job.id && returnvalue === false) {
            db.serialize(async() => {
                const findResult = await dbGetOnce("SELECT parameters, extension_file, merge_job_id FROM bindreports WHERE (job_id = ? OR merge_job_id = ?)", [job.id, job.id]);

                if(findResult && findResult.merge_job_id === null && (findResult.extension_file === 'docx' || findResult.extension_file === "pdf")) {
                    const reportParams = JSON.parse(findResult.parameters);
                    const jobId = await runJobMergeFiles(reportParams);

                    db.run(`UPDATE bindreports set 
                    merge_job_id = COALESCE(?, merge_job_id)
                    WHERE job_id = ?`,
                    [ jobId , job.id ],
                    (err, result) => {
                        if (err){
                            console.error(err);
                            return;
                        }
                        console.log(`SQLite update success (merge_job_id = ${jobId})`);
                        return;
                    });
                }else if(findResult){
                    const reportParams = JSON.parse(findResult.parameters);
                    const jobId = await runJobExportGDrive(reportParams);

                    db.run(`UPDATE bindreports set 
                    final_job_id = COALESCE(?, final_job_id)
                    WHERE (job_id = ? OR merge_job_id = ?)`,
                    [ jobId, job.id , job.id ],
                    (err, result) => {
                        if (err){
                            console.error(err);
                            return;
                        }
                        console.log(`SQLite update success (final_job_id = ${jobId})`);
                        return;
                    });
                }
            });
            // MongoPool.getInstance(async (clientJob) =>{
            //     const collection = clientJob.db().collection('bindreports');
            //     const findResult = await collection.findOne({ job_id: job.id, $or:[ 
            //         {extension_file: "docx"},
            //         {extension_file: "pdf"}
            //     ]});
            //     if(findResult) {
            //         const jobId = await runJobMergeFiles(JSON.parse(findResult.parameters));
            //         await collection.updateOne({job_id: job.id}, { $set: { merge_job_id: jobId } });
            //     }
            // });
        }
    } catch (error) {
        // if (error instanceof MongoServerError) {
        //     console.log(`Error worth logging: ${error}`); // special case for some reason
        // }
        throw error;
    }
    
    console.log(`${job?.id} has completed!`);
});

workBinding.on('failed', async ( job, err ) => {
    try
    {
        if(job && job.id) {
            db.serialize(async() => {
                const findResult = await dbGetOnce("SELECT job_id, parameters, report_type, start_datetime FROM bindreports WHERE (job_id = ? OR merge_job_id = ? OR final_job_id = ?)", [ job.id, job.id, job.id ]);

                if(findResult) {
                    const jobId = findResult.job_id;
                    findResult.end_datetime = moment().toISOString();
                    db.run(`UPDATE bindreports set 
                    status = COALESCE(?,status),
                    failed_reason = COALESCE(?,failed_reason),
                    end_datetime = COALESCE(?,end_datetime)
                    WHERE job_id = ?`,
                    ['failed', err.message, findResult.end_datetime, jobId ],
                    (err, result) => {
                        if (err){
                            console.error(err);
                            return;
                        }
                        console.log(`SQLite update success (status=failed)`);
                        return;
                    });

                    sendLineNotify(findResult, "Result is failed.");
                }
            });
            // MongoPool.getInstance(async (clientJob) =>{
            //     const collection = clientJob.db().collection('bindreports');
            //     const findResult = await collection.findOne({
            //         $or:[
            //             { job_id: job.id }, 
            //             { merge_job_id: job.id }
            //         ]
            //     });
            //     if(findResult) {
            //         await collection.updateOne({job_id: findResult.job_id}, { $set: { status: 'failed', failed_reason: err.message, end_datetime: moment().toDate() } });
            //         sendLineNotify(findResult, "Result is failed.");
            //     }
            // });
        }
    } catch (error) {
        // if (error instanceof MongoServerError) {
        //     console.log(`Error worth logging: ${error}`); // special case for some reason
        // }
        throw error;
    }
    console.log(`job ${job?.id} has failed with ${err.message}`);
});

async function runJobQueue(params = { fileData: 'data.csv', extension: "pdf", fileTemplate: 'template.pdf', reportType: 'reportType', inputData: 'csv', referLink: '', createBy: "system-pdf" }, isOnline = false) {
    const fileOutput = path.join((process.env.NODE_ENV !== 'production')?'./mnt':'/mnt','servicefiles', `${uuidv4()}.${params.extension}`);
    let reportParams = Object.assign({ fileOutput: fileOutput, isOnline }, params);
    const fileName = `${params.reportType}${moment().format("YYYY-MM-DD_HHmmss")}.${params.extension}`;
    reportParams.referLink = `${params.referLink}${fileName}`;
    const job = await bindingQueue.add('jobBinding', reportParams);

    const logData = { 
        report_type: reportParams.reportType,
        start_datetime: moment().toDate(),
        end_datetime: null,
        status: 'queued',
        parameters:  JSON.stringify(reportParams),
        job_id: job.id,
        extension_file: reportParams.extension,
        fileOutput: reportParams.fileOutput,
        createBy: reportParams.createBy
    };

    try
    {
        db.serialize(() => {
            db.run(`INSERT INTO bindreports (report_type, start_datetime, end_datetime, status, parameters, job_id, extension_file, fileOutput, createBy) 
            VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [logData.report_type, logData.start_datetime.toISOString(), logData.end_datetime, logData.status, logData.parameters, logData.job_id, logData.extension_file, logData.fileOutput, logData.createBy],
            (err, result) => {
                if (err){
                    console.error(err);
                    return;
                }
                console.log(`SQLite update success (status=queue)`);
                return;
            });
        });

        // MongoPool.getInstance(async (clientJob) =>{
        //     const collection = clientJob.db().collection("bindreports");
        //     await collection.insertOne(logData);
        // });
        return reportParams;
    } catch (error) {
        // if (error instanceof MongoServerError) {
        //   console.log(`Error worth logging: ${error}`); // special case for some reason
        // }
        throw error; // still want to crash
    }
    
}

async function runJobMergeFiles(reportParams){
    const job = await bindingQueue.add('jobMergeFiles', reportParams);
    return job.id;
}

async function runJobExportGDrive(reportParams){
    const job = await bindingQueue.add('jobExportGDrive', reportParams);
    return job.id;
}

async function removeAllJob(){
    db.serialize(() => {
        db.run(`DELETE FROM bindreports`,
        (err, result) => {
            if (err){
                console.error(err);
                return;
            }
            console.log(`SQLite delete success (removeAllJob)`);
            return;
        });
        db.run(`DELETE FROM SQLITE_SEQUENCE WHERE name='bindreports'`);
    });
    // MongoPool.getInstance(async (clientJob) =>{
    //     const collection = clientJob.db().collection("bindreports");
    //     await collection.deleteMany({});
    // });
    await bindingQueue.obliterate();
}

const sendLineNotify = (findResult, message) => {
    moment.locale('th');
    const params = JSON.parse(findResult.parameters);

    const infos = [
        "",
        `Job(${findResult.job_id}) Report`,
        "",
        `Type : ${findResult.report_type} (${params.extension})`,
        `At Time : ${moment(findResult.start_datetime).tz(process.env.TZ).format('LTS')} - ${moment(findResult.end_datetime).tz(process.env.TZ).format('LTS')}`,
        "",
        message,
    ];
    line.sendMessage(process.env.LINE_TOKEN, `${moment().format('dddd, Do MMMM YYYY')}\n${infos.join("\n")}`);
};

const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}, closing server...`);
    db.close((err) => {
        if (err) console.error(err.message);
        console.log('Close the SQlite database connection.');
    });

    await bindingQueue.close();
    await bindingQueue.disconnect();

    await workBinding.close();
    await workBinding.disconnect();
    // Other asynchronous closings
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { runJobQueue, runJobMergeFiles, removeAllJob, workQueue: workBinding }