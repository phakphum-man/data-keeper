require("./util.string");
const axios = require('axios');
const cheerio = require('cheerio');
const { getConfigByDomain, mergeStores } = require('./mangaStore');
async function reapertransChapter(query){
    const host = "https://reapertrans.com/";
    const chAt = query.indexOf('ตอนที่');
    const title = query.substr(0, chAt-1);
    const store = mergeStores().find(x => x.title === title && x.sourceUrl.startsWith(host));
    if (!store.sourceUrl){
        console.log("Found Manga from title " + query);
        return [];
    }
    const dataContent = await axios.get(store.sourceUrl, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);
    
    if(dataContent === "Request failed with status code 404"){
        console.log("HTTP Get Not Found Manga");
        return [];
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

async function manhuathaiChapter(query){
    const host = "https://www.manhuathai.com/";
    const chAt = query.indexOf('ตอนที่');
    const title = query.substr(0, chAt-2).trim().replace(/[^A-Za-z0-9]/g, "");

    const store = mergeStores().find(x => x.title?.replace(/[^A-Za-z0-9]/g, "") === title && x.sourceUrl.startsWith(host));
    if (!store || !store.sourceUrl){
        console.log("Not Found Manga from title " + query);
        return [];
    }
    const dataContent = await axios.get(store.sourceUrl, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

    if(dataContent === "Request failed with status code 404"){
        console.log("HTTP Get Not Found Manga");
        return [];
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

module.exports = { reapertransChapter, manhuathaiChapter }