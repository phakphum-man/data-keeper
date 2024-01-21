require("./util.string");
const fs = require('fs');
const pageSize = 18;

const configs = [
    { codeUrl: 'read-magic-0001', host: 'http://reapertrans.com', method: 'reapertrans', methodChapter: 'reapertransChapter'},
    { codeUrl: 'read-magic-0002', host: 'http://www.manhuathai.com', method: 'manhuathai', methodChapter: 'manhuathaiChapter'},
];
const months_th = [ "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม", ];

function getConfigByDomain(domain){
    const check = domain.toLowerCase();
    const data = configs.filter((config) => config.host.getDomain() === check);
    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

function getConfigByCode(code){
    const data = configs.filter((config) => config.codeUrl === code);
    if (data && data.length > 0) {
        return data[0];
    }
    return null;
}

function mangaStore(){
    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    const dataJson = JSON.parse(contentJson);
    return dataJson[configs[0].codeUrl].concat(dataJson[configs[1].codeUrl]);
}

function getTotalPage(){
    return (mangaStore().length / pageSize);
}
module.exports = { configs, pageSize, months_th, getTotalPage, getConfigByDomain, getConfigByCode, mangaStore}