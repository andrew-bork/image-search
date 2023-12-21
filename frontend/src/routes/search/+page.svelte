<script>
	import { onMount } from "svelte";

    let query;

    onMount(() => {
        const params = new URLSearchParams(window.location.search);
        query = params.get('query');
        getImages();
    })

    let images = [];

    let offset = 0, limit = 20, certainty = 0.4;
    function getImages() {
        return fetch(`/api/query-image?query=${query}&offset=${offset}&limit=${limit}&certainty=${certainty}`)
            .then((res) => {
                if(res.status !== 200) throw res.statusText;
                return res.json();
            }).then((res) => {
                images = images.concat(res);
                offset += limit;
            })
    }
</script>

<div class="main">
    <div class="nav">
        <form action="/search" method="GET">
            <input name="query" placeholder="Query!"/>
            <button type="submit">Search!</button>
        </form>
    </div>

    <div class="images">
        {#each images as image}
        <img src={image.thumbnails[1]} alt=""/>
        {/each}
    </div>
    <div class="footer">
        <button on:click={getImages}>Get more</button>
    </div>
</div>

<style>
    .main {
        display: grid;
        grid-template-columns: 100%;
        grid-template-rows: max-content auto max-content;
        height: 100%;
        overflow: scroll;
    }

    .nav {
        padding: 5px;
    }

    .images>img {
        max-height: 200px;
        max-width:  100%;
    }
    .footer {
        
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>