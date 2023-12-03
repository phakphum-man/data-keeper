const { Queue, Worker } = require('bullmq');

// Create a new connection in every instance
const myQueue = new Queue('foo', { connection: {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
}});

const worker = new Worker('foo', async (job)=>{
    // Will print { foo: 'bar'} for the first job
    // and { qux: 'baz' } for the second.
    console.log(job.data);
  }, { connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
}});

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