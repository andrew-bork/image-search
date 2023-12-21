import { writable } from "svelte/store";
import type { LoopedQuery } from "./query";
import type { Image } from "./query";



function createImagesStore() {

    type ImageStore = {
        images: Array<Image>,
        loopedQuery: LoopedQuery|null
    };


    const bruh : ImageStore = {
        images: [],
        loopedQuery: null,
    }

    const store = writable(bruh);
    const { subscribe, set, update } = store;

    return {
        subscribe,
        setLoopedQuery(newLoopedQuery : LoopedQuery) : Promise<void> {
            return new Promise(
                (res, rej) => {
                    update((a) => {
                        a.loopedQuery = newLoopedQuery;
                        
                        a.loopedQuery.query()
                            .then((images) => {
                                res();
                                update((a) => {
                                    a.images = images;
                                    return a;
                                });
                            });
                        return a;
                    });
                });

        },

        query() {

            update((a) => {
                if(a.loopedQuery) {
                    a.loopedQuery.query()
                        .then((images) => {
                            update((a) => {
                                a.images = images;
                                return a;
                            });
                        });
                }
                return a;
            });
        }
    }
}

export const LoadedImages = createImagesStore();