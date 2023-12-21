<script>
	import { Images, LoopedQuery } from "../query";


	import { LoadedImages } from "../stores";


    /** @type {HTMLInputElement} */
    let input;
</script>

<form>
    <div class="subheader">By text</div>
    <input name="query" placeholder="Query!" bind:this={input}/>
    <button type="submit" 
        on:click={()=>{
            const text = input.value;

            LoadedImages.setLoopedQuery(
                new LoopedQuery(
                    (offset) => {
                        return Images.text.query(text, offset, 20, 0.4);
                    }
                )
            );
        }}
    >Search!</button>
</form>

<style>
    form {
        padding: 20px;
    }

    .subheader {
        font-size: 18px;
        margin-bottom: 10px;
    }
</style>