const fs = require("fs");
const { glob } = require("glob");
const { default: weaviate } = require('weaviate-ts-client');
const { spawn } = require("child_process");
const path = require("path");

const { v4: uuidv4 } = require('uuid');

const chalk = require("chalk");

const log = console.log;

const red = chalk.redBright;
const green = chalk.greenBright;
const blue = chalk.blueBright;
const yellow = chalk.yellowBright;
const bold = chalk.bold;
const gray = chalk.gray;

const watched_folders = [
    "C:/Users/Andrew/documents/VScode/webui-api/datasets"
];

const THUMBNAIL_DIR = "C:/Users/Andrew/Documents/VSCode/image-search/thumbnails"
const LAST_RUN_FILE = "tmp/.session";

async function load_last_run() {
    log(yellow("Loading last run file \""+LAST_RUN_FILE+"\""));
    if(!fs.existsSync(LAST_RUN_FILE)) {
        log(red(`Last run not found.`));
        return [];
    }
    return (await fs.promises.readFile(LAST_RUN_FILE)).toString("utf-8").split("\n").sort();
}

function compute_diff_of_sorted_array_of_unique_values(arr1 = [], arr2 = []) {
    const diff1 = [];
    const diff2 = [];
    const inter = [];

    let i = 0, j = 0;
    while(i < arr1.length && j < arr2.length) {
        if(arr1[i] === arr2[j]) {
            i++;
            j++;
            inter.push(arr1[i]);
        }else if(arr1[i] < arr2[j]) {
            diff1.push(arr1[i]);
            i++;
        }else {
            diff2.push(arr2[j]);
            j++;
        }
    }

    diff1.push(...arr1.slice(i));
    diff2.push(...arr2.slice(i));

    return [
        diff1,
        diff2,
        inter,
    ];
}



function chunk(array = [], n = 100) {
    const chunks = [];

    while(array.length > 0) {
        chunks.push(array.slice(0, n));
        array = array.slice(n);
    }

    return chunks;
}

function timeFormatter(s) {
    
    let seconds = s % 60;
    s -= seconds;
    let minute = s / 60;

    if(minute == 1) {
        return "a minute";
    }else if(minute > 0) {
        return `${minute} minutes`;
    }else{
        return `${seconds} seconds`;
    }
}

async function run() {


    log("Creating client");
    const client = weaviate.client({
        scheme: 'http',
        host: 'localhost:8080',  // Replace with your endpoint
    });
    
    let already_added = await client.data.getter()
        .withClassName("File")
        .withLimit(1000)
        .do();

    already_added = already_added.objects.map((obj) => obj.properties.url).sort();

    // console.log(already_added);
    // return;

    const last_run = already_added; //await load_last_run();

    const files = (await glob(watched_folders[0] + "/**/*.png", 
        {
            ignore: []
        }
    )).sort();
    
    const [ removed, added, finished ] = compute_diff_of_sorted_array_of_unique_values(last_run, files);
    
        
    function clean_up() {
        fs.writeFile(LAST_RUN_FILE, finished.sort().join("\n"), () => {
            log(green("Saved session: finished",finished.length,"files"));
        });
    }
    
    process.on("SIGTERM", () => {
        clean_up();
        process.exit();
    });

    log(blue(last_run.length), blue(files.length));
    log(red(removed.length+" removed"), green(added.length + " added"), gray(finished.length + " already processed"));

    const chunks = chunk(added, 25);

    async function process_image(image_path) {
        try {
            const buf = await fs.promises.readFile(image_path);
            const b64 = Buffer.from(buf).toString("base64");
            const id = uuidv4();
            const dir = path.join(THUMBNAIL_DIR, id);
            if(!fs.existsSync(dir))
                await fs.promises.mkdir(dir);

            const thumbnails = await Promise.all(["200x", "x200", "100x", "x100", "50x", "x50"].map(
                async (size) => {
                    await new Promise(
                        (res, rej) => {

                            const a = spawn("gm", [
                                "convert",
                                image_path,
                                "-geometry",
                                size,
                                path.join(dir, size+".png")
                            ]);
                            a.stderr.on("data", (data) => {
                                log(red(data.toString("utf-8")));
                            })

                            a.on("exit", res);
                        }
                    );

                    return `http://mathbox:7878/thumbnails/${id}/${size}.png`;
                }
            ))

            await client.data.creator()
                .withClassName('File')
                .withProperties({
                    image: b64,
                    url: image_path,
                    uuid: id,
                    thumbnails: thumbnails,
                })
                .do();
            
            finished.push(image_path);
        }catch(e) {
            console.log(e);
            console.error(red(image_path));
        }
    }

    const n_chunks = Math.min(500, chunks.length);

    for(let i = 0; i < n_chunks; i ++) {
        const current_chunk = chunks[i];

        await Promise.all(
            current_chunk.map(process_image)
        );
        log(yellow(`${i+1}/${n_chunks} finished`));
    }
    
    clean_up();

}

run();
// module.exports = run;