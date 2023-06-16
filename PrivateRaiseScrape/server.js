import assert from "assert";
import { Server } from "http";
import express, { Application, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import HttpStatus from "http-status-codes";
import fs from "fs";
import path from "path";


const PORT = 8080;

function main() {
    const server = WebServer.loadFile('./info.html');
    void server.start();
}

export class WebServer {
    #app;
    #server;
    static loadFile(f) {
        const file = fs.readdirSync(f, {
            encoding: "utf-8",
        });
        return new WebServer(file);
    }

    constructor(f) {
        this.file = f;
        this.app = express();
        this.app.use((request, response, next) => {
            response.set("Access-Control-Allow-Origin", "*");
            next();
        });
        this.app.get("/", (req, res) => {
            res.sendFile("./info.html");
        });
        this.app.get("/input", (req, res) => {
            res
                .status(HttpStatus.OK)
                .type('string')
                .send(this.file);
                
        });
    }
    /**
     * 
     * @returns a promise that resolves when server starts listening
     */
    start() {
        return new Promise((resolve) => {
            this.server = this.app.listen(PORT, () => {
                console.log('server now listening at ', PORT);
                resolve();
            });
        })
    }

    stop() {
        this.server.close();
        console.log('server stopped');
    }
}

if (require.main === module) {
    void main();
}