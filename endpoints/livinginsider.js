require('dotenv').config();
require("../libraries/util.string");
const asyncHandler = require('express-async-handler');
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const xlsx = require('xlsx');
const excel = require("../libraries/excel");
const googleDrive = require("../libraries/googleDrive");

async function scrapingHtml(html){
    // - part cheerio
    const $ = cheerio.load(html);
    
    const findItem = (element) => {
        let elImg = $(element).find('div.istock-list  > div.item-img');
        let elDesc = $(element).find('div.istock-list  > div.item-desc > div.row');
        //let spanPrice = $(element).find('table > tbody > tr > td > table > tbody > tr > td > span').eq(1);
       
        return {
            typeFor : elImg.find('div.listing-tag > div.tag-topic-card > span').text().cleanAll(),
            title : elDesc.eq(0).find('div > a').text().cleanAll(),
            location : elDesc.eq(3).find('div.col-md-12 > div.col-md-12 > span').text().cleanAll(),
            floor : elDesc.eq(4).find('div.div-ic-detail > div.ic-detail').eq(1).text().cleanAll(),
            roomArea : elDesc.eq(4).find('div.div-ic-detail > div.ic-detail').first().text().cleanAll(),
            bedRoom : elDesc.eq(4).find('div.div-ic-detail > div.ic-detail').eq(2).text().cleanAll(),
            bathRoom : elDesc.eq(4).find('div.div-ic-detail > div.ic-detail').eq(3).text().cleanAll(),
            priceNormal : elImg.find('div.listing-cost div').first().text().cleanAll(),
            price : elImg.find('div.listing-cost div').last().text().cleanAll(),
            image : elImg.find('a img').attr('src'),
            referLink: elDesc.eq(0).find('div > a').attr('href'),
            lastDate : elDesc.eq(1).find('div.crad-date-view > div.istock-lastdate').text().cleanAll(),
        };
    };
    
    let elItem = $('div.page-inside > section.block-inside > div.container > div.row').eq(2);
    let saleItem = $(elItem).find('div.col-md-12 > div.panel > div.panel-body > div.row').eq(0);
    const listResult = Array.from($(saleItem).find('div.col-md-3'))
        .map((element) => findItem(element)) || [];

    return listResult;
}

async function sellcost(outFileName, iv){
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
    await page.goto("https://www.livinginsider.com/sell_at_cost.php");
    console.log(`evaluate ${arguments.callee.name}`);
    const eval = await page.evaluate(() => {
        return {
            html: document.documentElement.innerHTML,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        };
    });

    let listHtml = [];

    listHtml.push(eval.html);
    
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
          c: 9,
          r: i
        })].l = { Target: jsonData[i-1].image };

        ws[xlsx.utils.encode_cell({
            c: 10,
            r: i
          })].l = { Target: jsonData[i-1].referLink };
    }

    let fileName = outFileName || `${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${__filename.slice(__dirname.length + 1, -3)}${excel.newDateFileName()}`;
    excel.exportFileXlsx(wb, ws, fileName);
    console.log("Livinginsider sellcost generate file complete");

    googleDrive.exportToDrive("1dY1s1gMMHShjlsmiqA6DnzWjRK7DZQpc", `${fileName}.xlsx`);

    await browser.close();
}

async function rayong(outFileName, iv){
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
    await page.goto("https://www.livinginsider.com/living_zone/121/Land/Buysell/1/%E0%B8%A3%E0%B8%B0%E0%B8%A2%E0%B8%AD%E0%B8%87.html");
    console.log(`evaluate ${arguments.callee.name}`);
    const eval = await page.evaluate(() => {
        return {
            html: document.documentElement.innerHTML,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        };
    });

    let listHtml = [];

    listHtml.push(eval.html);
    
    // - part cheerio
    const $ = cheerio.load(eval.html);
    //Pagenation
    const pageItem = $('nav.page-navigation > ul.pagination > li:not(.disabled)');
    let lastLink = pageItem.last().find("a").attr("href");
    
    const urlPage = lastLink.slice(lastLink.lastIndexOf("/"));
    let subStrLast = lastLink.replace(urlPage, "");
    let lastPage = subStrLast.slice(subStrLast.lastIndexOf("/")+1);
    
    for(let i = 1;i < parseInt(lastPage); i++){
        const navUrl = lastLink.replace(`${lastPage}${urlPage}`,`${i}${urlPage}`);
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
          c: 9,
          r: i
        })].l = { Target: jsonData[i-1].image };

        ws[xlsx.utils.encode_cell({
            c: 10,
            r: i
          })].l = { Target: jsonData[i-1].referLink };
    }

    let fileName = outFileName || `${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${__filename.slice(__dirname.length + 1, -3)}${excel.newDateFileName()}`;
    excel.exportFileXlsx(wb, ws, fileName);
    console.log("Livinginsider rayong generate file complete");

    googleDrive.exportToDrive("1dY1s1gMMHShjlsmiqA6DnzWjRK7DZQpc", `${fileName}.xlsx`);

    await browser.close();
}

