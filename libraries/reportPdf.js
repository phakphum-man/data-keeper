const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const dataReport = require('./dataReport');

async function imgToBytes(urlImagePath) {
    const emblemUrl = urlImagePath.substring(9);
    const emblemImageBytes = await axios.get(emblemUrl, { responseType: 'arraybuffer' }).then((res) => res.data);
    return emblemImageBytes;
}

async function dataBinding(reportParams){
    try
    {
        let jsonArray = [];
        let formPdfBytes = Buffer.from('');

        if(!reportParams.isOnline){

            jsonArray = await dataReport.getCsvToJsonOffline(reportParams.fileData);
            formPdfBytes = fs.readFileSync(reportParams.fileTemplate);

        }else{
            jsonArray = await dataReport.getCsvToJsonOnline(reportParams.fileData);
            formPdfBytes = await axios.get(reportParams.fileTemplate, { responseType: 'arraybuffer' }).then((res) => res.data);
        }
        
        const dirPath = path.dirname(reportParams.fileOutput);
        const extension = path.extname(reportParams.fileOutput);
        const fileName = path.basename(reportParams.fileOutput, extension);
        await Promise.all(jsonArray.map(async (dataBinding, index) => {

            // Load a PDF with form fields
            const pdfDoc = await PDFDocument.load(formPdfBytes);

            pdfDoc.registerFontkit(fontkit);

            //load font and embed it to pdf document
            const fontBytes = fs.readFileSync(path.join('./reports','fonts', 'THSarabunNew.ttf'));
            const customFont = await pdfDoc.embedFont(fontBytes);

            let emblemImages = {};
            await Promise.all(Object.entries(dataBinding).map(async ([key, value]) => {
                if (typeof(value) === "string" && (value.startsWith('$url#png:') || value.startsWith('$url#jpg:'))){
                    const ext = value.substring(0, 9);
                    switch(ext) {
                        case '$url#jpg:':
                            emblemImages[key] = await pdfDoc.embedJpg(await imgToBytes(value));
                            break;
                        case '$url#png:':
                        default:
                            emblemImages[key] = await pdfDoc.embedPng(await imgToBytes(value));
                    }
                }
            }));

            // Get the form containing all the fields
            const form = pdfDoc.getForm();
            
            Object.entries(dataBinding).forEach(([key, value]) => {

                if (typeof(value) === "string" && (value.startsWith('$url#png:') || value.startsWith('$url#jpg:'))){
                    // Substring extension
                    
                    const imageField = form.getButton(key);
                    
                    imageField.setImage(emblemImages[key]);

                } else {
                    // Get all fields in the PDF by their names
                    const textField = form.getTextField(key);
                    
                    // Fill in the basic info fields
                    textField.setText(value);

                    textField.updateAppearances(customFont);
                }
            });
            
            form.flatten();

            // Serialize the PDFDocument to bytes (a Uint8Array)
            const pdfBytesAtOnePage = await pdfDoc.save();
            
            const fileSavePath = path.join(dirPath, `${fileName}_${index}${extension}`);
            fs.writeFileSync(fileSavePath, pdfBytesAtOnePage);
            
        }));
        
    } catch (error) {
        console.error(`Error : ${error}`);
        if(error.stack){
            console.info(`Error : ${error.stack}`);
        }
        throw error;
    }

    return false;
}

async function mergePdf(reportParams){
    try {
        const dirPath = path.dirname(reportParams.fileOutput);
        const extension = path.extname(reportParams.fileOutput);
        const fileName = path.basename(reportParams.fileOutput, extension);
        let jsonArray = [];

        if(!reportParams.isOnline){
            jsonArray = await dataReport.getCsvToJsonOffline(reportParams.fileData);
        }else{
            jsonArray = await dataReport.getCsvToJsonOnline(reportParams.fileData);
        }

        const mergedPdf = await PDFDocument.create(); 
        for (let i = 0; i < jsonArray.length; i++) {
            const fileSavePath = path.join(dirPath, `${fileName}_${i}${extension}`);
            const pdfBytes = fs.readFileSync(fileSavePath);
            const pdf = await PDFDocument.load(pdfBytes); 
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => {
                mergedPdf.addPage(page); 
            }); 
            fs.unlinkSync(fileSavePath);
        } 

        const pdfMergeBytes = await mergedPdf.save();
        fs.writeFileSync(dataReport.getSavePath(reportParams), pdfMergeBytes);
        return false;

    } catch (error) {
        console.error(`Error worth logging: ${error}`);
        throw error;
    }
}

module.exports = { dataBinding, mergePdf }