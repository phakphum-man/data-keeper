require("../libraries/util.string");
const asyncHandler = require('express-async-handler');
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const xlsx = require('xlsx');
const excel = require("../libraries/excel");

async function scrapingHtml(html){
    // - part cheerio
    const $ = cheerio.load(html);
    
    const findItem = (element) => {
        // //*[@id="dtList"]/tbody/tr[2]/td/ table/tbody/tr/td[2]/table/tbody/tr[2]/td[1]/table[1]/tbody/tr/td[1]
        let img = $(element).find('table > tbody > tr > td > table > tbody > tr > td > input');
        let elItem = $(element).find('table > tbody > tr > td > table > tbody > tr > td > table');
        let spanPrice = $(element).find('table > tbody > tr > td > table > tbody > tr > td > span').eq(1);
       // //*[@id="dtList"]/tbody/tr[20]/td/ table/tbody/tr/td[1]/table/tbody/tr[1]/td
        return {
            title : $(element).find('table > tbody > tr > td > table > tbody > tr > td > span').text().trim().removeNewLine().cleanSpace(),
            type : elItem.eq(0).find('table > tbody > tr > td').text().trim().removeNewLine().cleanSpace(),
            area : elItem.eq(1).find('table > tbody > tr > td').text().trim().removeNewLine().cleanSpace(),
            district : elItem.eq(2).find('table > tbody > tr > td').text().trim().removeNewLine().cleanSpace(),
            province : elItem.eq(3).find('table > tbody > tr > td').text().trim().removeNewLine().cleanSpace(),
            price : spanPrice.text().trim().removeNewLine().cleanSpace(),
            image : `https://www.krungsriproperty.com/${img.attr('src')}`
        };
    };
    
    //*[@id="dtList"]/tbody/tr[2]
    const listResult = Array.from($('#dtList > tbody > tr'))
        .filter(e => $(e).find("table").children().length > 0)
        .map((element) => findItem(element)) || [];

    return listResult;
};

async function webLaunch(outFileName){
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    await page.goto("https://www.krungsriproperty.com/ListPage.aspx");

    const selectText  = async (element,text) => {
        const selectOption = (await page.$x(
        `//*${element}/option[text() = "${text}"]`
        ))[0];
        const val = await (await selectOption.getProperty('value')).jsonValue();
        return val;
    };

    // const ddlAssetWebTypeOption = (await page.$x(
    // '//*[@id = "ddlAssetWebType"]/option[text() = "บ้านเดี่ยว"]'
    // ))[0];
    // const ddlAssetWebTypeVal = await (await ddlAssetWebTypeOption.getProperty('value')).jsonValue();

    await page.select('#ddlAssetWebType', await selectText('[@id = "ddlAssetWebType"]','บ้านเดี่ยว'));
    await page.select('#ddlProvince', await selectText('[@id = "ddlProvince"]','กรุงเทพมหานคร'));

    const navigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
    await page.click('#btnSearch');
    await navigationPromise;
    
    // - take screenshot
    //await page.screenshot({ path: "image.png"});

    const eval = await page.evaluate(() => {
        return {
            html: document.documentElement.innerHTML,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        };
    });

    //*[@id="MainContent_dlPaging"]
    // console.log(eval.html);

    let listHtml = [];

    // - part cheerio
    const $ = cheerio.load(eval.html);
    listHtml.push(eval.html);

    //Pagenation
    const listPage = Array.from($('#MainContent_dlPaging > tbody > tr > td'))
    .map((elem) => ( parseInt($(elem).find('a').text().trim()))) || [];

    //console.log(listPage);

    for(let i = 1;i < listPage.length; i++){
        const navigationPromise = page.waitForNavigation({ waitUntil: ['load', 'networkidle2'] });
        await page.click('#MainContent_dlPaging_lnkbtnPaging_'+ i);
        await navigationPromise;

        const eval = await page.evaluate(() => {
            return {
                html: document.documentElement.innerHTML,
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            };
        });

        listHtml.push(eval.html);
    }
    
    // Html Scraping
    let jsonData = [];
    for(let i = 0;i < listHtml.length; i++){
        jsonData = jsonData.concat(await scrapingHtml(listHtml[i]));
    }
    //console.log(jsonData);

    let wb = excel.createNewWorkBook();
    let ws = excel.createNewWorkSheet(jsonData);

    for (let i = 1; i < jsonData.length + 1; i++) {
        ws[xlsx.utils.encode_cell({
          c: 6,
          r: i
        })].l = { Target: jsonData[i-1].image };
    }

    excel.exportFileXlsx(wb, ws, outFileName);
    console.log("Krungsri generate file complete");

    await browser.close();
}

module.exports = function (app) {
	
    app.get('/krungsri/excel', asyncHandler( 
        async (req, res) => {
            // #swagger.tags = ['KrungsriProperty']
            // #swagger.description = 'Generate excel file.'

            webLaunch(`servicefiles/krungsriproperty_home${excel.newDateFileName()}`);

            const data = { message: "processing..."};
            /* #swagger.responses[200] = { 
                schema: { $ref: "#/definitions/Generate" },
                description: 'expected result.' 
            } */
            return res.status(200).send(data);

        })
    );

}