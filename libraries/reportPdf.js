const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csvtojson');
const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function dataBinding(reportParams){
    try
    {
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
            const fontBytes = fs.readFileSync(path.join('./reports','fonts', 'THSarabunNew.ttf'));
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

    } catch (error) {
        console.log(`Error worth logging: ${error}`);
        throw error; // still want to crash
    }
}

module.exports = { dataBinding }