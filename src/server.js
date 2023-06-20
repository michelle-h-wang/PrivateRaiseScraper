const express = require("express");
const fs = require('fs');
const main = require('./index.js');
const prompt=require("prompt-sync")({sigint:true});


const PORT = 8080;
const app = express();

app.get("/", (req, res) => {
    const url = prompt("enter URL: ");
    main.main(url).then(() => {
        res.sendFile(__dirname + "/info.html");
    });
});

app.listen(PORT, (req, res) => {
    console.log('server is now listening at ', PORT);
});
