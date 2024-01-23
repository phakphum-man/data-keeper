require("./util.string");
const fs = require('fs');
const pageSize = 20;

const configs = [
    { codeUrl: 'read-magic-0001', host: 'http://reapertrans.com', method: 'reapertrans', methodChapter: 'reapertransChapter'},
    { codeUrl: 'read-magic-0002', host: 'http://www.manhuathai.com', method: 'manhuathai', methodChapter: 'manhuathaiChapter'},
    { codeUrl: 'read-magic-0003', host: 'http://www.tanuki-manga.com', method: 'tanukimanga', methodChapter: 'tanukimangaChapter'},
];
const months_th = [ "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม", ];
const months_en = [ "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December", ];

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

    const mergeData = dataJson[configs[0].codeUrl].concat(dataJson[configs[1].codeUrl]).concat(dataJson[configs[2].codeUrl]);

    const titles = mergeData.map((data) => data.title);
    const uniqueTitles = [...new Set(titles)];
    const data = uniqueTitles.map((title)=> {
        const items = mergeData.filter((data) => data.title === title);
        let manga = null;
        if(items.length > 0) {
            const lastChapterNo = items.map((item) => item.lastChapter.no);
            const maxChapterNo = Math.max(...lastChapterNo);
            manga = mergeData.find((data) => data.title === title && data.lastChapter.no === maxChapterNo);
        }
        return manga
    });
    return data.filter((data) => data != null && data.title);
}

function getTotalPage(genre = ""){
    let allData = mangaStore();
    if(genre){
        allData = allData.filter((item)=> item.genres.indexOf(genre) > -1);
    }
    return (allData.length / pageSize);
}

function saveStore(codeUrl, newData) {
    // const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    // const dataJson = JSON.parse(contentJson);
    // return dataJson[codeUrl]||[];

    const srcPath = `${process.cwd()}/mnt/data/manga.json`;
    fs.readFile(srcPath, 'utf8', function (err, contentJson) {
        if (err) throw err;
        const dataJson = JSON.parse(contentJson);
        const oldData = dataJson[codeUrl] || [];

        // const data = newData.map(n => 
        //     oldData.find(o => o.title.toLowerCase() === n.title.toLowerCase()
        //         && o.lastChapter === n.lastChapter
        //     ) || n);

        let data = oldData;
        newData.forEach(n => {
            if(data.find(o => o.title?.toLowerCase() !== n.title?.toLowerCase())){
                data.push(n);
            }else if(data.find(o => o.title.toLowerCase() === n.title?.toLowerCase()
                && o.lastChapter !== n.lastChapter
            )){
                data = data.map(o => (o.title?.toLowerCase() === n.title?.toLowerCase()? n : o));
            }
        });

        fs.writeFile (srcPath, data, function(err) {
            if (err) throw err;
            console.log('complete');
        });
    });
}
module.exports = { configs, pageSize, months_th, months_en, getTotalPage, getConfigByDomain, getConfigByCode, mangaStore, saveStore}