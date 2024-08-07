require('dotenv').config();
require("./util.string");
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { getConfigByDomain, saveStore, months_th, months_en, mergeManga} = require('./mangaStore');

// Use: dateThaiToIsoString("30 มิถุนายน 2022")
function dateThaiToIsoString(dateThaiString, dateDefault = "") {
    const dateSplit = dateThaiString.split(' ');
    return (dateSplit.length == 3)? `${dateSplit[2]}-${(months_th.indexOf(dateSplit[1])+1)}-${dateSplit[0]}T23:52:38+07:00`: dateDefault;
}

// Use: dateThai2ToIsoString(months_en, "มีนาคม 6, 2024")
function dateThai2ToIsoString(dateThaiString, dateDefault = "") {
    const dateSplit = dateThaiString.split(' ');
    return (dateSplit.length == 3)? `${dateSplit[2]}-${(months_th.indexOf(dateSplit[0])+1)}-${dateSplit[1].replace(",","")}T23:52:38+07:00`: dateDefault;
}

// Use: dateEngToIsoString(months_en, "March 3, 2023")
function dateEngToIsoString(months, dateThaiString, dateDefault = "") {
    const dateSplit = dateThaiString.split(' ');
    return (dateSplit.length == 3)? `${dateSplit[2]}-${(months.indexOf(dateSplit[0])+1)}-${dateSplit[1].replace(",","")}T23:52:38+07:00`: dateDefault;
}

async function reapertransGetManga(maxPageSize=300)
{
    const host = "https://reapertrans.com/";

    console.log(`\nScraping to \x1b[33m${host}\x1b[0m`);
    const settings = getConfigByDomain(host.getDomain());
    console.log("fetch html page...");
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

        process.stdout.write(`${p} `);
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
    
    console.log(`\nUpdate Chapters(${data.length.toString().formatNumberCommas()})...`);
    let x = 0;
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
        data[i].firstChapter.date = dateEngToIsoString(months_en, firstCh.find('span.chapterdate').text());

        const mangaItems = $('div.postbody > article');
        const lastDateChapter = mangaItems.find('.animefull').find('.bigcontent > .infox > .flex-wrap').last().find('.fmed').last().find('span');
        const lastChapter = mangaItems.find('.epcheck').find('.lastend > .inepcx > a').last();

        const noL = lastChapter.find('span.epcurlast').text().getOnlyNumber();
        data[i].lastChapter.no = (noL!==null)? parseInt(noL): null;
        data[i].lastChapter.url = lastChapter.attr('href');
        data[i].lastChapter.date = lastDateChapter.find('time').attr('datetime');

        data[i].genres = mangaItems.find('.animefull').find('.bigcontent > .infox > .wd-full > span.mgen > a').map((_,mgen) => $(mgen).text().replace(/[^A-Za-z0-9]/g, '')).get();

        if((i+1)% 100 === 0){
            const newData = data.slice(x, i+1);
            saveStore(settings.codeUrl, newData);
            x = (i+1);
        }

        process.stdout.write(`${(i+1)} `);
    }

    const newData = data.slice(x, data.length);
    saveStore(settings.codeUrl, newData);

    // const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8')||"{}";
    // let dataJson = JSON.parse(contentJson);
    // dataJson[settings.codeUrl] = data;
    // fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));
    console.log(`\n\x1b[33mSAVE DATA ${host} Done.\x1b[0m`);
}

async function manhuathaiGetManga(maxPageSize=300)
{
    const host = "https://www.manhuathai.com/";

    console.log(`\nScraping to \x1b[33m${host}\x1b[0m`);
    const settings = getConfigByDomain(host.getDomain());
    console.log("fetch html page...");
    let data = [];
    for (let p = 1; p < maxPageSize; p++) {
        const query = `page/${p}/`
        const url = `${host}${query}`;

        const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            break;
        }
        
        process.stdout.write(`${p} `);
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

    console.log(`\nUpdate Chapters(${data.length.toString().formatNumberCommas()})...`);
    let x = 0;
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
        data[i].imgUrl = $('div.summary_image > a > img').attr('data-src');

        if((i+1)% 100 === 0){
            const newData = data.slice(x, i+1);
            saveStore(settings.codeUrl, newData);
            x = (i+1);
        }
        process.stdout.write(`${(i+1)} `);
    }

    const newData = data.slice(x, data.length);
    saveStore(settings.codeUrl, newData);

    // const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8')||"{}";
    // let dataJson = JSON.parse(contentJson);
    // dataJson[settings.codeUrl] = data;
    // fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));
    console.log(`\n\x1b[33mSAVE DATA ${host} Done.\x1b[0m`);
}

