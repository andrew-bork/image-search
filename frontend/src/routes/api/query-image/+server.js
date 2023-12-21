import { error, json } from '@sveltejs/kit';
import weaviate from "weaviate-ts-client";

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
    const timeStart = process.hrtime.bigint();

    const id = url.searchParams.get("id");
    if(!id) throw error(400, "Missing search parameter \"id\"");

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


    const result = await fetch(`http://localhost:7878/query/image?id=${id}&offset=${offset}&limit=${limit}&certainty=${certainty}`)
        .then((res) => {
            if(res.status !== 200) throw res.statusText;
            return res.json();
        });
    // console.log(result);
    
    const elapsed = Number(process.hrtime.bigint() - timeStart) / 1000000000;
    const returned = {
        images: result,
        elapsed,
        next_offset: limit + offset,
    };
    return json(returned);
}