const { default: weaviate } = require('weaviate-ts-client');
const fs = require("fs");
const chalk = require("chalk");

const log = (a) => {console.log(chalk.blueBright(a));}
const redlog = (a) => {console.log(chalk.redBright(a));}

async function run() {

    log("Creating client");
    const client = weaviate.client({
        scheme: 'http',
        host: 'localhost:8080',  // Replace with your endpoint
    });

    log("Checking if schema has already been created");
    const schemaRes = await client.schema.getter().do();

    if(schemaRes.classes.some((_class) => _class.class === "Image")) {
        redlog("Schema already added. Clearing!");
        await client.schema.classDeleter().withClassName("Image").do();
        // return;
    }

    log("Adding Schema");
    const schemaConfig = {
        'class': 'Image',
        'vectorizer': 'multi2vec-clip',
        'vectorIndexType': 'hnsw',
        'moduleConfig': {
            'multi2vec-clip': {
                'imageFields': [
                    'image'
                ]
            }
        },
        'properties': [
            {
                'name': 'image',
                'dataType': ['blob']
            },
            {
                'name': 'type',
                'dataType': ['string']
            },
            {
                'name': 'origin_url',
                'dataType': ['string']
            },
            {
                'name': 'image_url',
                'dataType': ['string']
            }
        ]
    };

    await client.schema
        .classCreator()
        .withClass(schemaConfig)
        .do();
    
    console.log(chalk.greenBright(chalk.bold("Successfully added schema \""+schemaConfig.class+"\"")));
}

run();