async function tanukimangaGetManga(maxPageSize=400)
{
    const host = "https://www.tanuki-manga.com/";

    console.log(`\nScraping to \x1b[33m${host}\x1b[0m`);
    const settings = getConfigByDomain(host.getDomain());

    console.log("fetch html page...");
    let data = [];
    for (let p = 1; p < maxPageSize; p++) {
        const query = `manga/?page=${p}&order=update`
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
        process.stdout.write(`${p} `);
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
    
    console.log(`\nUpdate Chapters(${data.length.toString().formatNumberCommas()})...`);
    let x = 0;
    //UPDATE lastChapter
    for (let i = 0; i < data.length; i++) {
        const dataContent = await axios.get(data[i].sourceUrl, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            continue;
        }

        const $ = cheerio.load(dataContent);
        
        const firstCh = $('div#chapterlist > ul > li').last().find('.chbox > .eph-num a');

        const noF = firstCh.find('span.chapternum').text().getOnlyFloatNumber();
        data[i].firstChapter.no = (noF!==null)? parseFloat(noF): null;
        data[i].firstChapter.url = firstCh.attr('href');
        data[i].firstChapter.date = dateEngToIsoString(months_th, firstCh.find('span.chapterdate').text());

        const lastChapter = $('div#chapterlist > ul > li').first().find('.chbox > .eph-num a');

        const noL = lastChapter.find('span.chapternum').text().getOnlyNumber();
        data[i].lastChapter.no = (noL!==null)? parseInt(noL): null;
        data[i].lastChapter.url = lastChapter.attr('href');
        data[i].lastChapter.date = dateEngToIsoString(months_th, lastChapter.find('span.chapterdate').text());

        data[i].genres = $('.main-info > .info-right > .info-desc > .wd-full').first().find('span.mgen > a').map((_,mgen) => $(mgen).text().replace(/[^A-Za-z0-9]/g, '')).get();

        if((i+1)% 100 === 0){
            const newData = data.slice(x, i+1);
            saveStore(settings.codeUrl, newData);
            x = (i+1);
        }
        process.stdout.write(`${(i+1)} `);
    }
    
    const newData = data.slice(x, data.length);
    saveStore(settings.codeUrl, newData);
    
    // const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8')||"{}";
    // let dataJson = JSON.parse(contentJson);
    // dataJson[settings.codeUrl] = data;
    // fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));

    console.log(`\n\x1b[33mSAVE DATA ${host} Done.\x1b[0m`);
}

async function slowmangaGetManga(maxPageSize=400)
{
    const host = "https://www.slow-manga.com/";

    console.log(`\nScraping to \x1b[33m${host}\x1b[0m`);
    const settings = getConfigByDomain(host.getDomain());

    console.log("fetch html page...");
    let data = [];
    for (let p = 1; p < maxPageSize; p++) {
        const query = `manga/?page=${p}&order=update`
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
        process.stdout.write(`${p} `);
        mangaItems.find('div.bs > div.bsx').each((_, el) => {
            const a = $(el).find('a');
            const img = a.find('div.limit > img');
            //const score = a.find('div.bigor > div.adds > div.rt > div.rating > div.numscore');
            const item = $(a).find('div.limit > div.adds > div.epxs');//$(a).find('div.bigor > div.adds > div.epxs');
            
            const no = item.text().getOnlyNumber();
            const objJson = { 
                title: a.attr('title'),
                sourceUrl: a.attr('href'),
                imgUrl: img.attr('src'),
                genres: [],
                score: null,//parseFloat(score.text()),
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
    
    console.log(`\nUpdate Chapters(${data.length.toString().formatNumberCommas()})...`);
    let x = 0;
    //UPDATE lastChapter
    for (let i = 0; i < data.length; i++) {
        const dataContent = await axios.get(data[i].sourceUrl, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            continue;
        }

        const $ = cheerio.load(dataContent);
        
        data[i].score = parseFloat($('div.info > div.info-left > div.rating > div.rating-prc > div.num').text());

        const firstCh = $('div#chapterlist > ul > li').last().find('.chbox > .eph-num a');

        const noF = firstCh.find('span.chapternum').text().getOnlyFloatNumber();
        data[i].firstChapter.no = (noF!==null)? parseFloat(noF): null;
        data[i].firstChapter.url = firstCh.attr('href');
        data[i].firstChapter.date = dateThai2ToIsoString(firstCh.find('span.chapterdate').text());

        const lastChapter = $('div#chapterlist > ul > li').first().find('.chbox > .eph-num a');

        const noL = lastChapter.find('span.chapternum').text().getOnlyNumber();
        data[i].lastChapter.no = (noL!==null)? parseInt(noL): null;
        data[i].lastChapter.url = lastChapter.attr('href');
        data[i].lastChapter.date = dateThai2ToIsoString(lastChapter.find('span.chapterdate').text());

        data[i].genres = $('div.info > div.info-right > div.info-desc > div.wd-full').first().find('span.mgen > a').map((_,mgen) => ($(mgen).text().indexOf(",") < 0) ? $(mgen).text() : "").get();

        if((i+1)% 100 === 0){
            const newData = data.slice(x, i+1);
            saveStore(settings.codeUrl, newData);
            x = (i+1);
        }
        process.stdout.write(`${(i+1)} `);
    }
    
    const newData = data.slice(x, data.length);
    saveStore(settings.codeUrl, newData);
    
    // const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8')||"{}";
    // let dataJson = JSON.parse(contentJson);
    // dataJson[settings.codeUrl] = data;
    // fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));

    console.log(`\n\x1b[33mSAVE DATA ${host} Done.\x1b[0m`);
}

async function syncAll(){
    try {
        await reapertransGetManga();
        await manhuathaiGetManga();
        await tanukimangaGetManga();
        //await slowmangaGetManga();
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}
mergeManga();
//syncAll();
module.exports = async (job) => {
    if(job.id){
        console.log('running...');
        return await syncAll();
    }
    return false;
};