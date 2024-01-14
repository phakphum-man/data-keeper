require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
//const puppeteer = require('puppeteer');
module.exports = function (app) {
    app.get('/manga', async (req, res) => {
        let htmlContent = `<div class="form-center"><form>
        <label for="url">Paste the link manga:</label>
        <input type="text" id="url" name="url"><br />
        <input type="button" onclick="goChapter();" value="Go Chapter">
      </form>
      </div>
      <script type="text/javascript">function goChapter(){
        let url = document.getElementById('url').value;
        let l = document.createElement("a");
        l.href = url;
        window.location.href=\`/manga/$\{l.hostname.replaceAll(".","-")\}?q=$\{l.pathname\}\`;
      }</script>
      <style type="text/css">
      input[type="text"] { min-width: 600px;}
      .form-center {
        display:flex;
        justify-content: center;
      }
      </style>`;
        return res.status(200).send(htmlContent);
    });

    app.get('/manga/reapertrans-com', async (req, res) => {
        // #swagger.ignore = true

        const q = req.query.q;
        if(!q){
            return res.status(404).send("Not Found");
        }

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        let htmlContent = fs.readFileSync(`${rootPath}/manga.html`, 'utf8');

        const host = "https://reapertrans.com/";
        const url = `${host}${q}`;
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
                htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='${req.route.path}?q=${nav}'" title="ย้อนหลัง">ย้อนหลัง</button>`);
            } else {
                htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>","");
            }

            if(data.nextUrl){
                const nav = data.nextUrl.replace(host,"");
                htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='${req.route.path}?q=${nav}'" title="ต่อไป">ต่อไป</button>`);
            } else {
                htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>","");
            }

        } else {

            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>","");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>","");
        }
        
        htmlContent = htmlContent.replace("<%=LIST_IMG_MANGA%>",listImg.join("\n"));
        return res.status(200).send(htmlContent);
    });

    app.get('/manga/www-manhuathai-com', async (req, res) => {
        // #swagger.ignore = true

        const q = req.query.q;
        if(!q){
            return res.status(404).send("Not Found");
        }

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        let htmlContent = fs.readFileSync(`${rootPath}/manga.html`, 'utf8');

        const host = "https://www.manhuathai.com/";
        const url = `${host}${q}`;

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
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>",`<button class="btn btnPrev" onclick="javascript:window.location.href='${req.route.path}?q=${nav}'" title="ย้อนหลัง">ย้อนหลัง</button>`);
        } else {
            htmlContent = htmlContent.replaceAll("<%=BTN_PREV%>","");
        }
        const next = $("div#manga-reading-nav-head > div.wp-manga-nav > div.select-pagination > div.nav-links > div.nav-next > a");

        if(next && next.length > 0){
            const nav = $(next[0]).attr("href").replace(host,"");
            htmlContent = htmlContent.replaceAll("<%=BTN_NEXT%>",`<button class="btn btnNext" onclick="javascript:window.location.href='${req.route.path}?q=${nav}'" title="ต่อไป">ต่อไป</button>`);
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

        return res.status(200).send(htmlContent);
    });
};