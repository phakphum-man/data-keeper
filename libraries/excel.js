const xlsx = require('xlsx');

function newDateFileName(){
    return new Date().toJSON().slice(0,10);
}

function createNewWorkBook(){
    return xlsx.utils.book_new();
}

function createNewWorkSheet(jsonData){
    return xlsx.utils.json_to_sheet(jsonData);;
}

function writeFileXlsx(workBook, workSheet, fileName, sheetName, outfolder){
    outfolder = outfolder || "./";
    sheetName = sheetName || "Sheet1";
    
    xlsx.utils.book_append_sheet(workBook, workSheet, sheetName);
    xlsx.writeFile(workBook, `${outfolder}${fileName}.xlsx`);
}

function jsonWriteToXlsx(jsonData, fileName, sheetName, outfolder){
    outfolder = outfolder || "./";
    sheetName = sheetName || "Sheet1";
    
    let wb = createNewWorkBook();
    const workSheet = createNewWorkSheet(jsonData);
    xlsx.utils.book_append_sheet(wb, workSheet, sheetName);
    xlsx.writeFile(wb, `${outfolder}${fileName}.xlsx`);
}

module.exports = {
    jsonToExcelFile: jsonWriteToXlsx,
    createNewWorkBook: createNewWorkBook,
    createNewWorkSheet: createNewWorkSheet,
    exportFileXlsx: writeFileXlsx,
    newDateFileName: newDateFileName
};