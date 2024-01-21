require("./util.string");
const fs = require('fs');
const pageSize = 18;

const configs = [
    { codeUrl: 'read-magic-0001', host: 'http://reapertrans.com', method: 'reapertrans', methodChapter: 'reapertransChapter'},
    { codeUrl: 'read-magic-0002', host: 'http://www.manhuathai.com', method: 'manhuathai', methodChapter: 'manhuathaiChapter'},
];
const months_th = [ "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม", ];

function viewDate(dbDate){
    const lastUpdate = dbDate?.substr(0, (dbDate?.indexOf("T")+9));
    const splitDate = lastUpdate.split("T");
    let date = "";
    if (splitDate.length > 1) {
        const cutDate = splitDate[0].split("-");
        if(cutDate.length > 2){
            const month = parseInt(cutDate[1].getOnlyNumber());
            date = `${cutDate[2]} ${months_th[month-1]} ${cutDate[0]}`
        }
    }
    return date;
}

function presentManga(item){
    let firstChapterUrl = item.firstChapter.url;
    let lastChapterUrl = item.lastChapter.url;
    const settings = configs.filter((config) => lastChapterUrl?.removeProtocolUrl().startsWith(config.host.removeProtocolUrl()));
    let firstUrl = "#";
    let lastUrl = "#";
    if( settings.length > 0 ){
        const navFirst = firstChapterUrl?.removeProtocolUrl().replace(`${settings[0].host.removeProtocolUrl()}/`,"");
        const navLast = lastChapterUrl?.removeProtocolUrl().replace(`${settings[0].host.removeProtocolUrl()}/`,"");
        firstUrl = `/manga/${settings[0].codeUrl}?q=${navFirst}`;
        lastUrl = `/manga/${settings[0].codeUrl}?q=${navLast}`;
    }
    
    return {
        title: item.title,
        imgUrl: `/manga/view-image?q=${item.imgUrl}`,
        score: item.score,
        scoreMax : item.scoreMax,
        firstChapter: {
            title: `ตอนที่ ${item.firstChapter.no??""}`,
            date: viewDate(item.firstChapter.date),
            url: firstUrl,
        },
        lastChapter: {
            title: `ตอนที่ ${item.lastChapter.no}`,
            date: viewDate(item.lastChapter.date),
            url: lastUrl,
        },
    };
}

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

function mergeStores(){
    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    const dataJson = JSON.parse(contentJson);
    return dataJson[configs[0].codeUrl].concat(dataJson[configs[1].codeUrl]);
}

function getStoreByPage(page, codeUrl="*"){
    if(codeUrl === "*"){
        // let allData = [];
        // for(let i = 0; i < configs.length; i++) {
        //     for(let j = 0; j < dataJson[configs[i].codeUrl].length; j++) {
        //         const newData = dataJson[configs[i].codeUrl][j];

        //         const found = allData.find((o) => o.title?.includes(newData.title));
        //         if(!found && newData.lastChapter.date){
        //             allData.push(newData);
        //         }
        //     }
        // }
        const allData = mergeStores();
        return allData.sort((a, b)=> {
            const dateA = a.lastChapter.date;
            const dateB = b.lastChapter.date;
            if (dateA > dateB) {
                return -1;
            }else if (dateA == dateB) {
                return 0;
            } else {
                return 1;
            }
            
        }).slice((pageSize * (page-1)), (pageSize*page)).map(presentManga);
    }

    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    const dataJson = JSON.parse(contentJson);
    return dataJson[codeUrl].slice((pageSize * (page-1)), (pageSize*page)).map(presentManga);
}

module.exports = { configs, pageSize, months_th, getConfigByDomain, getConfigByCode, mergeStores, getStoreByPage}