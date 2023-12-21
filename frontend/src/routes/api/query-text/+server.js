import { error, json } from '@sveltejs/kit';
import weaviate from "weaviate-ts-client";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const timeStart = process.hrtime.bigint();

    const query = url.searchParams.get("query");
    if(!query) throw error(400, "Missing search parameter \"query\"");

    let certaintyString = url.searchParams.get("certainty");

    let certainty = 0.5;
    if(certaintyString){
        certainty = parseFloat(certaintyString);
        if(isNaN(certainty)) throw error(400, "\"certainty\" is not a number");
        if(certainty < 0 || certainty > 1) throw error(400, "\"certainty\" must be between 0 and 1");
    }
    
    let offsetString = url.searchParams.get("offset");

    let offset = 0;
    if(offsetString) {
        offset = parseInt(offsetString);
        if(isNaN(offset)) throw error(400, "\"offset\" is not a number");
        if(offset < 0) throw error(400, "\"offset\" must be >= 0");
    }
    
    let limitString = url.searchParams.get("limit");
    let limit = 20;
    
    if(limitString) {
        limit = parseInt(limitString);
        if(isNaN(limit)) throw error(400, "\"limit\" is not a number");
        if(limit <= 0) throw error(400, "\"limit\" must be positive");
    }


    const client = weaviate.client({
        scheme: 'http',
        host: 'localhost:8080',  // Replace with your endpoint
    });

    const result = await client.graphql.get()
        // .withClassName("Image")
        .withClassName("File")
        // .withFields(["image", "origin_url", "type"])
        // @ts-ignore
        .withFields(["url", "uuid", "thumbnails"])
        // .withNearImage({ image: b64 })
        .withNearText({ concepts: [query], certainty })
        .withLimit(limit)
        .withOffset(offset)
        .do();    
    // console.log(result);
    
    const elapsed = Number(process.hrtime.bigint() - timeStart) / 1000000;
    const returned = {
        images: result.data.Get.File,
        elapsed,
        next_offset: limit + offset,
    };
    return json(returned);
}