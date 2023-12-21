<script>
	import ImageInput from "./ImageInput.svelte";
	import TextInput from "./TextInput.svelte";
</script>

<h1>Search an image</h1>
<TextInput />
<div class="divider">
    <div class="a">
        <hr/>
    </div>
    <div class="b">or</div>
    <div class="a">
        <hr/>
    </div>
</div>
<ImageInput/>


<style>

    .divider {
        display: grid;
        grid-template-columns: auto max-content auto;
        grid-template-rows: max-content;
    }
    .divider>.a{
        width: 100%;
    }
    .divider>.b {
        padding: 0 10px;
    }

</style>