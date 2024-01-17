require("../libraries/util.string");
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
//const puppeteer = require('puppeteer');
const pageSize = 16;

const configs = [
    { codeUrl: 'read-magic-0001', host: 'http://reapertrans.com', method: 'reapertrans', methodChapter: 'reapertransChapter'},
    { codeUrl: 'read-magic-0002', host: 'http://www.manhuathai.com', method: 'manhuathai', methodChapter: 'manhuathaiChapter'},
];

// Use: dateThaiToIsoString("30 มิถุนายน 2022")
function dateThaiToIsoString(dateThaiString, dateDefault = "") {
    const months_th = [ "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม", ];
    const dateSplit = dateThaiString.split(' ');
    return (dateSplit.length == 3)? `${dateSplit[2]}-${(months_th.indexOf(dateSplit[1])+1)}-${dateSplit[0]}T23:52:38+07:00`: dateDefault;
}

// Use: dateEngToIsoString("March 3, 2023")
function dateEngToIsoString(dateThaiString, dateDefault = "") {
    const months_th = [ "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December", ];
    const dateSplit = dateThaiString.split(' ');
    return (dateSplit.length == 3)? `${dateSplit[1].replace(",","")}-${(months_th.indexOf(dateSplit[0])+1)}-${dateSplit[2]}T23:52:38+07:00`: dateDefault;
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

function presentManga(item){
    let firstChapterUrl = item.firstChapter.url;
    let lastChapterUrl = item.lastChapter.url;
    const settings = configs.filter((config) => firstChapterUrl.removeProtocolUrl().startsWith(config.host.removeProtocolUrl()));
    let firstUrl = "#";
    let lastUrl = "#";
    if( settings.length > 0 ){
        const navFirst = firstChapterUrl.removeProtocolUrl().replace(`${settings[0].host.removeProtocolUrl()}/`,"");
        const navLast = lastChapterUrl.removeProtocolUrl().replace(`${settings[0].host.removeProtocolUrl()}/`,"");
        firstUrl = `/manga/${settings[0].codeUrl}?q=${navFirst}`;
        lastUrl = `/manga/${settings[0].codeUrl}?q=${navLast}`;
    }
    return {
        title: item.title,
        imgUrl: item.imgUrl,
        score: item.score,
        scoreMax : item.scoreMax,
        firstChapter: {
            title: `Chapter ${item.firstChapter.no??""}`,
            url: firstUrl,
        },
        lastChapter: {
            title: `Chapter ${item.lastChapter.no}`,
            url: lastUrl,
        },
    };
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
            }
            return 1;
        }).slice((pageSize * (page-1)), (pageSize*page)).map(presentManga);
    }

    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    const dataJson = JSON.parse(contentJson);
    return dataJson[codeUrl].slice((pageSize * (page-1)), (pageSize*page)).map(presentManga);
}

async function reapertransChapter(query){
    const host = "https://reapertrans.com/";
    const dataContent = await axios.get(`${host}${query}`, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

    if(dataContent === "Request failed with status code 404"){
        return res.status(200).send("Not Found Manga <a href=\"javascript:history.go(-1)\">Go Back</a>");
    }
    const settings = getConfigByDomain(host.getDomain());
    const $ = cheerio.load(dataContent);
    const ch = $("div#chapterlist > ul > li").map((_,el) => {
        const li = $(el);
        const no = parseInt(li.attr("data-num"));
        const titles = li.find("a > span.chapternum").map((_,el) => $(el).text());
        const urls = li.find("a").map((_,el) => $(el).attr("href"));
        const dates = li.find("a > span.chapterdate").map((_,el) => $(el).text());

        const nav = (urls && urls.length > 0)? urls[0].replace(host,""):"";
        return {
            no, 
            title: (titles && titles.length > 0)? titles[0]: null, 
            url: `/manga/${settings.codeUrl}?q=${nav}`, 
            chapterdate: (dates && dates.length > 0)? dates[0] : null, 
        };
    }).get();
    return ch;
}

async function reapertrans(settings, query, htmlContent){
    const host = "https://reapertrans.com/";
    const url = `${host}${query}`;

    // HTML set Variable
    /*
    const browser = await puppeteer.launch({ devtools:false,
        headless: true,
        executablePath: process.env.NODE_ENV === 'development'? null : '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-gpu'
        ], });
    const page = await browser.newPage();

    await page.goto(url);
    const localStorageData = await page.evaluate(() => JSON.parse(JSON.stringify(localStorage)));
    if(localStorageData.mscurrentChapterList){
        const ms = JSON.parse(localStorageData.mscurrentChapterList);
        let xml = ms.html;
        let es = xml.match(/<option(.*)>.*?<\/option>/g);;
        chapterList = ms.html;
        console.log(chapterList);
    }
    await browser.close();*/

    // const chAt = query.indexOf('ตอนที่');
    // if(chAt !== -1) {
    //     const qCh = query.substr(0, chAt-1);
    //     const chList = await reapertransComChapter(`${qCh}/`);
    //     console.log(chList.length);
    // }

    const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

    if(dataContent === "Request failed with status code 404"){
        return res.status(200).send("Not Found Manga <a href=\"javascript:history.go(-1)\">Go Back</a>");
    }

    const mtitle = dataContent.match("<h1 class=\"entry-title\" itemprop=\"name\">(.*)</h1>");
    if(mtitle && mtitle.length > 1){
        const s = mtitle[1];
        htmlContent = htmlContent.replaceAll("<%=TITLE%>",s);
    }

    const mpic = dataContent.match("<script>ts_reader.run(.*);");
    let listImg = [];
    if(mpic && mpic.length > 1){
        const s = mpic[1];
        let data = JSON.parse(s.substr(1, s.length-2));
        if(data.sources && data.sources.length > 0){
            listImg = data.sources[0].images.map(img => `<img class="lazy" data-src="${img}" />`);
        }
        if(data.prevUrl){
            const nav = data.prevUrl.replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ย้อนหลัง">ย้อนหลัง</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>","");
        }

        if(data.nextUrl){
            const nav = data.nextUrl.replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ต่อไป">ต่อไป</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>","");
        }

    } else {

        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>","");
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>","");
    }
    
    htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>",listImg.join("\n"));

    return htmlContent;
}

