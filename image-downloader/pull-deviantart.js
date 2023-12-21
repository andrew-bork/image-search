const sharp = require("sharp");
const path = require("path");

const https = require("https");


const fs = require("fs");
const chalk = require("chalk");

const { default: weaviate } = require('weaviate-ts-client');
const { CLIENT_ID, CLIENT_SECRET } = require("./secret");

// const log = (a) => {console.log(chalk.blueBright(a));}
const log = console.log;
const redlog = (a) => {console.log(chalk.redBright(a));}
const greenlog = (a) => {console.log(chalk.greenBright(a));}


const red = chalk.redBright;
const green = chalk.greenBright;
const blue = chalk.blueBright;
const yellow = chalk.yellowBright;
const bold = chalk.bold;

// const orange = chalk.;

import("node-fetch").then(

(fetch) => {
    fetch = fetch.default;

    // fetch("https://google.com").then(console.log());

    function authenticate() {
        return fetch(`https://www.deviantart.com/oauth2/token?grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`)
            .then((res) => {
                if(res.status !== 200) throw res.statusText;
                return res.json();
            }).then((res) => {
                if(res.status !== "success") throw res;
                return res;
            });
    }

    function popular(access_token, q, offset, limit) {

        function add_if_not_null(name, val) {
            return (val ? `&${name}=${encodeURIComponent(val)}` : "");
        } 
        let url = `https://www.deviantart.com/api/v1/oauth2/browse/popular?access_token=${access_token}&mature_content=true${add_if_not_null("q", q)}${add_if_not_null("offset", offset)}${add_if_not_null("limit", limit)}`;
        // console.log(url);
        return fetch(url)
            .then((res) => {
                // console.log(res);
                if(res.status !== 200) throw res.statusText;
                return res.json();
            }).then((res) => {
                if(res.error_code) throw res.error_code;
                return res;
            });
    }

    
    function tags(access_token, tag, offset, limit) {

        function add_if_not_null(name, val) {
            return (val ? `&${name}=${encodeURIComponent(val)}` : "");
        } 
        let url = `https://www.deviantart.com/api/v1/oauth2/browse/tags?access_token=${access_token}&mature_content=true${add_if_not_null("tag", tag)}${add_if_not_null("offset", offset)}${add_if_not_null("limit", limit)}`;
        // console.log(url);
        return fetch(url)
            .then((res) => {
                // console.log(res);
                if(res.status !== 200) throw res.statusText;
                return res.json();
            }).then((res) => {
                if(res.error_code) throw res.error_code;
                return res;
            });
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
        log(yellow("Authenticating ..."));
        const { expires_in, status, access_token, token_type } = await authenticate();
        log(green("Authenticated!"));

        async function get_images(tag, number) {

            let offset = 0;
            const images = [];
            while(images.length < number) {
                const result = await tags(access_token, tag, offset, 50);

                result.results.forEach(
                    (deviation) => {
                        if(deviation.content){
                            // greenlog(deviation.content.src);
                            images.push({
                                id: deviation.deviationid,
                                url: deviation.content.src,
                                origin: deviation.url,
                            });
                        }
                    }
                )
    
                offset = result.next_offset;
                
                log(yellow(`Gathered ${images.length}/${number} (${Math.round(100 * images.length / number)}%)`));
                log("\x1b[2A");
            }

            return images;
        }

        function download(url) {
            return new Promise(
                (resolve, rej) => {
                    https.get(url, (res) => {
                        const converter = sharp()
                            .png();
                        const pipe = res
                            .pipe(converter)
                            // .pipe(fs.createWriteStream("tmp/a.png"));
                        const bufs = [];
                        pipe.on("data", (dat) => {
                            bufs.push(dat);
                        })
                            // .pipe(fs.createWriteStream(filename));
                        pipe.on("close", () => {
                            resolve(Buffer.concat(bufs));
                            // resolve();
                        })
                    });
                }
            )
        }


        log(blue("Creating client"));
        const client = weaviate.client({
            scheme: 'http',
            host: 'localhost:8080',  // Replace with your endpoint
        });
        
        async function process_image(image) {
            try {
                // greenlog(image.id);
                const buffer = await download(image.url);
                
                // const buffer = fs.readFileSync("tmp/a.png");
                const b64 = buffer.toString("base64");
                // console.log(b64);
                        
                await client.data.creator()
                    .withClassName('Image')
                    .withProperties({
                        image: b64,
                        type: "deviantart",
                        origin_url: image.origin

                    })
                    .do();
            }catch(e) {
                log(red(bold(image.id)));
            }
        }

        let start = process.hrtime.bigint();
        let average_elapsed = 0;
        let chunk = 0;

        let status_every = 20;

        for(let i = 0; i < images.length; i ++) {
            await process_image(images[i]);
            
            if(i % status_every === status_every - 1) {
                let elapsed = (Number(process.hrtime.bigint() - start) / 1000000000) / status_every;
                average_elapsed = (chunk * average_elapsed + elapsed) / (chunk + 1);
                chunk++;


                
                console.log(green(`Average time per image for last ${status_every}: ${timeFormatter(elapsed.toFixed(1))}.                                                `));
                console.log(green(`Average time per image: ${timeFormatter(average_elapsed.toFixed(1))}.                                                    `));
                console.log(yellow(`ETA: ${timeFormatter((average_elapsed * (images.length - i - 1)).toFixed(1))}                                           `));
                console.log("\x1b[5A");
            }
        }

    }


    run();
});
