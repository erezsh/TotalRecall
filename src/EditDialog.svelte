<script type="typescript">
	import { browser } from "webextension-polyfill-ts";
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';

    import Tags from "./Tags.svelte";

    export let description
    export let url
    export let notes = ""
    export let tags = []
    export let suggested_tags

    let edit_url = false;
    let desc_input = null;
    let url_input = null;
    let expand_notes = false;

	const dispatch = createEventDispatcher();

    onMount(() => {
    });

    function focus(x) {x.focus();}

	async function get_bg_module() {
		let bg_module = await browser.runtime.getBackgroundPage()
		return bg_module.background
	}

    async function save() {
        let bg = await get_bg_module()
        await bg.pages_db.upsertPage(url, (doc) => {
            return {description, notes, tags}
        })
        dispatch('save', {})
    }

    function cancel() {
        dispatch('cancel', {})
    }

    function handleTags(event) {
        tags = event.detail.tags;
    }

	function keydown(e) {
        switch (e.key) {
            case 'Escape':
                cancel()
                break
            default:
        }
	}
</script>

<style scoped>
h1 {
    text-align: center;
    color: #111;
}

#dialog {
    padding: 0 5px;
    padding-bottom: 20px;
}

#dialog_buttons {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
}
#url {
    display: flex;
}
#tags button {
    float: right;
    margin-top: -3px;
}
#tags {
    margin-bottom: 30px;
}
#notes {
    margin-bottom: 10px;
}

input, textarea, .input_placeholder {
    width: 100%;
}
input {
    height: 40px;
}

textarea {
    height: 50px;
}
textarea.expand {
    height: 100px;
    transition: height 0.2s;
}


#description {
    font-size: 15px;
}

form :global(.svelte-tags-input-tag) {
    /* background: #1a8883 */
    background: #8c95b3;
    color: #fcfcfc;
}
</style>

<!-- <svelte:body /> -->

<form id="dialog" on:submit|preventDefault={save} on:keydown|capture={keydown} >
    <div>
        <input id="description" placeholder="Description" use:focus bind:value={description} />
    </div>

    <div id="tags">
        <Tags
            placeholder="Add tags"
            onlyUnique={true}
            autoComplete={suggested_tags}
            addKeys={[9, 188]}
            on:tags={handleTags}
            {tags}
        />
        <button class="diminished" tabindex="-100">clear all</button>
    </div>

    <div id="notes" on:input={() => expand_notes=true}>
        <textarea placeholder="Notes" class={expand_notes?"expand":""} bind:value={notes}/>
    </div>

    <div id="url">
        {#if edit_url}
            <input placeholder="url://" use:focus bind:value={url}/>
        {:else}
            <div class="input_placeholder">url: {url}</div>
            <button class="diminished" on:click={() => edit_url=true}>edit url</button>
        {/if}
    </div>

    <div id="dialog_buttons">
        <button class="default">Save changes</button>
        <button on:click={cancel}>Cancel</button>
    </div>
</form>

