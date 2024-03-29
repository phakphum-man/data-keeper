require("./util.string");
const axios = require('axios');
const cheerio = require('cheerio');
const { configs, pageSize, months_th, manga, matchGroup } = require('./mangaStore');
//const puppeteer = require('puppeteer');
async function getImage(url){
    const imgUrl = url ===''? "https://placehold.co/200x300/jpeg?text=Image%20Not%20Found" : url;
    const dataContent = await axios.get(imgUrl, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'arraybuffer' }).then((res) => res.data).catch((err) => err.message);
    //fs.writeFileSync("./99-Wooden-Stick.jpg",dataContent);
    return dataContent;
}

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

function getMangaHits(){
    const allData = manga["store"];
    const allHits = ['Magic Emperor','Martial Peak เทพยุทธ์เหนือโลก','Chronicles of Heavenly Demon', 'Martial God Asura', 'Jujutsu Kaisen', 'Wudao du Zun', 'Tomb Raider King', 'Escort Warrior','Solo Leveling', 'The Great Mage Returns After 4000 Years'];

    let hitData = allHits.map((hit) => 
        allData.find((item)=> item.title.toLowerCase() === hit.toLowerCase())
    );

    return hitData.map((item)=>{
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
            genres: item.genres,
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
    });
}

function getMangaByPage(page, search="", groupId = 0){
    let allData = manga["store"];
    let limitSize = pageSize;

    if(search){
        allData = allData.filter((item)=> item.title.toLowerCase().includes(search.toLowerCase()));
        limitSize = 10;
    }

    if(groupId){
        allData = allData.filter((item)=> matchGroup(item.genres, (groupId-1), item.lastChapter));
    }

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
        
    }).slice((limitSize * (page-1)), (limitSize*page)).map((item)=>{
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
            genres: item.genres,
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
    });
}

function getGenres(){
    return manga["groups"];
}

