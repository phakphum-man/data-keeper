require('dotenv').config();
const path = require('path');
const { getFields } = require("../libraries/util.pdfForm");

module.exports = function (app) {
    app.get('/pdf/read/online-form', async (req, res) => {
        // #swagger.ignore = true

        const filePath = req.query.f || "https://raw.githubusercontent.com/phakphum-man/data-keeper/main/reports/pdf/ap203_form50_original.pdf";

        const files = await getFields(filePath, true);

        let outputContents = [];
        if (files.length >0) {
            for(let i = 0; i < files.length; i++){
                const file = path.basename(files[i]);
                const referLink = `${req.protocol}://${req.get('host')}/download?f=${file}`;
                outputContents.push(`<a href="${referLink}" target="_blank">download ${(i + 1)}</a>`);
            }
        }
        
        return res.status(200).send(outputContents.join('\n'));
    });

    app.get('/pdf/read/form', async (req, res) => {
        // #swagger.ignore = true

        const filePath = req.query.f || "./reports/pdf/ap203_form50_original.pdf";

        const files = await getFields(filePath);

        let outputContents = [];
        if (files.length >0) {
            for(let i = 0; i < files.length; i++){
                const file = path.basename(files[i]);
                const referLink = `${req.protocol}://${req.get('host')}/download?f=${file}`;
                outputContents.push(`<a href="${referLink}" target="_blank">download ${(i + 1)}</a>`);
            }
        }
        
        return res.status(200).send(outputContents.join('\n'));
    });
}