require('dotenv').config();
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const moment = require('moment');
const path = require('path');
const excel = require("./excel");
const reportPdf = require("./reportPdf");
const reportExcel = require("./reportExcel");
const { MongoPool } = require('./mongodb');
const { MongoServerError } = require('mongodb');


const QUEUE_NAME = 'workBinding';

if(!process.env.REDIS_URL) console.warn('REDIS_URL is not defined');
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null});

// Create a new connection in every instance
const reportQueue = new Queue(QUEUE_NAME, { connection });

const workBinding = new Worker(QUEUE_NAME, async (job)=>{
    const reportParams = job.data;
    const extension = reportParams.extension;
    try{
        switch(extension) {
            case 'xlsx':
                reportExcel.dataBinding(reportParams);
                break;
            case 'pdf':
            default:
                reportPdf.dataBinding(reportParams);
        }
    }catch (error) {
        console.log(`Error worth logging: ${error}`);
        throw error; // still want to crash
    }

},{ concurrency: 5, connection });

workBinding.on('waiting', async (job) => {
    try
    {
        MongoPool.getInstance(async (clientJob) =>{
            const collection = clientJob.db().collection('bindreports');
            await collection.updateOne({job_id: job.id}, { $set: { status: 'waiting' } });
        });
    } catch (error) {
        if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    
    console.log(`${job.id} has waiting!`);
});

workBinding.on('active', async (job) => {
    try
    {
        MongoPool.getInstance(async (clientJob) =>{
            const collection = clientJob.db().collection('bindreports');
            await collection.updateOne({job_id: job.id}, { $set: { status: 'running' } });
        });
    } catch (error) {
        if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    
    console.log(`${job.id} has active`);
});

workBinding.on('error', async (job) => {
    try
    {
        MongoPool.getInstance(async (clientJob) =>{
            const collection = clientJob.db().collection('bindreports');
            await collection.updateOne({job_id: job.id}, { $set: { status: 'error', end_datetime: moment().toDate() } });
        });
        
    } catch (error) {
        if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    
    console.log(`${job.id} has error!`);
});

workBinding.on('completed', async (job) => {
    try
    {
        MongoPool.getInstance(async (clientJob) =>{
            const collection = clientJob.db().collection('bindreports');
            await collection.updateOne({job_id: job.id}, { $set: { status: 'completed', end_datetime: moment().toDate() } });
        });
        
    } catch (error) {
        if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    
    console.log(`${job.id} has completed!`);
});

workBinding.on('failed', async (job, err) => {
    try
    {
        if(job && job.id){
            MongoPool.getInstance(async (clientJob) =>{
                const collection = clientJob.db().collection('bindreports');
                await collection.updateOne({job_id: job.id}, { $set: { status: 'failed', end_datetime: moment().toDate() } });
            });
        }
    } catch (error) {
        if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    
    console.log(`job ${(job && job.id)?job.id:''} has failed with ${err.message}`);
});

const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}, closing server...`);
    await workBinding.close();
    // Other asynchronous closings
    process.exit(0);
}

async function runQueueJobs(params = { fileData: 'data.csv', extension: "pdf", fileTemplate: 'template.pdf', reportType: 'reportType', inputData: 'csv', createBy: "system-pdf" }, isOnline = false) {
    const reportParams = Object.assign({ fileOutput: path.join('./servicefiles', `${params.reportType}${excel.newDateFileName()}.${params.extension}`), isOnline }, params);
    const job = await reportQueue.add('jobBinding', reportParams, { removeOnComplete: true, removeOnFail: true });
    const logData = { 
        report_type: reportParams.reportType,
        start_datetime: moment().toDate(),
        end_datetime: null,
        status: 'queued',
        parameters:  JSON.stringify(params),
        job_id: job.id,
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

async function removeAllJob(){
    MongoPool.getInstance(async (clientJob) =>{
        const collection = clientJob.db().collection("bindreports");
        await collection.deleteMany({});
    });
    await reportQueue.obliterate();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { runQueueJobs, removeAllJob }