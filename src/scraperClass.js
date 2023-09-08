const request = require("request-promise").defaults({jar: true }); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request
const puppeteer = require("puppeteer");
const { type } = require("os");
const { get } = require("express/lib/response");
const prompt=require("prompt-sync")({sigint:true});

const PR = "https://www.privateraise.com";
const username = prompt("please enter username:")
const password = prompt("please enter password:");


function getItem(elm) {
    return elm.next().text();
}
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

        this.SecClass = this.getSecClass();
        // THROW ERR if class has not be determined
        if (this.SecClass === undefined) {
            throw new Error("undefined security class");
        }

        // CALL function based on class type
        this.result = this.SecClass.parseInfo();
        this.parseInvestor();
        return this.result;
    }

    getSecClass() {
        const tbl = this.$("#profile-contact > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td");
        // FIRST casework based on deal type: ELOC, Convertible Debt
        for (const elm of tbl) {
            // console.log(this.$(elm).text());
            if (this.$(elm).find("b").text().includes("Security Type")) {
                const security = this.$(elm).next().find("b").text();
                if (security.includes("Equity")) {
                    return new EquityLine(this.html, this.$);
                } else if (security.includes("Convertible") && security.includes("Debt")) {
                    return new ConvertibleNote(this.html, this.$);
                } else if (security.includes("Common") && security.includes("Stock")) {
                    return new CommonStock(this.html, this.$);
                } else if (security.includes("Preferred") && security.includes("Convertible")) {
                    return new ConvertibleNote(this.html, this.$);
                } else {
                    return undefined;
                }
            }
        }
    }
    getName() {
        return this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > h3:nth-child(2) > a").text();
    }

    getPriceType() {
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
        for (const elm of obj) {
            const txt = this.$(elm).text()
            if (txt.includes("Price:") && (txt.includes("Conversion") || txt.includes("Purchase"))){
                const fullText = getItem(this.$(elm));
                if (!fullText.includes('None')) {
                    return txt;
                }
            }
        }
    }

}

/**
 * Subclass of CompanyInformation for Equity Lines, called by parent
 */
class EquityLine extends CompanyInformation {
    constructor(html, $) {
        super(html, $);
    }

    getClass() {
        return "Equity Line";
    }

