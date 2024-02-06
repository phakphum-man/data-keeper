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

const filePath = `${process.cwd()}/mnt/data/manga.json`
if(!fs.existsSync(filePath)){
    fs.writeFileSync(filePath, JSON.stringify("{}"));
}
const manga = JSON.parse(fs.readFileSync(filePath,'utf8'));
const groups = [
    {"50 ตอน+":"#50plus#"},
    {"100 ตอน+":"#100plus#"},
    {"แนวต่อสู้":"Action"},
    {"แนว เวทย์ มนต์": "Fantasy,DarkFantasy,magic"},
    {"แนวฮาเร็ม": "Harem,Mature"},
    {"แนวอนิเมะ":"SchoolLife,School Life,Ecchi,Shounen,Seinen,Shoujo,Josei,ShoujoAi,ShounenAi,Yaoi,Yuri,Comedy"},
    {"แนวผจญภัย":"Adventure,MartialArts,Martial Arts"},
    {"แนวลึกลับสืบสวน":"Mystery,Historical,Tragedy,Psychological"},
    {"แนวกีฬา":"Sport,Sports"},
    {"แนวเกิดใหม่":"Reincarnation,revenge"},
    {"แนวต่างโลก":"Isekai"},
    {"แนวมีระบบ":"SyStem,Scifi,Sci-fi,Mecha"},
    {"แนวผู้ใหญ่ 18+":"Adult,Manhwa18,Doujin,Dojin,Doujinshi,Lolicon,smut,Hentai,Shotacon"},
];

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


const mergeMangaPattern = /[^a-zA-Z0-9\+]+/g;

function mergeCheckLikeName(data, title){
    const a = data.title?.toLowerCase();
    const b = title;
    if(a){
        return a.replace(mergeMangaPattern,"") === b;
    }
    return false;
}

function mergeManga(){
    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga-sources.json`,'utf8');
    const dataJson = JSON.parse(contentJson);

    const mergeData = dataJson[configs[0].codeUrl].concat(dataJson[configs[1].codeUrl]).concat(dataJson[configs[2].codeUrl]);

    const titles = mergeData.map((data) => data.title?.toLowerCase().replace(mergeMangaPattern,""));
    const uniqueTitles = [...new Set(titles)];
    const data = uniqueTitles.map((title)=> {
        const items = mergeData.filter((data) => mergeCheckLikeName(data, title));
        let manga = null;
        if(items.length > 0) {
            const lastChapterNo = items.map((item) => item.lastChapter.no);
            const maxChapterNo = Math.max(...lastChapterNo);
            manga = mergeData.find((data) => mergeCheckLikeName(data, title) && data.lastChapter.no === maxChapterNo);
        }
        return manga
    });
    const allData = data.filter((data) => data != null && data.title && data.imgUrl);

    fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify({ "store": allData, "groups": groups.map(g => Object.keys(g)[0]) }));
    console.log('Merge manga done.')
}

function getTotalPage(groupIds = ""){
    let allData = manga["store"];
    if(groupIds){
        const groupId = parseInt(groupIds.getOnlyNumber())-1;
        allData = allData.filter((item)=> matchGroup(item.genres, (groupId-1), item.lastChapter));
    }
    return (allData.length / pageSize);
}

function matchGroup(genres, groupId, lastChapter){
    const configGenres = groups.reduce((ret, entry, i)=>{
        for (const [key, value] of Object.entries(entry)) {
            let g = {};
            g[key] = value.split(',').map((v) => v.trim());
            ret[i] = g;
        }
        return ret;
    },[]);
    const gConfig = configGenres[groupId];
    if(gConfig && typeof gConfig === "object") {
        let g = Object.values(gConfig); 
        if(g.length > 0){
            if(g[0].length == 1 && g[0][0].startsWith("#")){
                const no = parseInt(g[0][0].replaceAll("#","").getOnlyNumber());
                return lastChapter.no > no;
            } else {
                return genres.some(item => g[0].includes(item));
            }
        }
    }
    return false;
}

function saveStore(codeUrl, newData) {
    const srcPath = `${process.cwd()}/mnt/data/manga-sources.json`;
    fs.readFile(srcPath, 'utf8', function (err, contentJson) {
        if (err) throw err;
        let dataJson = JSON.parse(contentJson||"{}");
        const oldData = dataJson[codeUrl] || [];

        let data = oldData;
        newData.forEach(n => {
            if(n.title){
                if(data.find(o => o.title.toLowerCase() === n.title.toLowerCase())){
                    data = data.map(o => (o.title.toLowerCase() === n.title?.toLowerCase() && o.lastChapter !== n.lastChapter? n : o));
                }else{
                    //console.log("add new");
                    data.push(n);
                }
            }
        });

        dataJson[codeUrl] = data;
        fs.writeFile (srcPath, JSON.stringify(dataJson), function(err) {
            if (err) throw err;
            console.log("...Save.");
            //console.log(` ...Save file (${codeUrl} is complete ${newData.length} rows.)`);
        });
    });
}
module.exports = { configs, pageSize, months_th, months_en, matchGroup, getTotalPage, getConfigByDomain, getConfigByCode, manga, saveStore, mergeManga}