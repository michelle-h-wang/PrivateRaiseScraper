const companyInfo = require("./scraperClass.js");
const prompt=require("prompt-sync")({sigint:true});

// async function main() {
//     while(true) {
//         const url = prompt("enter url: ");
//         const ci = await companyInfo.companyInformation(url);
//         console.log("##############################" + '\n' + ci.getPriceType());
//     }
// }



async function main(urlList) {
    async function getInfo(url) {
        ci = await companyInfo.companyInformation(url);
        type = ci.getPriceType();
        return ci, type;
    }
    // const urlList = prompt("enter url List: ");
    const typeList = [];
    let ci; 
    let type;
    for (const url of urlList) {
        for (let i = 0; i<3; i++) {
            ci,type = await getInfo(url);
            if (type != undefined) break;
        }
        // console.log("##############################" + '\n' + ci.getName() + " :" + type); 
        typeList.push(ci.getName() + ": " + type);
    }
    console.log(typeList);
    return typeList;
}

urlList = ['https://www.privateraise.com/pipe/search/equity.php?placementid=42411' ,'https://www.privateraise.com/pipe/search/equity.php?placementid=39586' ,'https://www.privateraise.com/pipe/search/c_debt.php?placementid=26113' ,'https://www.privateraise.com/pipe/search/equity.php?placementid=17385' ,'https://www.privateraise.com/pipe/search/c_debt.php?placementid=16120' ,];
main(urlList);
