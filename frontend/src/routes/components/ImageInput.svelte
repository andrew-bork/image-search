<script>
	import { Images, LoopedQuery } from "../query";
    import { LoadedImages } from "../stores";

    /** @type {HTMLInputElement} */
    let input;
    /** @type {HTMLImageElement} */
    let preview;

    let selectedImage = false;

    function readBase64() {
        if(input.files && input.files.length > 0) {
            return new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    res(reader.result);
                }
                // @ts-ignore
                reader.readAsDataURL(input.files[0]);
            })
        }

        throw "No files";
    }
</script>

<form>
    <div class="subheader">By image</div>
    <img bind:this={preview} alt="File Preview" hidden={!selectedImage}/>
    <label for="image-query">Upload an image</label>
    <input id="image-query" name="query" type="file" accept="image/png, image/jpeg" bind:this={input} hidden
        on:change={(e) => {
            selectedImage = false;
            if(input.files && input.files.length > 0) {
                selectedImage = true;

                let src = URL.createObjectURL(input.files[0]);
                preview.onload = () => {
                    URL.revokeObjectURL(src);
                }
                preview.src = src;
            }
        }}
    />
    {#if selectedImage}
    <button type="submit" 
        on:click={async () => {
            const base64 = await readBase64();
            const result = await fetch("/api/upload-query-image", {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify(base64)
            }).then((res) => {
                if(res.status !== 200) throw res.statusText;
                return res.json();
            });

            // console.log(result);
            const id = result.id;

            LoadedImages.setLoopedQuery(
                new LoopedQuery((offset) => {
                    return Images.image.query(id, offset, 20, 0.4);
                })
            );
        }}
    >Search!</button>
    {/if}
    <!-- <br/> -->
</form>


<style>

    .subheader {
        font-size: 18px;
        margin-bottom: 10px;
    }

    form {
        padding: 20px;
    }

    label {
        color: white;
        background-color: #3260cd;
        padding: 10px;
        display: block;
        width: max-content;
        border-radius: 4px;

        user-select: none;

        transition: background-color .3s;
    }

    label:hover {
        background-color: #284da3;

    }

    img {
        max-width: 200px;
        max-height: 200px;
        display: block;
    }
    button {
        margin: 5px;
    }
</style>