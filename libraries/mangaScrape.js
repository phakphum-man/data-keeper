require("../libraries/util.string");
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
//const puppeteer = require('puppeteer');

const configs = [
    { codeUrl: 'read-magic-0001', host: 'http://reapertrans.com', method: 'reapertrans', methodChapter: 'reapertransChapter'},
    { codeUrl: 'read-magic-0002', host: 'http://www.manhuathai.com', method: 'manhuathai', methodChapter: 'manhuathaiChapter'},
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

function getStoreByPage(page, codeUrl="*"){
    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    const dataJson = JSON.parse(contentJson);

    if(codeUrl === "*"){

    }

    const pageSize = 16;
    return dataJson[codeUrl].slice((pageSize * (page-1)), (pageSize*page));
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
            const objJson = { 
                title: a.attr('title'),
                sourceUrl: a.attr('href'),
                imgUrl: img.attr('data-src'),
                score: score.text(),
                lastChapter: {
                    no: (no!==null)? parseInt(no): "",
                    url: lastCh.attr('href'),
                    date: itemDate.find('span.post-on').text().cleanText(),
                }
            };
            
            data.push(objJson);
        });
    }
    const contentJson = fs.readFileSync(`${process.cwd()}/mnt/data/manga.json`,'utf8');
    let dataJson = JSON.parse(contentJson);
    dataJson[settings.codeUrl] = data;
    fs.writeFileSync(`${process.cwd()}/mnt/data/manga.json`, JSON.stringify(dataJson));
}
//manhuathaiGetManga();

module.exports = {
    getConfigByDomain: getConfigByDomain,
    getConfigByCode: getConfigByCode,
    getStoreByPage: getStoreByPage,
    reapertrans: reapertrans,
    reapertransChapter: reapertransChapter,
    manhuathai: manhuathai,
    manhuathaiChapter: manhuathaiChapter,
};