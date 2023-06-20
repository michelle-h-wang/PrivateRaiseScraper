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
        res += key + ': \n \t * ' + d[key] + '\n';
    }
    return res; 
}

async function main(url) {
    const ci = await companyInfo.companyInformation(url);
    const info = ci.getResult();

    const strInfo = dictToString(info);
    console.log(strInfo);
    fs.writeFileSync("src/info.html", strInfo);
    return strInfo;
}

exports.main = (url) => {main(url)}
