const fs = require('fs');
const axios = require('axios');
const csv = require('csvtojson');

const getJsonOffline = (fileData) => {
    const data = fs.readFileSync(fileData,"utf-8");
    return JSON.parse(data);
};

const getJsonOnline = async(url) => {
    const dataBuff = await axios.get(url, { responseType: 'utf-8' }).then((res) => res.data);
    return JSON.parse(dataBuff);
};

const getCsvToJsonOffline = async(fileData) => {
    let c = await csv().fromFile(fileData);
    return c;
};

const getCsvToJsonOnline = async(url) => {
    const resData = await axios.get(url, { responseType: 'stream' });
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

module.exports = { prepareData , getJsonOffline, getJsonOnline, getCsvToJsonOffline, getCsvToJsonOnline};