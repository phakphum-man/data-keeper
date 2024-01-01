const path = require('path');
const fs = require('fs');
const axios = require('axios');
const PDFParser = require("pdf2json");

async function getFields(filePath, isOnline =false) {
    let pdfFields = new Promise(async function(resolve, reject) {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError) );
        pdfParser.on("pdfParser_dataReady", pdfData => {
            try {
                if(pdfData && pdfData.Pages && (pdfData.Pages instanceof Array) && typeof pdfData.Pages == 'object'){
                    let output = [];
                    for(let i = 0; i < pdfData.Pages.length; i++){
                        const page = pdfData.Pages[i];
                        if(page && page.Fields && (page.Fields instanceof Array) && typeof page.Fields == 'object')
                        {
                            const fields = page.Fields.map(field => field.id.Id);
                            const saveFilePath = path.join((process.env.NODE_ENV !== 'production')?'./mnt':'/mnt', 'servicefiles', `fields_page${i}.csv`);
                            fs.writeFileSync(saveFilePath, fields.join(","));
                            output.push(saveFilePath);
                        }
                    }
                    resolve(output);
                }
            } catch (error) {
                reject(error);
            }
        });
        if(!isOnline){
            pdfParser.loadPDF(filePath);
        }else{
            const buffer = await axios.get(filePath, { responseType: 'arraybuffer' }).then((res) => res.data);
            pdfParser.parseBuffer(buffer, 0);
        }
    });

    return await pdfFields;
}

module.exports = { getFields }