const request = require("request-promise").defaults({jar: true }); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request
const puppeteer = require("puppeteer");
const companyInfo = require("./scraperClass.js");
const prompt=require("prompt-sync")({sigint:true});

/**
 * 
 * @param {*} d dictionary to turn to string
 * @returns string rep of dict in the form {key}: \n {value}
 */
function dictToString(d) {
    res = '';
    for (const key in d) {
        res += key.toUpperCase() + ': \n \t * ' + d[key] + '\n \n';
    }
    return res; 
}

/**
 * 
 * @param {*} url 
 * @returns stringified dictionary of values
 */
async function main(url) {
    const ci = await companyInfo.companyInformation(url);
    const info = ci.getResult();

    const strInfo = dictToString(info);
    fs.writeFileSync("src/info.html", strInfo);
    return strInfo;
}

exports.main = async (url) => {return await main(url)}
