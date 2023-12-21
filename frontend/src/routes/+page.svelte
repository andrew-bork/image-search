<script>
    import SearchCard from "./components/SearchCard.svelte";
    let showImages = false;

    /** @type {import("./query").LoopedQuery?} */
    let loopedQuery = null;


</script>

<div class="main">
    <div>
        <SearchCard bind:loopedQuery/>
    </div>
</div>
<!-- <div>
    {#im}
</div> -->

<style>
    .main {
        display: flex;
        align-items: center;
        justify-content: center;
        
        font-family: Arial, Helvetica, sans-serif;

        color: #000000a8;

        width: 100%;
        height: 100%;
    }
    
    .main>div {
        width: max-content;
        height: max-content;

        background-color: #ffffff;

        border-radius: 10px;
        padding: 40px;
    }
</style>