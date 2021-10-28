<script>
    import { browser } from "webextension-polyfill-ts";
    import Select, {Option} from '@smui/select';
    import Button from '@smui/button';
    import { createEventDispatcher } from 'svelte';
	// import Dialog, {Title, Content, Actions, Label} from '@smui/dialog';

    import SearchItem from './SearchItem.svelte'
    import EditDialog from './EditDialog.svelte';

    export let items = []

	const dispatch = createEventDispatcher();

    let page = 0;
    let page_size = 50;
    let loaded_items = []
    let auto_scroll = false;

    let select_anchor = 0;
    let select_active = 0;

    $: select_start = Math.min(select_anchor, select_active)
    $: select_end = Math.max(select_anchor, select_active)

    $: loaded_len = loaded_items.length
    let res_len = items.length

    let sort_by = "relevance";

    let _sort_by_options = {
        relevance: "Relevance",
        visited: "Number of visits",
        last_visit: "Last Visit",
        created: "Created",
        updated: "Updated",
    }
    let sort_by_options = Object.entries(_sort_by_options).map(([a,b])=>{return {option:a, text:b}})

    function next_page() {
        loaded_items = [
            ...loaded_items,
            ...items.slice(page_size * page, page_size * (page + 1))
        ]

        page += 1
    }

    function edit_items() {
        let selected = items.slice(select_start, select_end+1)
        dispatch('edit', {selected})
    }

    function delete_items() {
        let selected = items.slice(select_start, select_end+1)
        dispatch('delete', {selected})
    }

    function open_items(new_window, new_tab) {
        let urls = items.slice(select_start, select_end+1).map((i)=>i._id)
        if (new_window) {
            browser.windows.create({url: urls})
        } else {
            let head = urls[0]
            let tail = urls.slice(1)
            if (new_tab) {
                browser.tabs.create({url: head})
            }

            for (let url of tail) {
                browser.tabs.create({url, active:false, selected:false})
            }

            if (!new_tab) {
                document.location.href = head
            }
        }
    }

    function key_navigate(e, f) {
        auto_scroll = true;

        let new_index = f(select_active)

        if (new_index < 0) {
            new_index = 0
        } else if (new_index >= res_len-1) {
            new_index = res_len-1
        }

        if (new_index >= loaded_len) {
            next_page()
        }

        select_active = new_index
        if (!e.shiftKey) {
            select_anchor=select_active;
        }
        e.preventDefault()
    }


	function keydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                key_navigate(e, (i) => i + 1)
                break
            case 'ArrowUp':
                key_navigate(e, (i) => i - 1)
                break
            case 'PageDown':
                key_navigate(e, (i) => i + 20)
                break
            case 'PageUp':
                key_navigate(e, (i) => i - 20)
                break
            case 'Home':
                key_navigate(e, (i) => 0)
                break
            case 'End':
                key_navigate(e, (i) => res_len-1)
                break

            case 'Enter':
                open_items(e.shiftKey, e.ctrlKey)
                e.preventDefault()
                break
            case 'Insert':
                edit_items()
                e.preventDefault()
                break
            case 'Delete':
                // console.log('Delete')
                delete_items()
                e.preventDefault()
                break
            default:
        }
	}

    next_page()

    let remove_dialog
</script>

<svelte:body on:keydown={keydown} />

<ol id="search_list">
    <div id="search_toolbar">
        <!-- <Dialog bind:this={remove_dialog} aria-labelledby="dlg-remove-title" aria-describedby="dlg-remove-content">
            <Title id="dlg-remove-title">Remove pages from memory</Title>
            <Content id="dlg-remove-content">
                Do you want Total Recall to forget these pages? {items.length}
            </Content>
            <Actions>
                <Button on:click={() => alert('no')}>
                    <Label>No</Label>
                </Button>
                <Button on:click={() => alert('yes')}>
                    <Label>Yes</Label>
                </Button>
            </Actions>
        </Dialog> -->

        <Button  color="secondary" variant="unelevated" class="default" title="Open selected" on:click={()=>open_items(false)}>
            <i class="material-icons">open_in_browser</i>
        </Button>
        <Button color="secondary" variant="unelevated" on:click={()=>open_items(true)}>
            <i class="material-icons">open_in_new</i>
        </Button>
        *
        <Button color="secondary" variant="unelevated" on:click={edit_items}>
            <i class="material-icons">edit</i>
        </Button>
        <Button color="secondary" variant="unelevated" on:click={delete_items}>
            <i class="material-icons">delete_forever</i>
        </Button>
		<!-- Sort by: -->
		<!-- <div class="sort_menu">
                <input type=radio bind:group={sort_by} value=option} id={"sort_"+option} />
                <label for={"sort_" + option}> {text} </label>
            {/each}
		</div> -->

        <Select bind:value={sort_by} label="Sort By:">
            {#each sort_by_options as {option, text}}
                <Option value={option} selected={option == "relevance"}>{text}</Option>
            {/each}
        </Select>
        -- {res_len} results

    </div>

    {#each loaded_items as item, i}
        <li on:mousedown={()=>{auto_scroll=false; select_anchor=select_active=i}} on:mouseup={()=>select_active=i}>
            <SearchItem {item} expanded={select_start<=i && i<=select_end} {auto_scroll}/>
        </li>
    {:else}
        <div id="no-results">
            No results :(
        </div>
    {/each}

    {#if loaded_len != res_len}
        Showing {loaded_len} / {res_len} ({page})
        <button on:click={next_page}>Show more</button>
    {/if}
</ol>

<style>
    ol {
        list-style-type: none;
        padding: 0;
    }

    #search_toolbar {
        margin-bottom: 10px;
        font-size: 16px;
    }

    #no-results {
        text-align: center;
        font-size: 18px;
        color: gray;
    }



.sort_menu {
    display: inline-block;
}
.sort_menu input[type="radio"] {
  opacity: 0;
  position: fixed;
  width: 0;
}
.sort_menu label {
    display: inline-block;
    background-color: #ddd;
    padding: 10px 20px;
    font-size: 12px;
    border-radius: 8px;
}
.sort_menu input[type="radio"]:checked + label {
    background-color:#bfb;
    border-color: #4c4;
}
.sort_menu input[type="radio"]:focus + label {
  background-color: #cfc;
}
.sort_menu label:hover {
  background-color: #dfd;
}

</style>