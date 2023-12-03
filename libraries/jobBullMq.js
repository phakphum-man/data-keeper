const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

const QUEUE_NAME = 'default';

if(!process.env.REDIS_URL) console.warn('REDIS_URL is not defined');
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null});

// Create a new connection in every instance
const myQueue = new Queue(QUEUE_NAME, { connection });

const worker = new Worker(QUEUE_NAME, async (job)=>{
    // Will print { foo: 'bar'} for the first job
    // and { qux: 'baz' } for the second.
    console.log(job.data);
  }, { connection});

worker.on('completed', job => {
    console.log(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`${job.id} has failed with ${err.message}`);
});

async function addJobs() {
    await myQueue.add('myJobName', { foo: 'bar' });
    await myQueue.add('myJobName', { qux: 'baz' });
}

module.exports = { addJobs }