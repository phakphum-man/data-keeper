require('dotenv').config();
require("./util.string");
const axios = require('axios');
const csv = require('csvtojson');
const fs = require('fs');

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
//jitta();
module.exports = async (job) => {
    if (job.id){
        jitta();
        return true;
    }
    return false;
};