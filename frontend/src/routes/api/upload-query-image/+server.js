import { error, json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST(request) {
    // const url = request.url;
    const timeStart = process.hrtime.bigint();

    const parsed = await request.request.json();

    if(typeof(parsed) !== "string") throw error(400, "JSON sent was not a string");

    // console.log(result);
    
    const result = await fetch("http://localhost:7878/upload/query/temporary", {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: "POST",
        body: JSON.stringify({ image_data: parsed}),
    }).then((res) => {
        if(res.status !== 200) throw res.statusText;
        return res.json();
    });

    if(!result.success) throw error(400, "Something went wrong");

    const elapsed = Number(process.hrtime.bigint() - timeStart) / 1000000;
    const returned = {
        elapsed,
        id: result.id
        // next_offset: limit + offset,
    };
    return json(returned);
}