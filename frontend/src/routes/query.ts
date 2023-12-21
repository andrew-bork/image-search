
export type Image = {
    url: string,
    thumbnails: [string],
}

type Images = [Image];

// export type LoopedQuery = {
//     _query: () => Promise<{images: Images, nextOffset: number, }>,
//     current: Promise<{images: Images}>,
//     offset: number,
    
//     query: () => Promise<{images: Images}>,

// }

export class LoopedQuery {
    _query: (offset:number) => Promise<{images: Images, nextOffset: number, }>;
    offset: number;
    current: Promise<any> | null;

    constructor(_query: (offset:number) => Promise<{images: Images, nextOffset: number, }>) {
        this._query = _query;
        this.offset = 0;
        this.current = null;
    }

    query() {
        return this._query(this.offset)
            .then((result) => {

                this.offset = result.nextOffset
                return result.images;
            })
    }
}



export const Images = {
    text: {
        query(query:string, offset:number, limit:number, certainty:number) : Promise<{images: Images, nextOffset: number, elapsed: number }> {
            return fetch(`/api/query-text?query=${query}&offset=${offset}&limit=${limit}&certainty=${certainty}`)
            .then((res) => {
                if(res.status !== 200) throw res.statusText;
                return res.json();
            }).then((res) => {
                console.log("Query took", res.elapsed);
                return res;
            });
        }
    },
    image: {
        query(id:string, offset:number, limit:number, certainty:number) : Promise<{images: Images, nextOffset: number, elapsed: number }>{
            return fetch(`/api/query-image?id=${id}&offset=${offset}&limit=${limit}&certainty=${certainty}`)
            .then((res) => {
                if(res.status !== 200) throw res.statusText;
                return res.json();
            }).then((res) => {
                console.log("Query took", res.elapsed);
                return res;
            });
        },
    }
}