async function chonburi(outFileName, iv){
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.NODE_ENV === 'development'? null : '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-gpu'
        ],
    });

    const page = await browser.newPage();
    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);
    
    console.log(`start url ${arguments.callee.name}`);
    await page.goto("https://www.livinginsider.com/living_zone/42/Land/Buysell/1/%E0%B8%9E%E0%B8%B1%E0%B8%97%E0%B8%A2%E0%B8%B2-%E0%B8%9A%E0%B8%B2%E0%B8%87%E0%B9%81%E0%B8%AA%E0%B8%99.html");
    console.log(`evaluate ${arguments.callee.name}`);
    const eval = await page.evaluate(() => {
        return {
            html: document.documentElement.innerHTML,
            width: document.documentElement.clientWidth,
            height: document.documentElement.clientHeight,
        };
    });

    let listHtml = [];

    listHtml.push(eval.html);
    
    // - part cheerio
    const $ = cheerio.load(eval.html);
    //Pagenation
    const pageItem = $('nav.page-navigation > ul.pagination > li:not(.disabled)');
    //Array.from($('nav.page-navigation > ul.pagination > li:not(.disabled)'))
    //.map((elem) => ( parseInt($(elem).find('a').text().trim()))) || [];
    let lastLink = pageItem.last().find("a").attr("href");
    
    const urlPage = lastLink.slice(lastLink.lastIndexOf("/"));
    let subStrLast = lastLink.replace(urlPage, "");
    let lastPage = subStrLast.slice(subStrLast.lastIndexOf("/")+1);
    
    for(let i = 1;i < parseInt(lastPage); i++){
        const navUrl = lastLink.replace(`${lastPage}${urlPage}`,`${i}${urlPage}`);
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
          c: 9,
          r: i
        })].l = { Target: jsonData[i-1].image };

        ws[xlsx.utils.encode_cell({
            c: 10,
            r: i
          })].l = { Target: jsonData[i-1].referLink };
    }

    let fileName = outFileName || `${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${__filename.slice(__dirname.length + 1, -3)}${excel.newDateFileName()}`;
    excel.exportFileXlsx(wb, ws, fileName);
    console.log("Livinginsider chonburi generate file complete");
    
    googleDrive.exportToDrive("1dY1s1gMMHShjlsmiqA6DnzWjRK7DZQpc", `${fileName}.xlsx`);
    
    await browser.close();
}

module.exports = function (app) {
	
    app.get('/livinginsider/sellcost', asyncHandler( 
        async (req, res) => {
            // #swagger.tags = ['KrungsriProperty']
            // #swagger.description = 'Generate excel file.'
            let iv = req.query.iv;
            const fileDownload = `sell_at_cost${excel.newDateFileName()}`;
            sellcost(`${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${fileDownload}`, iv);

            const data = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileDownload}.xlsx" target="_blank">download</a>`;
            /* #swagger.responses[200] = { 
                content: { "text/plain": schema: { type: string} },
                description: 'expected result.' 
            } */
            return res.status(200).send(data);

        })
    );

    app.get('/livinginsider/rayong', asyncHandler( 
        async (req, res) => {
            // #swagger.tags = ['KrungsriProperty']
            // #swagger.description = 'Generate excel file.'
            let iv = req.query.iv;

            const fileDownload = `rayong${excel.newDateFileName()}`;
            rayong(`${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${fileDownload}`, iv);

            const data = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileDownload}.xlsx" target="_blank">download</a>`;
            /* #swagger.responses[200] = { 
                content: { "text/plain": schema: { type: string} },
                description: 'expected result.' 
            } */
            return res.status(200).send(data);

        })
    );

    app.get('/livinginsider/chonburi', asyncHandler( 
        async (req, res) => {
            // #swagger.tags = ['KrungsriProperty']
            // #swagger.description = 'Generate excel file.'
            let iv = req.query.iv;

            const fileDownload = `chonburi${excel.newDateFileName()}`;
            chonburi(`${(process.env.NODE_ENV !== 'production')?'./mnt':'/mnt'}/servicefiles/${fileDownload}`, iv);

            const data = `<a href="${req.protocol}://${req.get('host')}/download?f=${fileDownload}.xlsx" target="_blank">download</a>`;
            /* #swagger.responses[200] = { 
                content: { "text/plain": schema: { type: string} },
                description: 'expected result.' 
            } */
            return res.status(200).send(data);

        })
    );
}
