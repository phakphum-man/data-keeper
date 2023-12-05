require('dotenv').config();
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const csv = require('csvtojson');
const excel = require("../libraries/excel");
const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { MongoPool } = require('./mongodb');
const { MongoClient, MongoServerError } = require('mongodb');


const QUEUE_NAME = 'workBinding';

if(!process.env.REDIS_URL) console.warn('REDIS_URL is not defined');
const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null});

// Create a new connection in every instance
const reportQueue = new Queue(QUEUE_NAME, { connection });

const workBinding = new Worker(QUEUE_NAME, async (job)=>{
    const reportParams = job.data;


    let jsonArray = [];
    let formPdfBytes = Buffer.from('');

    if(!reportParams.isOnline){

        jsonArray = await csv().fromFile(reportParams.fileData);
        formPdfBytes = fs.readFileSync(reportParams.fileTemplate);

    }else{
        const resData = await axios.get(reportParams.fileData, {
            responseType: 'stream'
        });
        const streamData = resData.data;
        jsonArray = await csv().fromStream(streamData);

        formPdfBytes = await axios.get(reportParams.fileTemplate, { responseType: 'arraybuffer' }).then((res) => res.data);
    }

    let pdfsToMerge = [];
    await Promise.all(jsonArray.map(async (dataBinding, index) => {

        // Load a PDF with form fields
        const pdfDoc = await PDFDocument.load(formPdfBytes);

        pdfDoc.registerFontkit(fontkit);

        //load font and embed it to pdf document
        const fontBytes = fs.readFileSync(path.join('./reports','pdf','fonts', 'THSarabunNew.ttf'));
        const customFont = await pdfDoc.embedFont(fontBytes);

        // Get the form containing all the fields
        const form = pdfDoc.getForm();

        Object.entries(dataBinding).forEach(([key, value]) => {
            // Get all fields in the PDF by their names
            const textField = form.getTextField(key);
            
            // Fill in the basic info fields
            textField.setText(value);

            textField.updateAppearances(customFont);
        });
        
        form.flatten();
        
        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytesAtOnePage = await pdfDoc.save();
        // const dirPath = path.dirname(reportParams.fileOutput);
        // const extension = path.extname(reportParams.fileOutput);
        // const fileName = path.basename(reportParams.fileOutput, extension);
        // const fileSavePath = path.join(dirPath, `${fileName}_${index}${extension}`);
        // fs.writeFileSync(fileSavePath, pdfBytesAtOnePage);
        pdfsToMerge.push(pdfBytesAtOnePage);
    }));
    
    const mergedPdf = await PDFDocument.create(); 
    for (let i = 0; i < pdfsToMerge.length; i++) {
        //const pdfBytes = fs.readFileSync(pdfsToMerge[i]);
        const pdf = await PDFDocument.load(pdfsToMerge[i]); 
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
            mergedPdf.addPage(page); 
        }); 
    } 

    const pdfMergeBytes = await mergedPdf.save();
    fs.writeFileSync(reportParams.fileOutput, pdfMergeBytes);

},{ connection});

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
    //await update('bindreports', {job_id: job.id}, { status: 'waiting' });
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
    //await update('bindreports', {job_id: job.id}, { status: 'running' });
    console.log(`${job.id} has active`);
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
    //await update('bindreports', {job_id: job.id}, { status: 'completed' });
    console.log(`${job.id} has completed!`);
});

workBinding.on('failed', async (job, err) => {
    try
    {
        MongoPool.getInstance(async (clientJob) =>{
            const collection = clientJob.db().collection('bindreports');
            await collection.updateOne({job_id: job.id}, { $set: { status: 'failed', end_datetime: moment().toDate() } });
        });
        
    } catch (error) {
        if (error instanceof MongoServerError) {
        console.log(`Error worth logging: ${error}`); // special case for some reason
        }
        throw error; // still want to crash
    }
    //await update('bindreports', {job_id: job.id}, { status: 'failed' });
    console.log(`${job.id} has failed with ${err.message}`);
});
   
async function runPdfJobs(params = { fileData: 'data.csv', fileTemplate: 'template.pdf', createBy: "system-pdf" }, isOnline = false) {
    const extension = path.extname(params.fileTemplate);
    const fileName = path.basename(params.fileTemplate, extension);
    const reportParams = Object.assign({ fileOutput: path.join('./servicefiles', `${fileName}${excel.newDateFileName()}${extension}`), isOnline }, params);
    const jobPdf = await reportQueue.add('jobPdfBinding', reportParams, { removeOnComplete: true, removeOnFail: 1000 });
    const logData = { 
        report_type: fileName,
        start_datetime: moment().toDate(),
        end_datetime: null,
        status: 'queued',
        parameters:  JSON.stringify(params),
        job_id: jobPdf.id,
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
    
    //await insert("bindreports", data);
}

async function removeAllJob(){
    MongoPool.getInstance(async (clientJob) =>{
        const collection = clientJob.db().collection("bindreports");
        await collection.deleteMany({});
    });
    await reportQueue.obliterate();
}
module.exports = { runPdfJobs, removeAllJob }