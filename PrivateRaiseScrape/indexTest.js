const request = require("request-promise").defaults({jar: true }); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request
const puppeteer = require("puppeteer");
const { exec } = require("child_process");


const PR = "https://www.privateraise.com";
const URL = "https://www.privateraise.com/pipe/search/equity.php?placementid=43527&RA=1&SID=bn8lih5uei5km309o4qaptt2u2";
const username = 'bcoyne@arenaco.com';
const password = 'Arena2022';

async function tryLogin(page) {
    await page.type("input#username", username);
    await page.type("input#password", password);
    await page.click("input#login-button");
}

async function main() {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto(PR);

        await tryLogin(page);
        
        while (page.url() === "https://www.privateraise.com/index.php") {
            await tryLogin(page);
        }
        
        await page.waitForNavigation();
        
    } catch (e) { console.log(e);}
    

}

main();