async function manhuathaiChapter(query){
    const host = "https://www.manhuathai.com/";
    const dataContent = await axios.get(`${host}${query}`, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

    if(dataContent === "Request failed with status code 404"){
        return res.status(200).send("Not Found Manga <a href=\"javascript:history.go(-1)\">Go Back</a>");
    }
    const settings = getConfigByDomain(host.getDomain());
    const $ = cheerio.load(dataContent);
    const ch = $("div.listing-chapters_wrap > ul.main > li").map((_,el) => {
        const li = $(el);

        const titles = li.children('a').text();
        const no = titles.getOnlyNumber();
        const urls = li.children('a').attr("href");
        const dates = li.find("span.chapter-release-date").map((_,el) => {
            const i = $(el).find("i");
            if (i.length > 0) {
                return $(i).text();
            }else{
                const a = $(el).find("a");
                if (a.length > 0) {
                    return $(a).attr("title");
                }
                return "";
            }
        });

        const nav = (urls)? urls.replace(host,""):"";
        return {
            no, 
            title: (titles && titles.replace)? titles.cleanText(): null, 
            url: `/manga/${settings.codeUrl}?q=${nav}`, 
            chapterdate: (dates && dates.length > 0)? dates[0] : null, 
        };
    }).get();
    return ch;
}

async function manhuathai(settings, query, htmlContent){
    const host = "https://www.manhuathai.com/";
    const url = `${host}${query}`;

    const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

    if(dataContent === "Request failed with status code 404"){
        return res.status(200).send("Not Found Manga <a href=\"javascript:history.go(-1)\">Go Back</a>");
    }

    const $ = cheerio.load(dataContent);

    const title = $("h1#chapter-heading");
    htmlContent = htmlContent.replaceAll("<%=TITLE%>",$(title).text());

    const prev = $("div#manga-reading-nav-head > div.wp-manga-nav > div.select-pagination > div.nav-links > div.nav-previous > a");

    if(prev && prev.length > 0){
        const nav = $(prev[0]).attr("href").replace(host,"");
        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ย้อนหลัง">ย้อนหลัง</button>`);
    } else {
        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>","");
    }
    const next = $("div#manga-reading-nav-head > div.wp-manga-nav > div.select-pagination > div.nav-links > div.nav-next > a");

    if(next && next.length > 0){
        const nav = $(next[0]).attr("href").replace(host,"");
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ต่อไป">ต่อไป</button>`);
    } else {
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>","");
    }

    const htmBody = $('div.reading-content > div.text-center');
    let contentBody = $(htmBody).html();
    
    // Remove Jquery at Last find
    const listScript = $('div.reading-content > div.text-center > script') 
        .map((_, item) => { 
            return `<script>${$(item).text()}</script>`;
        }) 
        .toArray();
    const f = listScript[listScript.length-1];
    contentBody = contentBody.replace(f,"");

    // Set Image lazy loading
    contentBody = contentBody.replaceAll("<img src=","<img class=\"lazy\" data-src=");

    htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>", contentBody);

    return htmlContent;
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
        console.log(`updated => ${i}/${data.length}`);
    }

    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    let dataJson = JSON.parse(contentJson);
    dataJson[settings.codeUrl] = data;
    fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));
}
//manhuathaiGetManga();

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
        console.log(`updated => ${i}/${data.length}`);
    }

    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    let dataJson = JSON.parse(contentJson);
    dataJson[settings.codeUrl] = data;
    fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));
}
//reapertransGetManga();

module.exports = {
    pageSize: pageSize,
    getConfigByDomain: getConfigByDomain,
    getConfigByCode: getConfigByCode,
    getStoreByPage: getStoreByPage,
    mergeStores: mergeStores,
    reapertrans: reapertrans,
    reapertransChapter: reapertransChapter,
    manhuathai: manhuathai,
    manhuathaiChapter: manhuathaiChapter,
};