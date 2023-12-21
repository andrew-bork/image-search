const PORT = process.env.PORT ?? 7878;

// const { spawn } = require("child_process");
const express = require("express");
const chalk = require("chalk");
const fs = require("fs");

const { default: weaviate } = require('weaviate-ts-client');
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const log = console.log;

const red = chalk.redBright;
const green = chalk.greenBright;
const blue = chalk.blueBright;
const yellow = chalk.yellowBright;
const bold = chalk.bold;

const app = express();


const THUMBNAIL_DIR = "C:/Users/Andrew/Documents/VSCode/image-search/thumbnails"
const TMP_DIR = "C:/Users/Andrew/Documents/VSCode/image-search/tmp/backend"

// let imageRegisterProcess = null;
// app.use("/api/register/start", (req, res) => {
//     if(imageRegisterProcess) {

//         res.json({ success: false, reason: "Already running" });
//         return;
//     }
    
//     imageRegisterProcess = spawn("node", ["./register-images.js"]);
//     imageRegisterProcess.stdout.on("data", (data) => log(data.toString("ascii")));
//     imageRegisterProcess.stderr.on("data", (data) => log(red(data.toString("utf-8"))));
//     imageRegisterProcess.on("exit", (code) => {
//         log(bold(blue(`Returned with code ${code}`)));
//         imageRegisterProcess = null;
//     });

//     res.json({ success: true });
// });

// app.use("/api/register/interrupt", (req, res) => {
//     if(imageRegisterProcess) {
//         imageRegisterProcess.kill();
//         res.json({ success: true });
//         return;
//     }

//     res.json({ success: false, reason: "Not running" });
// });

// app.use("/api/clear", (req, res) => {
//     // if(fs.existsSync(THUMBNAIL_DIR)) fs.unlinkSync(THUMBNAIL_DIR);
//     // fs.mkdirSync(THUMBNAIL_DIR);
//     spawn("node", ["./create-schema.js"]);
//     res.json({ success: true });
// })


const client = weaviate.client({
    scheme: 'http',
    host: 'localhost:8080',  // Replace with your endpoint
});

function setupTemp() {
    log(yellow("Checking if temp dir exists"));
    if(!fs.existsSync(TMP_DIR)) {
        log(bold(red("temp dir does not exist.")));
        fs.mkdirSync(TMP_DIR, { recursive: true });
        log(green("temp dir created"));
    }else {
        log(green("temp dir exists"));
        log(yellow("clearing temp dir"));
        const files = fs.readdirSync(TMP_DIR);
        files.forEach((file) => {
            fs.unlinkSync(path.join(TMP_DIR, file));
        });
        if(fs.readdirSync(TMP_DIR).length !== 0) { log(red(bold("failed to clear the temp dir"))); throw "failed to clear the temp dir"; }
        log(green("cleared the temp dir"));


    }



}

setupTemp();

const temporary = {

}

// app.use("/upload/query/temporary", bodyParser({limit: '50mb'}));
app.use("/upload/query/temporary", express.json({limit: "50mb"}));
app.use("/upload/query/temporary", (req, res) => {
    // console.log(req.body);
    if(!("image_data" in req.body)) return res.json({ success: false });
    let image_data = req.body.image_data;
    image_data = image_data.replace("data:image/png;base64,","");
    let id = uuidv4();
    let timeout = setTimeout(() => {
        delete temporary[id];
    }, 60 * 60 * 1000 * 10);
    temporary[id] = {
        image_data,
        id,
        timeout,
    };

    log(id);

    res.json({
        success: true,
        id
    });
});

app.use("/temporary/list", (req, res) => {
    res.json(Object.keys(temporary));
})

app.use("/query/image", async (req, res) => {
    
    log(req.query)

    
    const id = req.query["id"];
    if(!id) throw error(400, "Missing search parameter \"id\"");

    let certaintyString = req.query["certainty"];

    let certainty = 0.5;
    if(certaintyString){
        certainty = parseFloat(certaintyString);
        if(isNaN(certainty)) throw error(400, "\"certainty\" is not a number");
        if(certainty < 0 || certainty > 1) throw error(400, "\"certainty\" must be between 0 and 1");
    }
    
    let offsetString = req.query["offset"];

    let offset = 0;
    if(offsetString) {
        offset = parseInt(offsetString);
        if(isNaN(offset)) throw error(400, "\"offset\" is not a number");
        if(offset < 0) throw error(400, "\"offset\" must be >= 0");
    }
    
    let limitString = req.query["limit"];
    let limit = 20;
    
    if(limitString) {
        limit = parseInt(limitString);
        if(isNaN(limit)) throw error(400, "\"limit\" is not a number");
        if(limit <= 0) throw error(400, "\"limit\" must be positive");
    }

    if(!(id in temporary)) res.json({ success: false });
    const b64 = temporary[id].image_data;

    // return;
    const result = await client.graphql.get()
        // .withClassName("Image")
        .withClassName("File")
        // .withFields(["image", "origin_url", "type"])
        // @ts-ignore
        .withFields(["url", "uuid", "thumbnails"])
        .withNearImage({ image: b64, certainty })
        // .withNearText({ concepts: [query], certainty })
        .withLimit(limit)
        .withOffset(offset)
        .do();
    
    res.json(result.data.Get.File);
});


app.use("/thumbnails", express.static(THUMBNAIL_DIR));

app.use("/", (req, res) => {
    res.json({ready: true});
})

app.listen(PORT, () => {
    log(bold(green(`Server up at http://localhost:${PORT}`)));
});