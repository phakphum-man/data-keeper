const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csvtojson');

// Function to get a random user agent from the list
const getRandomUserAgent = (userAgentsList) => {
    const randomIndex = Math.floor(Math.random() * userAgentsList.length);
    return userAgentsList[randomIndex];
};

const axioFix403Header = () => {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    ];
    const randomUserAgent = getRandomUserAgent(userAgents);
    const reqHeaders = {
        'authority': 'www.google.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'cookie': 'SID=ZAjX93QUU1NMI2Ztt_dmL9YRSRW84IvHQwRrSe1lYhIZncwY4QYs0J60X1WvNumDBjmqCA.; __Secure-#..', // Cookie value truncated for brevity
        'sec-ch-ua': '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
        'sec-ch-ua-arch': '"x86"',
        'sec-ch-ua-bitness': '"64"',
        'sec-ch-ua-full-version': '"115.0.5790.110"',
        'sec-ch-ua-full-version-list': '"Not/A)Brand";v="99.0.0.0", "Google Chrome";v="115.0.5790.110", "Chromium";v="115.0.5790.110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-model': '""',
        'sec-ch-ua-platform': 'Windows',
        'sec-ch-ua-platform-version': '15.0.0',
        'sec-ch-ua-wow64': '?0',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': randomUserAgent,
    };

    return reqHeaders;
};

const getJsonOffline = (fileData) => {
    const data = fs.readFileSync(fileData,"utf-8");
    return JSON.parse(data);
};

const getJsonOnline = async(url) => {
    const dataBuff = await axios.get(url, { headers: axioFix403Header(), responseType: 'utf-8' }).then((res) => res.data);
    return JSON.parse(dataBuff);
};

const getCsvToJsonOffline = async(fileData) => {
    let c = await csv().fromFile(fileData);
    return c;
};

const getCsvToJsonOnline = async(url) => {
    const resData = await axios.get(url, { headers: axioFix403Header(), responseType: 'stream' });
    return await csv().fromStream(resData.data);
};

const prepareData = async(data, funcPrepareImage) => {
    if(data && !(data instanceof Array) && typeof data == 'object'){
        for (let key in data) {
            if(data[key] && typeof data[key] === 'object' && !(data[key] instanceof Array)) {
                await prepareData(data[key], funcPrepareImage);
            } else if (typeof(data[key]) === "string" && funcPrepareImage && typeof(funcPrepareImage) == 'function' 
                && (data[key].startsWith('$url#png:') || data[key].startsWith('$url#jpg:'))
            ) {
                data[key] = await funcPrepareImage(data[key]);
            } else if(data[key] && (data[key] instanceof Array) && typeof data[key] === 'object'){ // for array
                await Promise.all(data[key].map(async children => { 
                    await prepareData(children, funcPrepareImage);
                    return children;
                }));
            }
        }
    } else if(data && (data instanceof Array) && typeof data === 'object'){// for array
        await Promise.all(data.map(async child => { 
            await prepareData(child, funcPrepareImage);
            return child;
        }));
    }

    return data;
};

const getSavePath = (reportParams) => {
    const dirPath = path.dirname(reportParams.fileOutput);
    const saveFileName = path.basename(reportParams.referLink).replace("download?f=", "");
    return path.join(dirPath, `${saveFileName}`);
};
module.exports = { prepareData , getJsonOffline, getJsonOnline, getCsvToJsonOffline, getCsvToJsonOnline, getSavePath};