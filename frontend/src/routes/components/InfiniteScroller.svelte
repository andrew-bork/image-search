<script>
    /** @type {Array<{url: string, thumbnails: Array<string>}>} */
    export let images;

</script>

<div>

    {#each images as image} 
    <img src={image.thumbnails[1]} alt=""/>
    {/each}
</div>


<style>
    div {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        width: 100%;
    }

    div>* {
        max-height: 200px;
        max-width: 100%;
    }
</style>