/** Imprement Manga Reader Content **/

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
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ย้อนหลัง">&#8592;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
        }

        if(data.nextUrl){
            const nav = data.nextUrl.replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ต่อไป">&#8594;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
        }

    } else {

        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
    }
    
    htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>",listImg.join("\n"));

    return htmlContent;
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
        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ย้อนหลัง">&#8592;</button>`);
    } else {
        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
    }
    const next = $("div#manga-reading-nav-head > div.wp-manga-nav > div.select-pagination > div.nav-links > div.nav-next > a");

    if(next && next.length > 0){
        const nav = $(next[0]).attr("href").replace(host,"");
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ต่อไป">&#8594;</button>`);
    } else {
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
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

async function tanukimanga(settings, query, htmlContent){
    const host = "https://www.tanuki-manga.com/";
    const url = `${host}${query}`;

    // HTML set Variable
    const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

    if(dataContent === "Request failed with status code 404"){
        return res.status(200).send("Not Found Manga <a href=\"javascript:history.go(-1)\">Go Back</a>");
    }

    const mtitle = dataContent.match("<h1 class=\"entry-title\" itemprop=\"name\">(.*)</h1>");
    if(mtitle && mtitle.length > 1){
        const s = mtitle[1];
        htmlContent = htmlContent.replaceAll("<%=TITLE%>",s);
    }

    const $ = cheerio.load(dataContent);
    const htmBody = $('#readerarea');
    const mpic = dataContent.match("<script type=\"rocketlazyloadscript\">ts_reader.run(.*);");
    let listImg = [];
    if(mpic && mpic.length > 1){
        const s = mpic[1];
        let data = JSON.parse(s.substr(1, s.length-2));
        if(data.sources && data.sources.length > 0){
            listImg = data.sources[0].images.map(img => {
                const src = img.startsWith("http://lh3.googleusercontent.com")?"https://placehold.co/800x600/jpeg?text=Manga%20Not%20Found":img;
                return `<img class="lazy" data-src="${src}" />`
            });
        }
        if(data.prevUrl){
            const nav = data.prevUrl.replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ย้อนหลัง">&#8592;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
        }

        if(data.nextUrl){
            const nav = data.nextUrl.replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ต่อไป">&#8594;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
        }
        
    }else if(htmBody.length > 0){
        let contentBody = $(htmBody).html();
        
        // Remove Jquery at Last find
        const listScript = $('#readerarea > script') 
            .map((_, item) => { 
                return `<script type="rocketlazyloadscript">${$(item).text()}</script>`;
            }) 
            .toArray();
        const f = listScript[listScript.length-1];
        contentBody = contentBody.replace(f,"");

        contentBody = contentBody.replaceAll("<script type=\"rocketlazyloadscript\">","<script>");

        // Set Image lazy loading
        contentBody = contentBody.replaceAll("<img src=","<img class=\"lazy\" data-src=");

        htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>", contentBody);
        
        const htmNextPrev = $('#content > .wrapper > script');
        if(htmNextPrev.length >1){
            const np = $(htmNextPrev[0]).text();
            const fPrev = `jQuery('.ch-prev-btn').attr("href", "`;
            const navPv = np.slice((np.indexOf(fPrev) + fPrev.length) , np.indexOf(`" == "" ? "#/prev/"`)).replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${navPv}'" title="ย้อนหลัง">&#8592;</button>`);

            const fNext = `jQuery('.ch-next-btn').attr("href", "`;
            const navNt = np.slice((np.indexOf(fNext) + fNext.length) , np.indexOf(`" == "" ? "#/next/"`)).replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${navNt}'" title="ต่อไป">&#8594;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
        }

        return htmlContent;

    } else {
        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
    }
    
    htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>",listImg.join("\n"));

    return htmlContent;
}

async function slowmanga(settings, query, htmlContent){
    const host = "https://www.slow-manga.com/";
    const url = `${host}${query}`;

    // HTML set Variable
    const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

    if(dataContent === "Request failed with status code 404"){
        return res.status(200).send("Not Found Manga <a href=\"javascript:history.go(-1)\">Go Back</a>");
    }

    const mtitle = dataContent.match("<h1 class=\"entry-title\" itemprop=\"name\">(.*)</h1>");
    if(mtitle && mtitle.length > 1){
        const s = mtitle[1];
        htmlContent = htmlContent.replaceAll("<%=TITLE%>",s);
    }

    const $ = cheerio.load(dataContent);
    const htmBody = $('#readerarea');
    const mpic = dataContent.match("<script type=\"rocketlazyloadscript\">ts_reader.run(.*);");
    let listImg = [];
    if(mpic && mpic.length > 1){
        const s = mpic[1];
        let data = JSON.parse(s.substr(1, s.length-2));
        if(data.sources && data.sources.length > 0){
            listImg = data.sources[0].images.map(img => {
                const src = img.startsWith("http://lh3.googleusercontent.com")?"https://placehold.co/800x600/jpeg?text=Manga%20Not%20Found": `/manga/view-image?q=${img}`;
                return `<img class="lazy" data-src="${src}" />`
            });
        }
        if(data.prevUrl){
            const nav = data.prevUrl.replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ย้อนหลัง">&#8592;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
        }

        if(data.nextUrl){
            const nav = data.nextUrl.replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${nav}'" title="ต่อไป">&#8594;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
        }
        
    }else if(htmBody.length > 0){
        let contentBody = $(htmBody).html();
        
        // Remove Jquery at Last find
        const listScript = $('div#content > div.wrapper > script')
            .map((_, item) => { 
                return `<script>${$(item).text()}</scripscript>`;
            }) 
            .toArray();
        const f = listScript[listScript.length-2];
        contentBody = contentBody.replace(f,"");

        contentBody = contentBody.replaceAll("<script type=\"rocketlazyloadscript\">","<script>");

        // Set Image lazy loading
        contentBody = contentBody.replaceAll("<img src=","<img class=\"lazy\" data-src=");

        htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>", contentBody);
        
        const htmNextPrev = $('#content > .wrapper > script');
        if(htmNextPrev.length >1){
            const np = $(htmNextPrev[0]).text();
            const fPrev = `jQuery('.ch-prev-btn').attr("href", "`;
            const navPv = np.slice((np.indexOf(fPrev) + fPrev.length) , np.indexOf(`" == "" ? "#/prev/"`)).replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${navPv}'" title="ย้อนหลัง">&#8592;</button>`);

            const fNext = `jQuery('.ch-next-btn').attr("href", "`;
            const navNt = np.slice((np.indexOf(fNext) + fNext.length) , np.indexOf(`" == "" ? "#/next/"`)).replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='/manga/${settings.codeUrl}?q=${navNt}'" title="ต่อไป">&#8594;</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
        }

        return htmlContent;

    } else {
        htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<span class="no-chapter-prev">&nbsp;</span>`);
        htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<span class="no-chapter-next">&nbsp;</span>`);
    }
    
    htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>",listImg.join("\n"));

    return htmlContent;
}

module.exports = {getImage, getGenres, getMangaByPage, getMangaHits, reapertrans, manhuathai, tanukimanga, slowmanga};