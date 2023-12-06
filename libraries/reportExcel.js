const fs = require('fs');
const axios = require('axios');
const csv = require('csvtojson');
const XlsxTemplate = require('xlsx-template');

async function imgToBase64(urlImagePath) {
    return await axios.get(urlImagePath, { responseType: 'arraybuffer' }).then((res) => Buffer.from(res.data, 'base64'));
}

async function dataBinding(reportParams){
    try 
    {
        let jsonArray = [];
        let excelBytes = Buffer.from('');

        if(!reportParams.isOnline){

            jsonArray = await csv().fromFile(reportParams.fileData);
            excelBytes = fs.readFileSync(reportParams.fileTemplate);

        }else{
            const resData = await axios.get(reportParams.fileData, {
                responseType: 'stream'
            });
            const streamData = resData.data;
            jsonArray = await csv().fromStream(streamData);

            excelBytes = await axios.get(reportParams.fileTemplate, { responseType: 'arraybuffer' }).then((res) => res.data);
        }

        jsonArray = await Promise.all(jsonArray.map(async (item) => {
            const obj = Object.assign({}, item);
            const imgUrl = Object.keys(obj).filter(x => (x.indexOf(":url") > -1));
            await Promise.all(imgUrl.map(async url => {
                obj[url.replace(":","")] = await imgToBase64(obj[url]);
                delete obj[url];
            }));
            
            return obj; 
        }));
        
        var t = new XlsxTemplate(excelBytes);
        var data = {
            csv: jsonArray
        };
        t.substitute(1, data);
        var newData = t.generate();
        
        fs.writeFileSync(reportParams.fileOutput, newData, "binary");

    } catch (error) {
        console.log(`Error worth logging: ${error}`);
        throw error; // still want to crash
    }
}

module.exports = { dataBinding }