    /**
     * 
     * @returns last closing stock price
     */
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
        this.result['Investor'] = '';
        this.result['Commitment Fee'] = '';
        this.result['Commitment Period'] = '';
        this.result['Draw Down'] = '';
        this.result['Purchase Price'] = '';
        this.result['Investor Legal Counsel']='';
        let commitAmt;
        //Helper Function to get NEXT ITEM 
        function getItem(elm) {
            return elm.next().text();
        }
        //divide HTML page into 'td' elements
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
        for (const elm of obj) {
            const txt = this.$(elm).text();
            //get COMMITMENT AMOUNT
            if (txt.includes('Commit') && txt.includes("Amount")) {
                const text = getItem(this.$(elm)).replaceAll("$", "").replaceAll(",", "");
                commitAmt = parseInt(text);
                break;
            } 
        }   
        for (const elm of obj) {
            const txt = this.$(elm).text();
            //GET COMMITMENT PERIOD
            if (txt.includes('Commit') && txt.includes('Period:')) {
                const fullText = getItem(this.$(elm)).toLowerCase();
                const t = ["months", "month", "days", "day","years", "year"];
                this.result['Commitment Period'] = fullText;
                for (const val of t) {
                    // loop through to check each possible period duration, parses if match
                    if (fullText.includes(val)) {
                        this.result['Commitment Period'] = fullText.split(val)[0] + ' ' + val;
                        break;
                    }
                }
            } else if (txt.includes('Commit') && txt.includes('Fee:')) {
                let fullText = getItem(this.$(elm)).split('\n')[0];
                const stockPrice = this.getStockPrice();
                // console.log(stockPrice + "sp ", commitAmt+"ca");
                let fee; 
                let percent; 
                // IF the explicit $ amount is listed already in the text:
                if (fullText.includes("$")) {
                    let splitAmt = fullText.split("$")[1];
                    // get magnitude listed ex. 'millions'
                    const splitMagn  = splitAmt.split(' ')[1];
                    // console.log("mag", splitMagn);
                    splitAmt = splitAmt.replaceAll(",", ""); //remove ',' to parse number
                    fee = parseFloat(splitAmt);
                    // console.log(fee +"$");

                    percent = parseFloat(fee*(10**6))*100/commitAmt;
                    percent = percent.toFixed(1) + '%';
                    fee = '$'+ fee.toLocaleString('en-US', {maximumFractionDigits:2}) + ' ' + splitMagn;
                }
                //Otherwise fee is listed as SHARES, do calculations to turn into $ amt
                else if (fullText.includes("shares")) {
                    // parse amt of shares
                    const string = fullText.split("shares")[0];
                    let shares = string.split(" ");
                    shares = shares[shares.length-2].replaceAll(",", "");
                    fee = parseFloat(shares)*stockPrice;

                    percent = fee*100/commitAmt;
                    percent = percent.toFixed(1) + '%';
                    fee = '$'+ fee.toLocaleString('en-US', {maximumFractionDigits:2});
                } else {
                    fee = fullText;
                    percent = 'explicit data not found';
                }
                this.result['Commitment Fee'] = fee + " (" + percent + ")";
            } else if (txt === 'Draw Down:') {
                const fullText = getItem(this.$(elm));
                try {
                    this.result['Draw Down'] =fullText.split('[ Limitations ]')[1].replace('\n', '').replaceAll('\n', '\n \t');
                } catch (e) {
                    this.result['Draw Down'] = fullText;
                }
                
            } else if (txt.includes('Purchase') && txt.includes('Price:')) {
                const fullText = getItem(this.$(elm));
                // Loop through each section of purchase price, only display it if it is NOT NONE
                if (!fullText.includes('None')) {
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
        this.result['Investor'] = '';
        this.result['Issuance Amount'] = '';
        this.result['OID'] = '';
        this.result['Term'] = '';
        this.result['Coupon'] = '';
        this.result['Conversion Price'] = '';
        this.result['Hard Floor Price'] = '';
        this.result['Investor Legal Counsel'] ='';

        let face;
        let pps;
        
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
        for (const elm of obj) {
            const txt = this.$(elm).text()
            if (txt.includes('Term:')) {
                this.result['Term'] = getItem(this.$(elm));
            } else if (txt.includes('Issuance Amount:')) {
                this.result['Issuance Amount'] = getItem(this.$(elm));
            } else if (txt === 'Coupon:') {
                this.result['Coupon'] = getItem(this.$(elm));
            } else if (txt.includes('Hard Floor Price:'))  {
                this.result['Hard Floor Price'] = getItem(this.$(elm));
            } else if (txt.includes("Face Amount Per Security") || txt.includes("Price Per Security")) {
                let amt = getItem(this.$(elm));
                amt = amt.replaceAll("$", '');
                amt = amt.replaceAll(",", '');
                if (txt.includes('Face')) face = parseFloat(amt);
                else pps = parseFloat(amt);
            } 
            else if (txt.includes('Conversion Price:')) {
                const fullText = getItem(this.$(elm));
                if (!fullText.includes('None')) {
                    this.result['Conversion Price'] = fullText.split('**')[0].replaceAll('\n', '');
                } 
            } else if (txt.includes('Investor') && txt.includes('Legal') && txt.includes('Counsel')) {
                const fullText = getItem(this.$(elm));
                this.result['Investor Legal Counsel'] = fullText;
                //console.log($(elm).text(),result['Investor Legal Counsel']);
            }
        }
        const oid = (pps/face) *100;
        this.result['OID'] += oid.toFixed(2) + ' %';
        return this.result;
    }
}

class CommonStock extends CompanyInformation {
    constructor(html, $) {
        super(html, $);
    }
    getClass() {
        return "Common Stock";
    }
    /**
     * 
     * @returns mapping of info specific to this security class
     */
    parseInfo() {
        this.result['Investor'] = '';
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
        for (const elm of obj) {
            const txt = this.$(elm).text();
            //GET COMMITMENT PERIOD
            
            if (txt.includes('Purchase') && txt.includes('Price:')) {
                const fullText = getItem(this.$(elm));
                // Loop through each section of purchase price, only display it if it is NOT NONE
                if (!fullText.includes('None')) {
                    this.result[txt] = fullText.split('**')[0].replaceAll('\n', '');
                }
            } 
        }
        return this.result;   
    }
}

class PreferredConvertible extends CompanyInformation {
    constructor(html, $) {
        super(html, $);
    }
    getClass() {
        return "Common Stock";
    }
    /**
     * 
     * @returns mapping of info specific to this security class
     */
    parseInfo() {
        this.result['Investor'] = '';
        const obj = this.$("#content-div > div.widget-body > div.profile-view > div.tab-body > table").find('tbody').find('tr').find('td');
        for (const elm of obj) {
            const txt = this.$(elm).text();
            //GET COMMITMENT PERIOD
            
            if (txt.includes('Purchase') && txt.includes('Price:')) {
                const fullText = getItem(this.$(elm));
                // Loop through each section of purchase price, only display it if it is NOT NONE
                if (!fullText.includes('None')) {
                    this.result[txt] = fullText.split('**')[0].replaceAll('\n', '');
                }
            } 
        }
        return this.result;   
    }
}

exports.companyInformation = (url) => CompanyInformation.getURL(url);
