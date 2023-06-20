const request = require("request-promise").defaults({jar: true }); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request
const puppeteer = require("puppeteer");
const { type } = require("os");
const prompt=require("prompt-sync")({sigint:true});

const URL = prompt("enter URL: ");
const PR = "https://www.privateraise.com";
//const URL = "https://www.privateraise.com/pipe/search/equity.php?placementid=43527&RA=1&SID=bn8lih5uei5km309o4qaptt2u2";
const username = 'bcoyne@arenaco.com';
const password = 'Arena2022';


/**
 * inputs login credentials to the given page
 * @param {*} page browser page to run on
 */
async function tryLogin(page) {
    await page.type("input#username", username);
    await page.type("input#password", password);
    await page.click("input#login-button");
}

/**
 * 
 * @returns scraped information given URL
 */
async function companyInformation() {
    try {
        // login using puppeteer
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.goto(PR);

        await tryLogin(page);
        
        if (page.url() === "https://www.privateraise.com/index.php") {
            await tryLogin(page);
        }
        
        //await page.waitForNavigation();

        // load web addr
        await page.goto(URL); 
        const html = await page.content();
        //load data from webpage
        const $ = cheerio.load(html);
        // initiate object to hold data
        const result = {};

        $("#content-div > div.widget-body > div.profile-view > div.tab-body > table").each((index, element) => {
            // get 'Investor' data
            const tbl = $(element).find('tbody').find('tr');
            for (const elm of tbl.find('th')) {
                $(elm).each((ind, e) => {
                    if ($(e).text().includes('Investment') && $(e).text().includes('Manager')) {
                        // console.log(ind,$(e).text());
                        tbl.next().find('td').each((i,e) => {
                            if (i=== ind) result["Investor"] = $(e).text();
                        });
                    }
                })
            }
            // get all other data
            const obj = $(element).find('tbody').find('tr').find('td');
            for (const elm of obj) {
                if ($(elm).text().includes('Commit') && $(elm).text().includes('Period')) {
                    const fullText = $(elm).next().text();
                    result['Commitment Period'] = fullText.split(';')[0];
                } else if ($(elm).text().includes('Commit') && $(elm).text().includes('Fee')) {
                    const fullText = $(elm).next().text();
                    result['Commitment Fee'] = fullText.split(';')[0];
                } else if ($(elm).text() === 'Draw Down:') {
                    const fullText = $(elm).next().text();
                    result['Draw Down'] = fullText.split('[ Limitations ]')[1].replaceAll('\n', '');
                } else if ($(elm).text().includes('Purchase') && $(elm).text().includes('Price:')) {
                    const fullText = $(elm).next().text();
                    if (fullText !== 'None') {
                        result['Purchase Price'] = fullText.split('**')[0].replaceAll('\n', '');
                        //console.log($(elm).text(),result['Purchase Price']);
                    }
                } else if ($(elm).text().includes('Investor') && $(elm).text().includes('Legal') && $(elm).text().includes('Counsel')) {
                    const fullText = $(elm).next().text();
                    result['Investor Legal Counsel'] = fullText;
                    //console.log($(elm).text(),result['Investor Legal Counsel']);
                } else if ($(elm).text().includes('Investor') && $(elm).text().includes('Legal') && $(elm).text().includes('Counsel')) {
                    const fullText = $(elm).next().text();
                    result['Investor Legal Counsel'] = fullText;
                    //console.log($(elm).text(),result['Investor Legal Counsel']);
                } 
            }
        }); 
        console.log(result);
        return result;
    } catch (error) {
        console.error(error)
    }
}
companyInformation();



