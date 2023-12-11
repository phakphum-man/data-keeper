const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createReport } = require('docx-templates');
const DocxMerger = require('docx-merger');
const dataReport = require('./dataReport');

async function imgToBytes(url) {
    const ext = url.substring(0, 8);
    let extension = null;
    switch(ext) {
        case '$url#gif':
            extension = ".gif";
            break;
        case '$url#jpg':
            extension = ".jpg";
            break;
        case '$url#png':
            extension = ".png";
            break;
        default:
            extension = extension
    }

    let dimens = url.substring(0, url.indexOf(':'));
    dimens = dimens.replace(`${ext}#`, '');

    const dimensions = dimens.split('x');

    if(extension && dimensions.length > 1) {
        const urlImage = url.substring((url.indexOf(':') + 1));
        const result = await axios.get(urlImage, { responseType: 'arraybuffer' }).then((res) => Buffer.from(res.data, 'base64'));
        
        
        return { width: parseInt(dimensions[0]), height: parseInt(dimensions[1]), data: result, extension: '.gif' };
    } else {
        // is not support
        return url;
    }
}

async function dataBinding(reportParams){
    try {

        let jsonArray = [];
        let formDocxBytes = Buffer.from('');
        // 1. read template file
        if(!reportParams.isOnline){
            jsonArray = dataReport.getJsonOffline(reportParams.fileData);
            formDocxBytes = fs.readFileSync(reportParams.fileTemplate);
        } else {
            jsonArray = await dataReport.getJsonOnline(reportParams.fileData);
            formDocxBytes = await axios.get(reportParams.fileTemplate, { responseType: 'arraybuffer' }).then((res) => res.data);
        }

        const dirPath = path.dirname(reportParams.fileOutput);
        const extension = path.extname(reportParams.fileOutput);
        const fileName = path.basename(reportParams.fileOutput, extension);
        await Promise.all(jsonArray.templates.map(async (dataBinding, index) => {
            // 2. process the template
            const docUint8Array = await createReport({ template: formDocxBytes, data: dataBinding, 
                additionalJsContext: {
                    qrCode: imgToBytes
                },
                cmdDelimiter: ['{%', '%}']
            });

            // 3. save output
            const fileSavePath = path.join(dirPath, `${fileName}_${index}${extension}`);
            fs.writeFileSync(fileSavePath, docUint8Array);
        }));

    } catch (errors) {
        throw errors;
    }

    return false;
}

async function mergeDocx(reportParams){
    const dirPath = path.dirname(reportParams.fileOutput);
    const extension = path.extname(reportParams.fileOutput);
    const fileName = path.basename(reportParams.fileOutput, extension);

    try {
        let jsonArray = [];
        if(!reportParams.isOnline){
            jsonArray = await dataReport.getJsonOffline(reportParams.fileData);
        }else{
            jsonArray = await dataReport.getJsonOnline(reportParams.fileData);
        }

        let bytesArray = [];
        for (let i = 0; i < jsonArray.templates.length; i++) {
            const fileSavePath = path.join(dirPath, `${fileName}_${i}${extension}`);
            const fileBinary = fs.readFileSync(fileSavePath, 'binary');
            bytesArray.push(fileBinary);

            fs.unlinkSync(fileSavePath);
        }
        const docx = new DocxMerger({}, bytesArray);
        docx.save('nodebuffer', (doc) => {
            fs.writeFileSync(path.join(reportParams.fileOutput), doc);
        });
        return true;

    } catch (error) {
        console.error(`Error worth logging: ${error}`);
        return false;
    }
}
module.exports = { dataBinding, mergeDocx }