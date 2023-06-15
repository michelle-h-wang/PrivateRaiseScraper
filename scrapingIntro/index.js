const request = require("request-promise"); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request
const { table } = require("console");

//const URL = "https://reactnativetutorial.net/css-selectors/"
const URL = "https://reactnativetutorial.net/css-selectors/lesson2.html"

async function main() {
    //load URL
    const html = await request.get(URL);
    fs.writeFileSync("./test.html", html);
    // actually pull html data through cheerio, format like jquery request in chrome console
    const $ = await cheerio.load(html);
    //const theText = $("h1").text(); <-- single element
    // multiple element scrape by html tag:
    const theText = $("h2").each((index, element) => {
        console.log($(element).text());
    })
    const theText2 = $("#red").text() //select by CSS id using '#' (only get 1st elm w this id bc theoretically should be unique)
    const theText3 = $(".red").text() // select by CSS classes -> multiple elements
    const theText4 =  $('[data-customer = "22293"]') //select by HTML attribute value
    const theText5 = $('[data-customer]') //select by all html sec with this HTML attribute 

    //****************************************************************************** */
    //pull elements in table cells
    const result = await request.get("https://codingwithstefan.com/table-example");
    const $$ = cheerio.load(result)
    //$$("body > table > tbody > tr > td").each((index, element) => {console.log($$(element).text());});
    // get only 1st column of each row of table -- v1
    const scrapedRows = []
    $$("body>table>tbody>tr").each((index, element) => {
        if (index === 0) return true;
        const tds = $$(element).find("td"); 
        const company = $$(tds[0]).text(); 
        const contact = $$(tds[1]).text();
        const country = $$(tds[2]).text();
        const scrapedRow = {company, contact, country};
        scrapedRows.push(scrapedRow);
        
    });
    console.log(scrapedRows);
    //v2 - declare table headers first
    const tableHeaders = [];
    $$("body>table>tbody> tr").each((index, element)=> {
        if (index===0) {
            const ths = $$(element).find("th");
            ths.each((index, element) => {
                tableHeaders.push(
                    $$(element).text().toLowerCase() //pushing each table header onto array (lowercase for naming convention)
                );
            });
            return true;
        };
        const tds = $$(element).find("td");
        const tableRow = {};
        tds.each((index, element) => {
            tableRow[tableHeaders[index]] = $$(element).text();
        });
        scrapedRows.push(tableRow);

    })
    console.log(scrapedRows);
    
}

main();