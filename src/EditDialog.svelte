<script lang="ts">
	import { browser } from "webextension-polyfill-ts";
    import { onMount } from 'svelte';
    import { slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import {get_db, Page} from './interfaces.ts';

    import Tags from "./Tags.svelte";

    export let description: string
    export let url: string
    export let notes: string = ""
    export let tags: Array<string> = []
    export let suggested_tags_promise: Promise<Array<string>>

    let edit_url = false;
    let desc_input = null;
    let url_input = null;
    let expand_notes = false;

	const dispatch = createEventDispatcher();

    onMount(() => {
    });

    function focus(x) {x.focus();}

    async function save() {
        let db = await get_db()
        await db.upsertPage(url, (doc) => {
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
            case 'Enter':
                if (e.ctrlKey) {
                    save()
                }
                break
            default:
        }
	}
</script>

<style scoped>

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
    background: #8c95b3;
    color: #fcfcfc;
}
</style>


<form id="dialog" on:submit|preventDefault={save} on:keydown|capture={keydown} >
    <div>
        <input id="description" placeholder="Description" use:focus bind:value={description} />
    </div>

    {#await suggested_tags_promise}
        Loading tag suggestions...
    {:then suggested_tags}
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
    {:catch error}
        <p style="color: red">{error.message}</p>
    {/await}

    <div id="notes" on:input={() => expand_notes=true}>
        <textarea placeholder="Notes" class={expand_notes?"expand":""} bind:value={notes} />
    </div>

    <div id="url">
        {#if edit_url}
            <input placeholder="url://" use:focus bind:value={url} />
        {:else}
            <div class="input_placeholder">url: {url}</div>
<!--             <button class="diminished" on:click={() => edit_url=true}>edit url</button>
 -->            
        {/if}
    </div>

    <div id="dialog_buttons">
        <button class="default">Save changes</button>
        <button on:click={cancel}>Cancel</button>
    </div>
</form>

