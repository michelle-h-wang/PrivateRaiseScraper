const request = require("request-promise"); //load web sites
const fs = require("fs");
const cheerio = require("cheerio"); //get query request

const URL = "https://www.privateraise.com/pipe/search/equity.php?placementid=44042&tab=all"

async function main() {
    /*
    try {
        //login request
        const result = await request.post("https://www.privateraise.com", {
            headers: {
                Cookie: "PHPSESSID=bn8lih5uei5km309o4qaptt2u2; _gid=GA1.2.1748114180.1686833469; _gat_UA-28611039-1=1; _ga_J4DE7RRCMZ=GS1.1.1686838677.2.1.1686839140.0.0.0; _ga=GA1.1.1025518932.1686833468"
            },
            simple: true,
            followAllRedirects: true,
            jar: true
        })
        //write to data.html file
        fs.writeFileSync("./login.html", result);
    } catch (error) {
        console.error(error);
    }
    */


    // load web addr
    try {
        const html = await request.get(URL, {
            headers: {
                Cookie: "PHPSESSID=bn8lih5uei5km309o4qaptt2u2; _gid=GA1.2.1748114180.1686833469; _gat_UA-28611039-1=1; _ga_J4DE7RRCMZ=GS1.1.1686838677.2.1.1686839140.0.0.0; _ga=GA1.1.1025518932.1686833468"
            },
            simple: true,
            followAllRedirects: true,
            jar: true
        })
        //write to file
        //fs.writeFileSync("./info.html", html);
        //load data from webpage
        const $ = cheerio.load(html);

        //const items = {'Committment Period': null, 'Draw Down': null, 'Commitment Fee': null, 'Purchase Price': []}
        const items = {};
        let tbl = '';
        $("#content-div > div.widget-body > div.profile-view > div.tab-body > table").each((index, element) => {
            // switch ($(element).text()) {
            //     case "Committment Period:":
            //         items['Committment Period'] = index+1;
            //     case "Draw Down:":
            //         items['Draw Down'] = index + 1;
            //     case "Commitment Fee:":
            //         items['Commitment Fee'] = index+1;
            //     case "Fixed Purchase Price:":
            //         items['Fixed Purchase Price'] = index+1;
            //     case "Reset Purchase/Conversion Price:":
            //         items['Reset Purchase Price'] = index+1;
            //     case "Variable Purchase/Conversion Price:":
            //         items['Variable Purchase Price'] = index + 1;
            // } 
            //console.log('index:', index, 'text: ', $(element).text(), 'tbody: ', $(element).find('tbody'));
            
            tbl = tbl + '\n index:'+ index+ '\n text: '+ $(element).text()+ ' \n tbody: ' + $(element).find('tbody');
            
        }); 
        fs.writeFileSync('./info.html', tbl);
    } catch (error) {
        console.error(error)
    }

    
}

main();
