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
    for (let i = 0; i < /*c.length*/1; i++) {
        const ticker = c[i];

        const url = `${host}nasdaq:${ticker.Symbol}`;

        const dataContent = await axios.get(url, { headers: {'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}, responseType: 'utf-8' }).then((res) => res.data).catch((err) => err.message);

        if(dataContent === "Request failed with status code 404"){
            break;
        }

        const mpic = dataContent.match("<script>\n  window.__APOLLO_STATE__=\{(.*)\};");
        if(mpic && mpic.length > 1){
            const s = mpic[1];
            const data = JSON.parse(`{${s}}`);
            console.log(findPath(data, "$StockTSLA.jitta.intel.factor.last"));
        }
    }
}

//jitta();