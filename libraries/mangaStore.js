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
    {"General":"Action,Comedy,Romance,Drama,Historical,Mystery,Tragedy,Psychological,Manga,Manhwa,Manhua"},
    {"Fantasy": "Fantasy,Ecchi,Harem,Mature,Yaoi,Yuri,magic"},
    {"Life":"SchoolLife,School Life,Shounen,Seinen,Shoujo,Josei,ShoujoAi,ShounenAi"},
    {"Adventure":"Adventure,MartialArts,Martial Arts,revenge,Sport,Sports,DarkFantasy,Isekai"},
    {"System":"SyStem,Reincarnation,Scifi,Sci-fi,Mecha"},
    {"Supernatural":"Superhero,Supernatural,Horror,GenderBender,Webtoons,Comic"},
    {"One Shot":"OneShot,SliceofLife,Slice of Life"},
    {"Adult":"Adult,Manhwa18,Doujin,Dojin,Doujinshi,Lolicon,smut,Hentai,Shotacon"},
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

function mergeManga(){
    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga-sources.json`,'utf8');
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
    const allData = data.filter((data) => data != null && data.title);


    // const bestLayoutColumn = 5;
    // const genres = [].concat(...allData.map((data) => data.genres));
    // let uniqueGenres = [...new Set(genres)];
    // uniqueGenres = uniqueGenres.filter(g => g !== "");

    // let ignoreGenres = uniqueGenres.filter((genre) => allData.filter((item)=> item.genres.indexOf(genre) > -1).length < bestLayoutColumn);
    //ignoreGenres = ignoreGenres.concat(["Martial Arts","School Life","Sci-fi","Slice of Life"]);// have white-space then bad layout

    // uniqueGenres = uniqueGenres.filter(g => ignoreGenres.indexOf(g) === -1)

    fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify({ "store": allData, "groups": groups.map(g => Object.keys(g)[0]) }));
    console.log('Merge manga done.')
}

function getTotalPage(genre = ""){
    let allData = manga["store"];
    if(genre){
        allData = allData.filter((item)=> item.genres.indexOf(genre) > -1);
    }
    return (allData.length / pageSize);
}

function matchGroup(genres, group){
    const configGenres = groups.reduce((ret, entry, i)=>{
        for (const [key, value] of Object.entries(entry)) {
            ret[key] = value.split(',').map((v) => v.trim());
        }
        return ret;
    },[]);
    const g = configGenres[group];
    if(g && g.length > 0) {
        return genres.some(item => g.includes(item));
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