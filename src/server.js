const express = require("express");
const request= require("request-promise");
const cheerio = require("cheerio");
const fs = require('fs');
const asyncHandler = require("express-async-handler");
const Main = require('./index.js');
const prompt=require("prompt-sync")({sigint:true});


const PORT = 8080;
const app = express();

let result;

app.get("/", asyncHandler(async (req, res) => {
    
    // console.log(result);
    res.type('json')
    .sendFile(__dirname + "/info.html");
    
}))

app.listen(PORT, asyncHandler(async (req, res) => {
    console.log('server is now listening at ', PORT);
    while(true) {
        const url = prompt("enter url: ");
        
        // console.log(url, Main.main(url));
        result = await Main.main(url);
    }

}));

