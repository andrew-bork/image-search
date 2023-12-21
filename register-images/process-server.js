const PORT = 7878;

const { spawn } = require("child_process");
const express = require("express");
const chalk = require("chalk");
const fs = require("fs");

const log = console.log;

const red = chalk.redBright;
const green = chalk.greenBright;
const blue = chalk.blueBright;
const yellow = chalk.yellowBright;
const bold = chalk.bold;

const app = express();


const THUMBNAIL_DIR = "C:/Users/Andrew/Documents/VSCode/image-search/thumbnails"

let imageRegisterProcess = null;
app.use("/api/register/start", (req, res) => {
    if(imageRegisterProcess) {

        res.json({ success: false, reason: "Already running" });
        return;
    }
    
    imageRegisterProcess = spawn("node", ["./register-images.js"]);
    imageRegisterProcess.stdout.on("data", (data) => log(data.toString("ascii")));
    imageRegisterProcess.stderr.on("data", (data) => log(red(data.toString("utf-8"))));
    imageRegisterProcess.on("exit", (code) => {
        log(bold(blue(`Returned with code ${code}`)));
        imageRegisterProcess = null;
    });

    res.json({ success: true });
});

app.use("/api/register/interrupt", (req, res) => {
    if(imageRegisterProcess) {
        imageRegisterProcess.kill();
        res.json({ success: true });
        return;
    }

    res.json({ success: false, reason: "Not running" });
});

app.use("/api/clear", (req, res) => {
    // if(fs.existsSync(THUMBNAIL_DIR)) fs.unlinkSync(THUMBNAIL_DIR);
    // fs.mkdirSync(THUMBNAIL_DIR);
    spawn("node", ["./create-schema.js"]);
    res.json({ success: true });
})

app.use("/thumbnails", express.static(THUMBNAIL_DIR));


app.listen(PORT, () => {
    log(bold(green(`Server up at http://localhost:${PORT}`)));
});