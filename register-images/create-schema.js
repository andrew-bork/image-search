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

    if(schemaRes.classes.some((_class) => _class.class === "File")) {
        redlog("Schema already added. Clearing!");
        await client.schema.classDeleter().withClassName("File").do();
        // return;
    }

    log("Adding Schema");
    const schemaConfig = {
        'class': 'File',
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
                'name': 'url',
                'dataType': ['text']
            },
            {
                'name': 'uuid',
                'dataType': ['uuid']
            },
            {
                'name': 'thumbnails',
                'dataType': ['text[]']
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
