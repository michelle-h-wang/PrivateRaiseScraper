const request = require("request-promise").defaults({jar: true }); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request
const puppeteer = require("puppeteer");
const { type } = require("os");
const prompt=require("prompt-sync")({sigint:true});

const PR = "https://www.privateraise.com";
const username = 'bcoyne@arenaco.com';
const password = 'Arena2022';

/**
 * CompanyInformation takes url as argument in static factory method 'getURL' and returns mapping of information values in 'getResult'
 */
class CompanyInformation {
    result={};
    html;
    $;
    SecClass;

    /**
     * 
     * @param {*} html request parse of url
     * @param {*} $ cheerio object load of html (function)
     */
    constructor(html, $) {
        this.html = html;
        this.$ = $;
        // console.log('1', typeof this.$);
    }

    /**
     * 
     * @param {*} url string
     * @returns new CompanyInformation object initialized with html parse and cheerio parse
     */
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

    /**
     * Fetches the 'Investor' information from the site, sets the value in the map
     */
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

    /**
     *
     * @returns mapping of information
     */
    getResult() {
        const tbl = this.$("#profile-contact > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td");
        console.log(tbl.text());
        for (const elm of tbl) {
            console.log(this.$(elm).text());
            if (this.$(elm).find("b").text().includes("Security Type")) {
                const security = this.$(elm).next().find("b").text();
                if (security.includes("Equity")) {
                    this.SecClass = new EquityLine(this.html, this.$);
                    break
                } else if (security.includes("Convertible") && security.includes("Debt")) {
                    this.SecClass = new ConvertibleNote(this.html, this.$);
                    break
                }
            }
        }
        if (this.SecClass === undefined) {
            throw new Error("undefined security class");
        }

        this.result = this.SecClass.parseInfo();
        this.parseInvestor();
        return this.result;
    }

}

/**
 * Subclass of CompanyInformation for Equity Lines, called by parent
 */
class EquityLine extends CompanyInformation {
    constructor(html, $) {
        super(html, $);
        // console.log('2', typeof this.$);
    }

    getClass() {
        return "Equity Line";
    }

    getStockPrice() {
        function getItem(elm) {
            return elm.next().text();
        }
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table.twocol > tbody > tr > td:nth-child(2) > table > tbody > tr:nth-child(2) > td");
        for (const elm of obj) {
            if (this.$(elm).text().includes("Closing Stock Price")) {
                const t = getItem(this.$(elm)).replaceAll("$", "");
                return parseFloat(t);
            }
        }
    }
    /**
     * 
     * @returns mapping of info specific to this security class
     */
    parseInfo() {
        let commitAmt;
        function getItem(elm) {
            return elm.next().text();
        }
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
        for (const elm of obj) {
            const txt = this.$(elm).text();
            if (txt.includes('Commit') && txt.includes("Amount")) {
                const text = getItem(this.$(elm)).replaceAll("$", "").replaceAll(",", "");
                commitAmt = parseInt(text);
                break;
            } 
        }   
        for (const elm of obj) {
            const txt = this.$(elm).text();
            if (txt.includes('Commit') && txt.includes('Period')) {
                const fullText = getItem(this.$(elm)).toLowerCase();
                const t = ["months", "month", "days", "day","years", "year"];
                for (const val of t) {
                    if (fullText.includes(val)) this.result['Commitment Period'] = fullText.split(val)[0] + ' ' + val;
                    break;
                }
            } else if (txt.includes('Commit') && txt.includes('Fee:')) {
                let fullText = getItem(this.$(elm));
                const stockPrice = this.getStockPrice();
                console.log(stockPrice + "sp ", commitAmt+"ca");
                let fee; 
                let percent; 
                let final;
                if (fullText.includes("$")) {
                    let splitAmt = fullText.split("$")[1];
                    const splitMagn  = splitAmt.split(' ')[1];
                    console.log("mag", splitMagn);
                    splitAmt = splitAmt.replaceAll(",", "");
                    fee = parseFloat(splitAmt);
                    // console.log(fee +"$");

                    percent = parseFloat(fee*(10**6))*100/commitAmt;
                    final = '$' + fee.toLocaleString('en-US', {maximumFractionDigits:2}) + splitMagn + " (" + percent.toFixed(1) + "%)";
                }
                else if (fullText.includes("shares")) {
                    
                    const string = fullText.split("shares")[0];
                    let shares = string.split(" ");
                    shares = shares[shares.length-2].replaceAll(",", "");
                    fee = parseFloat(shares)*stockPrice;
                    percent = fee*100/commitAmt;
                    final = '$' + fee.toLocaleString('en-US', {maximumFractionDigits:2}) + " (" + percent.toFixed(1) + "%)";
                    // console.log(fee + "shares");
                } else {
                    fee = fullText;
                }
                // console.log("percet", percent);
                this.result['Commitment Fee'] = final;
            } else if (txt === 'Draw Down:') {
                const fullText = getItem(this.$(elm));
                this.result['Draw Down'] = fullText.split('[ Limitations ]')[1].replace('\n', '').replaceAll('\n', '\n \t');
            } else if (txt.includes('Purchase') && txt.includes('Price:')) {
                const fullText = getItem(this.$(elm));
                if (fullText.toLowerCase() !== 'none') {
                    this.result[txt] = fullText.split('**')[0].replaceAll('\n', '');
                }
            } else if (txt.includes('Investor') && txt.includes('Legal') && txt.includes('Counsel')) {
                const fullText = getItem(this.$(elm));
                this.result['Investor Legal Counsel'] = fullText;
            }
        }
        return this.result;   
    }
}

/**
 * subclass of CompanyInformation for Convertible Notes, called by parent class.
 */
class ConvertibleNote extends CompanyInformation {
    constructor(html, $) {
        super(html, $);
        // console.log('3', typeof this.$);
    }
    getClass() {
        return "Convertible Note";
    }
    /**
     * 
     * @returns mapping of info specific to this security class
     */
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

exports.companyInformation = (url) => CompanyInformation.getURL(url);