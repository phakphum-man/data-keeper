require('dotenv').config();
require("../libraries/util.string");
const fs = require('fs');
const path = require('path');
const mangaScrape = require('../libraries/mangaScrape');

module.exports = function (app) {
    app.get('/manga', async (req, res) => {
        const p = req.query.p;
        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        const pNo = (p)? parseInt(p.getOnlyNumber()) : 1;
        let htmlContent = fs.readFileSync(`${rootPath}/manga.html`, 'utf8');

        if(pNo > 1){
            htmlContent = htmlContent.replace("<%=BTN_PREV%>",`<a class="btn-link" href="/manga/?p=${(pNo-1)}">Newer Posts</a>`);
        }else{
            htmlContent = htmlContent.replace("<%=BTN_PREV%>","");
        }
        const totalPage = (mangaScrape.mergeStores().length / mangaScrape.pageSize)
        if((pNo + 1) < totalPage){
            htmlContent = htmlContent.replace("<%=BTN_NEXT%>",`<a class="btn-link" href="/manga/?p=${(pNo+1)}">Older Posts</a>`);
        }else{
            htmlContent = htmlContent.replace("<%=BTN_NEXT%>","");
        }
        return res.status(200).send(htmlContent);
    });

    app.get('/manga/host', async (req, res) => {
        let htmlContent = `<!DOCTYPE html>
        <html>
            <head>
                <title>Chapter finder</title>
                <script type="text/javascript" src="/public/ajax.js"></script>
            </head>
      <body>
      <a href="/manga">Go to Home</a>
    <div class="form-center">
      <form>
        <label for="url">Paste the link manga:</label>
        <input type="text" id="url" name="url">
        <input type="button" onclick="goChapter();" value="Go Chapter">
      </form>
      
    </div>
    
      <script type="text/javascript">function goChapter(){
        let url = document.getElementById('url').value;
        let l = document.createElement("a");
        l.href = url;
        getAjax("/manga/getroute",{s:l.hostname},(data) => {
            const result = JSON.parse(data);
            if(result.status === true){
                window.location.href=\`/manga/$\{result.code\}?q=$\{l.pathname\}\`;
            }else{
                alert(result.message);
            }
        });
      }</script>
      <style type="text/css">
      input[type="text"] { min-width: 600px;}
      .form-center {
        display:flex;
        justify-content: center;
      }
      </style>
      </body>
    </html>`;
        return res.status(200).send(htmlContent);
    });
    
    app.get('/manga/api', async (req, res) => {
        // #swagger.ignore = true
        const p = req.query.p;
        if(!p || !p.isNumber()){
            return res.status(404).send("Not Found");
        }

        const rows =  mangaScrape.getStoreByPage(parseInt(p));
        if(rows) {
            return res.status(200).send({data: rows});
        }
        return res.status(404).send("Not Found");
    });

    app.get('/manga/getroute', async (req, res) => {
        // #swagger.ignore = true
        const s = req.query.s;
        if(!s){
            return res.status(404).send("Not Found");
        }

        const setting =  mangaScrape.getConfigByDomain(s);
        if(setting) {
            return res.status(200).send({status: true, code: setting.codeUrl});
        }
        return res.status(200).send({status: false, message:"Not Found"});
    });

    app.get('/manga/chapter/:codeurl', async (req, res) => {
        // #swagger.ignore = true

        const query = req.query.q;
        if(!query){
            return res.status(404).send("Not Found");
        }

        const setting =  mangaScrape.getConfigByCode(req.params.codeurl);
        if(!setting){
            return res.status(404).send("Not Found");
        }

        const chAt = query.indexOf('ตอนที่');
        if(chAt !== -1) {
            const qCh = query.substr(0, chAt-1);
            const chList = await mangaScrape[setting.methodChapter](`${qCh}/`);
            return res.status(200).send({ chapters : chList});
        }

        return res.status(404).send("Not Found");
    });

    app.get('/manga/:codeurl', async (req, res) => {
        // #swagger.ignore = true

        const q = req.query.q;
        if(!q){
            return res.status(404).send("Not Found");
        }

        const selfPath = path.dirname(__dirname);
        const rootPath = selfPath.replace(`/${selfPath}`,"");

        let htmlContent = fs.readFileSync(`${rootPath}/readmanga.html`, 'utf8');
        const setting =  mangaScrape.getConfigByCode(req.params.codeurl);
        if(!setting){
            return res.status(404).send("Not Found");
        }
        htmlContent = await mangaScrape[setting.method](setting, q, htmlContent);
        return res.status(200).send(htmlContent);
    });
};