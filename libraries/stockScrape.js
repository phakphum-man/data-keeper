require('dotenv').config();
require("./util.string");
const axios = require('axios');
const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const findPath = (ob, key) => {
    const path = [];
    const keyExists = (obj) => {
        if (!obj || (typeof obj !== "object" && !Array.isArray(obj))) {
            return false;
        } else if (obj.hasOwnProperty(key)) {
            return true;
        } else if (Array.isArray(obj)) {
            let parentKey = path.length ? path.pop() : "";

            for (let i = 0; i < obj.length; i++) {
                path.push(`${parentKey}[${i}]`);
                const result = keyExists(obj[i], key);
                if (result) {
                    return result;
                }
                path.pop();
            }
        } else {
            for (const k in obj) {
                path.push(k);
                const result = keyExists(obj[k], key);
                if (result) {
                    return result;
                }
                path.pop();
            }
        }
        return false;
    };

    keyExists(ob);

    return path.join(".");
};

async function jitta(){
    const host = "https://www.jitta.com/stock/";
    const c = await csv().fromFile(`${process.cwd()}/mnt/servicefiles/nasdaq_screener_1706271324259.csv`);
    let histories = [];
    console.log(`\n\x1b[33mTotal ${c.length} Rows.\x1b[0m`);
    for (let i = 0; i < c.length; i++) {
        const ticker = c[i];

        const symbol = /*"TSLA"*/ticker.Symbol;
        const url = `${host}nasdaq:${symbol?.toLowerCase()}`;
        
        const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            break;
        }
        //fs.writeFileSync(`${process.cwd()}/08022024.html`, dataContent);
        
        const mpic = dataContent.match("<script>\n  window.__APOLLO_STATE__=\{(.*)\};");
        if(mpic && mpic.length > 1){
            const s = mpic[1];
            const data = JSON.parse(`{${s}}`);

            const selectJitta = `$Stock${symbol}.jitta.intel.factor.last`;
            const x = findPath(data, selectJitta);
            if(x != ""){
                let history = {
                    name: data.apollo.data[`Stock${symbol}`].name,
                    symbol: symbol?.toLowerCase(),
                    industry: data.apollo.data[`Stock${symbol}`].industry,
                    summary: data.apollo.data[`Stock${symbol}`].summary,
                    market: data.apollo.data[`Stock${symbol}`].market,
                    scorefactors: data.apollo.data[selectJitta].value.json
                };
                
                const signs = data.apollo.data[`$Stock${symbol}.jitta.intel`].sign.json.map((d,_) => ({ ['type']: d.type , ['title']: d.title, ['value'] : d.value}));
                history['jittaInfos'] = signs;

                const scoreKeys = Object.keys(data.apollo.data).filter((n) => n.startsWith(`$Stock${symbol}.jitta.intel.score({\"limit\":40,\"sort\":\"DESC\"}).values.`));
                const jittaScore = scoreKeys.map((k,_)=> {
                    const g = data.apollo.data[k];
                    return { year: g.year, quarter: g.quarter, value: g.value };
                });
                history['jittaScores'] = jittaScore;

                const priceKeys = Object.keys(data.apollo.data).filter((n) => n.startsWith(`$Stock${symbol}.jitta.intel.monthlyPrice({\"limit\":120,\"sort\":\"DESC\"}).values.`));
                const monthlyPrice = priceKeys.map((k,_)=> {
                    const g = data.apollo.data[k];
                    return { year: g.year, month: g.month, value: g.value };
                });
                history['stockPrices'] = monthlyPrice;

                histories.push(history);
                process.stdout.write(`${(i+1)} `);
            }
        }
    }
    console.log(`\nSaving...`);
    fs.writeFileSync(`${process.cwd()}/jittaData.json`, JSON.stringify({data: histories}));
    console.log(`\n\x1b[33mDone.\x1b[0m`);
}

function convertJsonToExcel(){
    console.log(`\nConverting...`);
    const jittaDataPath = `${process.cwd()}/jittaData.json`;
    const jittaData = fs.readFileSync(jittaDataPath,'utf8');
    const fileName = path.basename(jittaDataPath)
    const jsonData = JSON.parse(jittaData);

    let rows = [];
    for(const data of jsonData.data){

        const score = (data.jittaScores.length > 0)?data.jittaScores.reduce((max, curren) => (max.year > curren.year || (max.year == curren.year && max.quarter > curren.quarter)) ? {year: max.year, quarter: max.quarter, value: max.value} : {year: curren.year, quarter: curren.quarter, value: curren.value}) : null;

        const positives = data.jittaInfos.filter((info) => info.type === 'good');
        const negatives = data.jittaInfos.filter((info) => info.type === 'bad');
        const row = {
            Name: data.name,
            Symbol: data.symbol,
            scoreValue: score?.value,
            scoreYear: score?.year,
            scoreQuarter: score?.quarter,
            "โอกาสการเติบโตของบริษัท": data.scorefactors.growth,
            "ผลการดำเนินงานของบริษัท ล่าสุด": data.scorefactors.recent,
            "ความมั่งคงทางการเงิน": data.scorefactors.financial,
            "ผลตอบแทนสู่ผู้ถือหุ้น": data.scorefactors.return,
            "ความสามารถในการแข่งขัน": data.scorefactors.management,
            Industry: data.industry,
            Summary: data.summary,
            Market: data.market,
            Positive: positives.map(i => `- ${i.title}: ${i.value}`).join('\r\n'),
            Negative: negatives.map(i => `- ${i.title}: ${i.value}`).join('\r\n'),
        };
        rows.push(row);
    }
    const wb = xlsx.utils.book_new();
    const workSheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, workSheet, "review stock");
    xlsx.writeFile(wb, `${process.cwd()}/${fileName}.xlsx`);
    console.log(`\n\x1b[33mDone.\x1b[0m`);
}
//jitta();
//convertJsonToExcel();
module.exports = async (job) => {
    if (job.id){
        jitta();
        return true;
    }
    return false;
};