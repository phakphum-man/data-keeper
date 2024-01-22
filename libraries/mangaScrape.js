const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { getConfigByDomain, months_th } = require('./mangaStore');

// Use: dateThaiToIsoString("30 มิถุนายน 2022")
function dateThaiToIsoString(dateThaiString, dateDefault = "") {
    const dateSplit = dateThaiString.split(' ');
    return (dateSplit.length == 3)? `${dateSplit[2]}-${(months_th.indexOf(dateSplit[1])+1)}-${dateSplit[0]}T23:52:38+07:00`: dateDefault;
}

// Use: dateEngToIsoString("March 3, 2023")
function dateEngToIsoString(dateThaiString, dateDefault = "") {
    const months_en = [ "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December", ];
    const dateSplit = dateThaiString.split(' ');
    return (dateSplit.length == 3)? `${dateSplit[1].replace(",","")}-${(months_en.indexOf(dateSplit[0])+1)}-${dateSplit[2]}T23:52:38+07:00`: dateDefault;
}

async function manhuathaiGetManga(maxPageSize=200){
    const host = "https://www.manhuathai.com/";

    const settings = getConfigByDomain(host.getDomain());
    let data = [];
    for (let p = 1; p < maxPageSize; p++) {
        const query = `page/${p}/`
        const url = `${host}${query}`;

        const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            break;
        }
        
        console.log(p);
        const expect_time = ["วัน", "ชั่วโมง"];
        const $ = cheerio.load(dataContent);
        const mangaItems = $('div#loop-content > div.page-listing-item');
        mangaItems.find('.page-item-detail').each((_, el) => {
            const a = $(el).find('.item-thumb > a');
            const img = a.find('img');
            const score = $(el).find('.item-summary > .meta-item > .post-total-rating > span.score');
            const item = $(el).find('.item-summary > .list-chapter > .chapter-item').first();
            const itemDate = $(el).find('.item-summary > .list-chapter > .chapter-item').last();

            const lastCh = item.find('.chapter > a').first();
            const no = lastCh.text().getOnlyNumber();
            const sDate = itemDate.find('span.post-on').text().cleanText();
            let dateDefault = "";
            if (sDate === '' && itemDate.length > 0) {
                const sDay = itemDate.find('span.post-on > a').attr('title').split(' ');
                if (sDay.length == 3 && sDay[0].isNumber()) {
                    let date = new Date();
                    const expt = expect_time.indexOf(sDay[1]);
                    if (expt == 0){ // วัน
                        date.setDate(date.getDate() + parseInt(sDay[0]));
                        dateDefault = date.toISOString();
                    } else if (expt == 1){ // ชั่วโมง
                        date.setHours(date.getHours() + parseInt(sDay[0]));
                        dateDefault = date.toISOString();
                    }
                }
            }
            const objJson = { 
                title: a.attr('title'),
                sourceUrl: a.attr('href'),
                imgUrl: img.attr('data-src'),
                genres: [],
                score: parseFloat(score.text()),
                scoreMax: 5,
                firstChapter: {
                    no: null,
                    url: null,
                    date: null
                },
                lastChapter: {
                    no: (no!==null)? parseInt(no): null,
                    url: lastCh.attr('href'),
                    date: dateThaiToIsoString(sDate, dateDefault),
                }
            };
            
            data.push(objJson);
        });
    }

    console.log("Update First Chapter");
    //UPDATE lastChapter
    for (let i = 0; i < data.length; i++) {
        const dataContent = await axios.get(data[i].sourceUrl, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            continue;
        }

        const $ = cheerio.load(dataContent);
        const mangaItems = $('ul.main > .wp-manga-chapter');
        const firstCh = mangaItems.last();

        const no = firstCh.find('a').text().getOnlyFloatNumber();
        data[i].firstChapter.no = (no!==null)? parseFloat(no): null;
        data[i].firstChapter.url = firstCh.find('a').attr('href');
        data[i].firstChapter.date = dateThaiToIsoString(firstCh.find('span.chapter-release-date > i').text());

        data[i].genres = $('div.summary-content > div.genres-content > a').map((_, mgen) => $(mgen).text()).get();
        console.log(`updated => ${(i+1)}/${data.length}`);
    }

    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    let dataJson = JSON.parse(contentJson);
    dataJson[settings.codeUrl] = data;
    fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));
}

async function reapertransGetManga(maxPageSize=200){
    const host = "https://reapertrans.com/";

    const settings = getConfigByDomain(host.getDomain());
    let data = [];
    for (let p = 1; p < maxPageSize; p++) {
        const query = `manga/?page=${p}`
        const url = `${host}${query}`;

        const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            break;
        }
        
        const $ = cheerio.load(dataContent);
        const mangaItems = $('div.mrgn > .listupd');
        if(mangaItems.find('div.bs > div.bsx').length === 0){
            break;
        }
        console.log(p);
        mangaItems.find('div.bs > div.bsx').each((_, el) => {
            const a = $(el).find('a');
            const img = a.find('div.limit > img');
            const score = a.find('div.bigor > div.adds > div.rt > div.rating > div.numscore');
            const item = $(a).find('div.bigor > div.adds > div.epxs');
            
            const no = item.text().getOnlyNumber();
            const objJson = { 
                title: a.attr('title'),
                sourceUrl: a.attr('href'),
                imgUrl: img.attr('src'),
                genres: [],
                score: parseFloat(score.text()),
                scoreMax: 10,
                firstChapter: {
                    no: null,
                    url: null,
                    date: null
                },
                lastChapter: {
                    no: (no!==null)? parseInt(no): null,
                    url: null,
                    date: null,
                }
            };
            
            data.push(objJson);
        });
    }
    
    console.log("Update Last Chapter");
    //UPDATE lastChapter
    for (let i = 0; i < data.length; i++) {
        const dataContent = await axios.get(data[i].sourceUrl, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            continue;
        }

        const $ = cheerio.load(dataContent);
        
        const firstCh = $('div#chapterlist > ul > li.first-chapter > .chbox > .eph-num a');

        const noF = firstCh.find('span.chapternum').text().getOnlyFloatNumber();
        data[i].firstChapter.no = (noF!==null)? parseFloat(noF): null;
        data[i].firstChapter.url = firstCh.attr('href');
        data[i].firstChapter.date = dateEngToIsoString(firstCh.find('span.chapterdate').text());

        const mangaItems = $('div.postbody > article');
        const lastDateChapter = mangaItems.find('.animefull').find('.bigcontent > .infox > .flex-wrap').last().find('.fmed').last().find('span');
        const lastChapter = mangaItems.find('.epcheck').find('.lastend > .inepcx > a').last();

        const noL = lastChapter.find('span.epcurlast').text().getOnlyNumber();
        data[i].lastChapter.no = (noL!==null)? parseInt(noL): null;
        data[i].lastChapter.url = lastChapter.attr('href');
        data[i].lastChapter.date = lastDateChapter.find('time').attr('datetime');

        data[i].genres = mangaItems.find('.animefull').find('.bigcontent > .infox > .wd-full > span.mgen > a').map((_,mgen) => $(mgen).text().replace(/[^A-Za-z0-9]/g, '')).get();
        console.log(`updated => ${(i+1)}/${data.length}`);
    }

    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    let dataJson = JSON.parse(contentJson);
    dataJson[settings.codeUrl] = data;
    fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));
}

async function syncAll(){
    await reapertransGetManga();
    await manhuathaiGetManga();
}
//syncAll();