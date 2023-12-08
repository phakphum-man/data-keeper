require('dotenv').config();
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const moment = require('moment');
const path = require('path');
const excel = require("./excel");
const reportPdf = require("./reportPdf");
const reportExcel = require("./reportExcel");
const { MongoPool } = require('./mongodb');
const os = require('os')
const { MongoServerError } = require('mongodb');
const { json } = require('express');

const QueueNameBinding = `work${os.hostname()}`;

if(!process.env.REDIS_URL) console.warn('REDIS_URL is not defined');
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null});

// Create a new connection in every instance
const bindingQueue = new Queue(QueueNameBinding, { connection });

// Imprement Logic of Queue
const workBinding = new Worker(QueueNameBinding, async (job)=>{
    const reportParams = job.data;
    const extension = reportParams.extension;
    try{
        await job.updateProgress({ status: 'running' });
        switch(extension) {
            case 'xlsx':
                return reportExcel.dataBinding(reportParams);
                break;
            case 'pdf':
            default:
                if(job.name === 'jobMergePdf'){
                    return reportPdf.mergePdf(reportParams);
                }else{
                    return reportPdf.dataBinding(reportParams);
                }
        }
    }catch (error) {
        console.log(`Error worth logging: ${error}`);
        throw error; // still want to crash
    }

},{ concurrency: 2, connection });

workBinding.on('waiting', async (job) => {
    try
    {
        if(job && job.id) {
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');
                await collection.updateOne({job_id: job.id}, { $set: { status: 'waiting' } });
            });
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    
    console.log(`${job?.id} has waiting!`);
});

workBinding.on('active', async ( job, prev ) => {
    try
    {
        if(job && job.id) {
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');
                await collection.updateOne({job_id: job.id}, { $set: { status: 'active' } });
            });
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
            console.log(`Error worth logging: ${error}`); // special case for some reason
        }
    }
    
    console.log(`${job?.id} has active`);
});

workBinding.on('progress', async ( job, data ) => {
    try
    {
        if(job && job.id) {
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');

                const findResult = await collection.findOne({
                    $or:[
                        { job_id: job.id }, 
                        { merge_job_id: job.id }
                    ]
                });
                if(findResult) {
                    const jobId = findResult.job_id;
                    await collection.updateOne({ job_id: jobId }, { $set: { status: data.status } });
                }
                
            });
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
            console.log(`Error worth logging: ${error}`); // special case for some reason
        }
    }
    
    console.log(`${job?.id} reported progress ${ JSON.stringify(data)}`);
});

workBinding.on('error', async (job) => {
    try
    {
        if(job && job.id) {
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');
                await collection.updateOne({job_id: job.id}, { $set: { status: 'error', end_datetime: moment().toDate() } });
            });
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
            console.log(`Error worth logging: ${error}`); // special case for some reason
        }
    }
    
    console.log(`${job?.id} has error!`);
});

workBinding.on('completed', async ( job, returnvalue ) => {
    try
    {
        if(job && job.id && returnvalue) {
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');

                const findResult = await collection.findOne({
                    $or:[
                        { job_id: job.id }, 
                        { merge_job_id: job.id }
                    ]
                });
                if(findResult) {
                    const jobId = findResult.job_id;
                    await collection.updateOne({job_id: jobId}, { $set: { status: 'completed', end_datetime: moment().toDate() } });
                }
            });
        }else if(job && job.id && returnvalue === false) {
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');
                const findResult = await collection.findOne({ job_id: job.id, extension_file: "pdf"});
                if(findResult) {
                    const jobId = await runMergePdfJobs(JSON.parse(findResult.parameters));
                    await collection.updateOne({job_id: job.id}, { $set: { merge_job_id: jobId } });
                }
            });
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
            console.log(`Error worth logging: ${error}`); // special case for some reason
        }
    }
    
    console.log(`${job?.id} has completed!`);
});

workBinding.on('failed', async ( job, err ) => {
    try
    {
        if(job && job.id) {
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');
                await collection.updateOne({job_id: job.id}, { $set: { status: 'failed', failed_reason: err.message, end_datetime: moment().toDate() } });
            });
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
            console.log(`Error worth logging: ${error}`); // special case for some reason
        }
    }
    console.log(`job ${job?.id} has failed with ${err.message}`);
});

const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}, closing server...`);
    await workBinding.close();
    // Other asynchronous closings
    process.exit(0);
}

async function runQueueJobs(params = { fileData: 'data.csv', extension: "pdf", fileTemplate: 'template.pdf', reportType: 'reportType', inputData: 'csv', createBy: "system-pdf" }, isOnline = false) {
    const reportParams = Object.assign({ fileOutput: path.join('./servicefiles', `${params.reportType}${excel.newDateFileName()}.${params.extension}`), isOnline }, params);
    const job = await bindingQueue.add('jobBinding', reportParams, { removeOnComplete: true, removeOnFail: true });
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
        MongoPool.getInstance(async (clientJob) =>{
            const collection = clientJob.db().collection("bindreports");
            await collection.insertOne(logData);
        });
        return reportParams;
    } catch (error) {
        if (error instanceof MongoServerError) {
          console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    
}

async function runMergePdfJobs(reportParams){
    const job = await bindingQueue.add('jobMergePdf', reportParams, { removeOnComplete: true, removeOnFail: true });
    return job.id;
}

async function removeAllJob(){
    MongoPool.getInstance(async (clientJob) =>{
        const collection = clientJob.db().collection("bindreports");
        await collection.deleteMany({});
    });
    await bindingQueue.obliterate();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { runQueueJobs, runMergePdfJobs, removeAllJob }