require('dotenv').config();
require("../libraries/util.string");
const _ = require('lodash');
const moment = require('moment');
const asyncHandler = require('express-async-handler');
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const mongodb = require('../libraries/mongodb');
const excel = require("../libraries/excel");
const googleDrive = require("../libraries/googleDrive");

async function scrapingHtml(html){
    // - part cheerio
    const $ = cheerio.load(html);

    const findItem = (element) => {
        return {
            gold_date : moment(element.eq(0).text().cleanAll(), 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY HH:mm'),
            no : parseInt(element.eq(1).text().cleanAll()),
            bar_purchase : parseFloat(element.eq(2).text().cleanAll().replace(/,/g, '')),
            bar_sale : parseFloat(element.eq(3).text().cleanAll().replace(/,/g, '')),
            ornament_purchase : parseFloat(element.eq(4).text().cleanAll().replace(/,/g, '')),
            ornament_sale : parseFloat(element.eq(5).text().cleanAll().replace(/,/g, '')),
        };
    };

    let elItems = Array.from($('section#content > article > div.menu4sub').find('div.table-responsive'));
    let listResult = [];
    elItems.forEach((elItem, index) => {
        let targetItems = Array.from($(elItem).find('table > tbody').find('tr'));
        const letGo = (index === 0 )? 3 : 0; // start from -> อังคารที่ 9 พฤษภาคม 66
        for (let i = letGo; i < targetItems.length; i++) {
            if($(targetItems[i]).find("td#tol").length === 0 && $(targetItems[i]).find("td").eq(0).text() != "" ){
                listResult.push(findItem($(targetItems[i]).find("td")));
            }
        }
    });

    return listResult;
}

async function goldprice(outFileName, iv){
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.NODE_ENV === 'development'? null : '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-gpu'
        ],
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    console.log(`start url ${arguments.callee.name}`);
    await page.goto("https://xn--42cah7d0cxcvbbb9x.com/%E0%B8%A3%E0%B8%B2%E0%B8%84%E0%B8%B2%E0%B8%97%E0%B8%AD%E0%B8%87%E0%B8%A2%E0%B9%89%E0%B8%AD%E0%B8%99%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%87/");
    console.log(`evaluate ${arguments.callee.name}`);
    const eval = await page.evaluate(() => {
        return {
            html: document.documentElement.innerHTML,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        };
    });
    
    let listHtml = [];
    // - part cheerio
    const $ = cheerio.load(eval.html);
    //Pagenation
    const pageItem = $('section#content > article > div.menu4').find('a');
    
    let start = false;
    for(let i = 0;i < pageItem.length; i++){

        start = ($(pageItem[i]).attr("title").substring(0, "ราคาทองย้อนหลัง".length) === "ราคาทองย้อนหลัง");
        const navUrl = $(pageItem[i]).attr("href");
        if(start && navUrl != "#"){
            console.log(`navUrl ${arguments.callee.name} "${navUrl}"`);
            await page.goto(navUrl);

            const eval = await page.evaluate(() => {
                return {
                    html: document.documentElement.innerHTML,
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight,
                };
            });
            listHtml.push(eval.html);
        }
    }

    for(let i = 0;i < listHtml.length; i++){
        // Html Scraping
        const jsonData = await scrapingHtml(listHtml[i]);

        const listGolddate = jsonData.map((d) => (d.gold_date))
        const oldData = await mongodb.getAll("goldprice", { gold_date: {$in: listGolddate}});
        const newData =  _.differenceBy(jsonData, oldData, "gold_date");
        if(newData.length > 0){
            await mongodb.insertArray("goldprice", newData);
            console.log("save goldprice to mongodb complete");
        }
    }

    const exportData = await mongodb.getAll("goldprice", {});
    
    let wb = excel.createNewWorkBook();
    let ws = excel.createNewWorkSheet(exportData);

    let fileName = outFileName || `servicefiles/${__filename.slice(__dirname.length + 1, -3)}${excel.newDateFileName()}`;
    excel.exportFileXlsx(wb, ws, fileName);
    console.log("goldprice generate file complete");
    
    if(iv){
        googleDrive.exportToDrive(iv,"1dY1s1gMMHShjlsmiqA6DnzWjRK7DZQpc", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `${fileName}.xlsx`);
    }

    await browser.close();
}

module.exports = function (app) {
	
    app.get('/goldprice/excel', asyncHandler( 
        async (req, res) => {
            // #swagger.tags = ['KrungsriProperty']
            // #swagger.description = 'Generate excel file.'
            let iv = req.query.iv;
            const fileDownload = `gold_price${excel.newDateFileName()}`;
            goldprice(`servicefiles/${fileDownload}`, iv);

            const data = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileDownload}.xlsx" target="_blank">download</a>`;
            /* #swagger.responses[200] = { 
                content: { "text/plain": schema: { type: string} },
                description: 'expected result.' 
            } */
            return res.status(200).send(data);

        })
    );

}
