const express = require("express");
const fs = require('fs');
const asyncHandler = require("express-async-handler");
const main = require('./index.js');
const prompt=require("prompt-sync")({sigint:true});


const PORT = 8080;
const app = express();

app.get("/", asyncHandler(async (req, res) => {
    const url = prompt("enter url: ");
    await main.main(url);
    res.type('json')
    .sendFile(__dirname + "/info.html");
}))

app.listen(PORT, (req, res) => {
    console.log('server is now listening at ', PORT);
});
