const fs = require('fs');
const axios = require('axios');
let BookWriter = require('xltpl');
const dataReport = require('./dataReport');

async function imgToBase64(urlImagePath) {
    const ext = urlImagePath.substring(0, 9);
    const urlImage = urlImagePath.substring(9);
    const result = await axios.get(urlImage, { responseType: 'arraybuffer' }).then((res) => Buffer.from(res.data, 'base64'));
    let extension = "png";
    switch(ext) {
        case '$url#jpg:':
            extension = "jpg";
            break;
        case '$url#png:':
        default:
            extension = "png"
    }
    return {buffer: result, extension: "png"};
}

async function dataBinding(reportParams){
    try {
        let writer = new BookWriter();
        let p = Promise.resolve();
        let jsonArray = [];

        if(!reportParams.isOnline){
            switch(reportParams.inputData) {
                case 'json':
                    jsonArray = dataReport.getJsonOffline(reportParams.fileData);
                    break;
                case 'csv':
                default:
                    const jsonTableCsv = await dataReport.getCsvToJsonOffline(reportParams.fileData);
                    jsonArray = { templates: [{"sheet_index": 0, csv: jsonTableCsv}]};
            }
            
            p = writer.readFile(reportParams.fileTemplate);

        }else{

            switch(reportParams.inputData) {
                case 'json':
                    jsonArray = await dataReport.getJsonOnline(reportParams.fileData);
                    break;
                case 'csv':
                default:
                    const jsonTableCsv = await dataReport.getCsvToJsonOnline(reportParams.fileData);
                    jsonArray = { templates: [{"sheet_index": 0, csv: jsonTableCsv}]};
            }

            const resData = await axios.get(reportParams.fileTemplate, {
                responseType: 'stream'
            });
            const streamData = resData.data;
            p = writer.read(streamData);

        }

        if(jsonArray.templates){
            await Promise.all(jsonArray.templates.map(async data => { 
                await dataReport.prepareData(data, imgToBase64);
                return data;
            }));
        }

        await p.then(async() =>{

            if(jsonArray.templates){
                for(let i=0; i<jsonArray.templates.length; i++){
                    writer.renderSheet(jsonArray.templates[i]);
                }
            }
            //await writer.save(reportParams.fileOutput);
            await writer.writeBuffer().then((buffer) => { 
                fs.writeFileSync(dataReport.getSavePath(reportParams), buffer, "binary");
            });
        });

        return false;
    } catch (error) {
        console.error(`Error worth logging: ${error}`);
        throw error;
    }
}
module.exports = { dataBinding }