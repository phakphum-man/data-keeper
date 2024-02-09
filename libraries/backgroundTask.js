require('dotenv').config();
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const os = require('os');
const path = require('path');

const QueueNameBinding = `work${os.hostname()}`;

if(!process.env.REDIS_URL) console.warn('REDIS_URL is not defined');
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false});

console.log(`Create Queue name: ${QueueNameBinding}`);

const bindingQueue = new Queue(QueueNameBinding, { connection });


//clearAllJobs();
startBackgroundRun();

//const processorFile = path.join(__dirname, 'mangaScrape.js');
const processorFile = path.join(__dirname, 'stockScrape.js');

// Imprement Logic of Queue
const workBinding = new Worker(QueueNameBinding, processorFile,{ connection, autorun: true, useWorkerThreads: true });

workBinding.on('waiting', async (job) => {
    console.log(`${job?.id} has waiting!`);
});

workBinding.on('active', async ( job, prev ) => {
    console.log(`${job?.id} has active`);
});

workBinding.on('progress', async ( job, data ) => {
    console.log(`${job?.id} reported progress ${ JSON.stringify(data)}`);
});

workBinding.on('completed', async ( job, returnvalue ) => {
    console.log(`${job?.id} has completed!`);
});

workBinding.on('failed', async ( job, err ) => {
    console.log(`job ${job?.id} has failed with ${err.message}`);
});

const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}, closing server...`);

    await workBinding.close();
    await workBinding.disconnect();

    await bindingQueue.close();
    await bindingQueue.disconnect();

    // Other asynchronous closings
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

async function clearAllJobs(){
    await bindingQueue.obliterate();
    console.log('...clear All Jobs.');
}

async function startBackgroundRun() {
    const job = await bindingQueue.add('jobSyncAll', {});
    console.log(`Start JobId:${job.id}`);
}