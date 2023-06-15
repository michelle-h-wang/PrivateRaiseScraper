// index.js
const request = require("request-promise");
const fs = require("fs");
const cheerio = require("cheerio");

const URL = "https://reactnativetutorial.net/css-selectors/"

async function main() {
    const html = await request.get(URL);
    fs.writeFileSync("./test.html", html);
}

main();