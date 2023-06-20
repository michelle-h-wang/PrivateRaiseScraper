const request = require("request-promise").defaults({jar: true }); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request
const puppeteer = require("puppeteer");
const { type } = require("os");
const prompt=require("prompt-sync")({sigint:true});

const PR = "https://www.privateraise.com";
const username = 'bcoyne@arenaco.com';
const password = 'Arena2022';

class CompanyInformation {
    result={};
    html;
    $;
    SecClass;

    constructor(html, $) {
        this.html = html;
        this.$ = $;
        // console.log('1', typeof this.$);
    }

    static async getURL(url) {
        async function tryLogin(page) {
            await page.type("input#username", username);
            await page.type("input#password", password);
            await page.click("input#login-button");
        }
        try {
            // login using puppeteer
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            await page.goto(PR);
    
            await tryLogin(page);
            
            if (page.url() === "https://www.privateraise.com/index.php") {
                await tryLogin(page);
            }
    
            // load web addr
            await page.goto(url); 
            const html = await page.content();
            //load data from webpage
            const $ = cheerio.load(html);

            return new CompanyInformation(html, $);
        } catch (e) {
            throw new Error("invalid address, could not parse");
        }
    }

    parseInvestor() {
        this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").each((index, element) => {
            // get 'Investor' data
            const tbl = this.$(element).find('tbody').find('tr');
            for (const elm of tbl.find('th')) {
                this.$(elm).each((ind, e) => {
                    if (this.$(e).text().includes('Investment') && this.$(e).text().includes('Manager')) {
                        // console.log(ind,$(e).text());
                        tbl.next().find('td').each((i,e) => {
                            if (i=== ind) {
                                
                                this.result['Investor'] = this.$(e).text()
                            };
                        });
                    }
                })
            }
        });
    }

    getSecurityClass() {
        const tbl = this.$("#profile-contact > table > tbody > tr > td > table > tbody > tr > td");
        for (const elm of tbl) {
            if (this.$(elm).find("b").text().includes("Security Type")) {
                const security = this.$(elm).next().find("b").text();
                if (security.includes("Equity Line")) {
                    this.SecClass = new EquityLine(this.html, this.$);
                    break
                } else if (security.includes("Convertible") && security.includes("Debt")) {
                    this.SecClass = new ConvertibleNote(this.html, this.$);
                    break
                }
            }
        }
        return this.SecClass;
    }
    getResult() {
        this.result = this.getSecurityClass().parseInfo();
        this.parseInvestor();
        return this.result;
    }

}

class EquityLine extends CompanyInformation {
    constructor(html, $) {
        super(html, $);
        // console.log('2', typeof this.$);
    }
    getClass() {
        return "Equity Line";
    }

    parseInfo() {
        function getItem(elm) {
            return elm.next().text();
        }
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
            for (const elm of obj) {
                const txt = this.$(elm).text()
                if (txt.includes('Commit') && txt.includes('Period')) {
                    const fullText = getItem(this.$(elm));
                    this.result['Commitment Period'] = fullText.split(';')[0];
                } else if (txt.includes('Commit') && txt.includes('Fee')) {
                    const fullText = getItem(this.$(elm));
                    this.result['Commitment Fee'] = fullText.split(';')[0];
                } else if (txt === 'Draw Down:') {
                    const fullText = getItem(this.$(elm));
                    this.result['Draw Down'] = fullText.split('[ Limitations ]')[1].replaceAll('\n', '');
                } else if (txt.includes('Purchase') && txt.includes('Price:')) {
                    const fullText = getItem(this.$(elm));
                    if (fullText !== 'None') {
                        this.result['Purchase Price'] = fullText.split('**')[0].replaceAll('\n', '');
                    }
                } else if (txt.includes('Investor') && txt.includes('Legal') && txt.includes('Counsel')) {
                    const fullText = getItem(this.$(elm));
                    this.result['Investor Legal Counsel'] = fullText;
                }
            }
        return this.result;
    }
    
}


class ConvertibleNote extends CompanyInformation {
    constructor(html, $) {
        super(html, $);
        // console.log('3', typeof this.$);
    }
    getClass() {
        return "Convertible Note";
    }
    parseInfo() {
        function getItem(elm) {
            return elm.next().text();
        }
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
            for (const elm of obj) {
                const txt = this.$(elm).text()
                if (txt.includes('Term:')) {
                    this.result['Term'] = getItem(this.$(elm));

                } else if (txt.includes('Price') && txt.includes('Per Security')) {
                    this.result['Price Per Security'] = getItem(this.$(elm));

                } else if (txt === 'Coupon:') {
                    this.result['Coupon'] = getItem(this.$(elm));

                } else if (txt === "Maturity:") {
                    this.result['Maturity'] = getItem(this.$(elm));

                } else if (txt.includes('Conversion Price:')) {
                    const fullText = getItem(this.$(elm));
                    if (fullText !== 'None') {
                        this.result['Purchase Price'] = fullText.split('**')[0].replaceAll('\n', '');
                    }
                    
                } else if (txt.includes('Investor') && txt.includes('Legal') && txt.includes('Counsel')) {
                    const fullText = getItem(this.$(elm));
                    this.result['Investor Legal Counsel'] = fullText;
                    //console.log($(elm).text(),result['Investor Legal Counsel']);
                }
            }
        return this.result;
    }
}

// async function main() {
//     // const URL = prompt("enter URL: ");
//     // const ci = await CompanyInformation.getURL(URL);
//     // return ci.getResult();
//     return CompanyInformation;
// }

// main();
exports.companyInformation = (url) => CompanyInformation.getURL(url);