const express = require("express");
const request= require("request-promise");
const cheerio = require("cheerio");
const fs = require('fs');
const asyncHandler = require("express-async-handler");
const Main = require('./index.js');
const prompt=require("prompt-sync")({sigint:true});


const PORT = 8080;
const app = express();

app.get("/", asyncHandler(async (req, res) => {
    
    // res.sendFile(__dirname + "/server.html");
    // const html = fs.readFileSync("src/server.html");
    // const html = await request.get("src/server.html");
    // const $  = cheerio.load(html);
    // var url = new Promise($("#responseBox").attr('input-url'));
    // url = $("#responseBox").attr('input-url');

    // console.log("attr", url);

    const url = prompt("enter url: ");
    // console.log(url, Main.main(url));
    const result = await Main.main(url);
    res.type('json')
    .sendFile(__dirname + "/info.html");
    
}))

app.listen(PORT, (req, res) => {
    console.log('server is now listening at ', PORT);
});
