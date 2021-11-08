<script lang="ts">
	import { browser } from "webextension-polyfill-ts";
	import { onMount } from 'svelte';

	import SearchList from './SearchList.svelte'
	import Sidebar from './Sidebar.svelte'
	import EditDialog from './EditDialog.svelte';
	import {get_db, Page, get_suggested_tags, get_search_config} from './interfaces.ts';
    
    const search_config = get_search_config()

	let search_input;

	let edit_mode: boolean = false
	let edit_items: Array<Page> = [];

	let search: string = ""
	let only_starred: boolean = true
	let search_results: Array<Page> = [];
	$: set_search_results(search, only_starred)

	async function set_search_results(search, only_starred) {
		// Avoid the 'await' update flicker
		let res = await get_search_results(search, only_starred)
		// search_results = new Promise( (then, except) => {then(res)})
		search_results = res
	}

	async function get_search_results(search, only_starred) {
		let db = await get_db()
		return db.search(search, only_starred)
	}

	async function get_count(): number {
		let db = await get_db()
		return await db.count()
	}

	function focus(x) {x.focus()}

	async function get_sidebars() {
		let db = await get_db()
		let sidebars = []
		for (let tag of $search_config.sidebar_tags)
		{
			sidebars.push({
				name: tag,
				items: db.search('#'+tag)
			})
		}
		return sidebars;
	}

	onMount(async () => {
		// search_input.value isn't accessible after back button
		// Bug is svelte? Use SetTimeout 0 to fix it
		setTimeout(function() {
			console.log(search_input.value)
			search = search_input.value
		}, 0)
	});

	async function delete_items(e) {
		let selected = e.detail.selected
		let res = confirm('delete ' + selected.length + ' items?')
		if (res) {
			let db = await get_db()
			for (let item of selected) {
				console.log('deleting ', item)
				await db.deletePage(item._id)
				await set_search_results(search, only_starred)
			}
		}
	}

	function set_edit_mode(e) {
		edit_mode = true
		edit_items = e.detail.selected
	}

	function save_edit_item(item: Page) {
		close_edit_item(item)
	}
	function close_edit_item(item: Page) {
		edit_items = edit_items.filter( (i) => i._id !== item._id)
		if (edit_items.length == 0) {
			edit_mode = false
		}
	}

</script>


<main>
	<div>
		<div class="spring">
			<div class="spring">
				<div id="glass">
					<a href="/find.html">
					    <i class="material-icons">search</i>
					</a>
				</div>
				<div class="spring">
					<h1>
						Recall pages
					</h1>
					<div id="total">
						(Total:
						{#await get_count()}
							Counting ...
						{:then r}
							{r}
						{:catch error}
							<b style="color: red">{error.message}</b>
						{/await}
						)
					</div>
				</div>
			</div>
			<div>
				<a href="/conf.html">
					<div class="spring">
						<div id="settings-text">
							Settings
						</div>
						<div id="settings-button">
						    <i class="material-icons rotating">settings</i>
						</div>
					</div>
				</a>
			</div>
		</div>

	{#if edit_mode}
		{#await get_suggested_tags()}
			Getting tag suggestions...
		{:then suggested_tags}
		<button on:click={()=>edit_mode=false}>Back to search</button>
		<div id="edit_area">
			{#each edit_items as page}
			<div class="edit_item">
				<EditDialog
					description={page.description}
					url={page._id}
					notes={page.notes || ''}
					tags={page.tags || []}
					suggested_tags={suggested_tags}
					on:save={() => {save_edit_item(page)}}
					on:cancel={() => {close_edit_item(page)}}
				/>
			</div>
			{/each}
		</div>
		{:catch error}
			<p style="color: red">{error.message}</p>
		{/await}
	{:else}
		<div id="search">
			<div id="search_bar">
				<!-- <input type="search" id="search_input" placeholder="Search" bind:value={search} use:focus /> -->
				<input type="search" id="search_input" bind:value={search} bind:this={search_input} use:focus placeholder="Enter free-text and #tags" />
				<!-- <label><input type="checkbox" bind:checked={only_starred} />Only Starred</label> -->
			</div>
		</div>
		{#if search}
			<SearchList items={search_results} bind:sort_by={$search_config.sort_by} on:edit={set_edit_mode} on:delete={delete_items}/>
		{:else}
			<div id="sidebars">
				{#await get_sidebars()}
					Getting sidebars
				{:then sidebars}
					{#each sidebars as {name, items}}
						<Sidebar {name} {items}/>
					{/each}
				{:catch error}
					<p style="color: red">{error.message}</p>
				{/await}
			</div>

		{/if}
	{/if}

</main>

<style>

main {
	margin: 0;
	padding: 0;
	margin-top: 0;
}

#search {
	padding: 20px;
}
#sidebars {
	padding: 20px;
	/* width: 30vw; */
	display: flex;
	flex-wrap: wrap;
}

#search_input {
	min-width: 400px;
	height: 50px;
	font-size: 18px;

    padding: 20px 23px ;
    border-radius: 16px ;
}

#search_bar {
	display: flex;
	justify-content: left;
}

#edit_area {
	display: flex;
	flex-wrap: wrap;
}

.edit_item {
    width: 500px;
    margin: 10px;
    background: #eee;
    padding: 20px;
    border-radius: 10px;
}

#glass {
    margin-top: 10px;
    margin-left: 16px;
    margin-right: 4px;
}

#glass i {
	font-size: 28px;
} 

.spring {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

#total {
	margin-left:20px;
}

#settings-text {
    font-size: 21px;
    margin-right: 10px;
    color: #666;
}

#settings-button i {
    font-size: 34px;
    margin-right: 16px;
}

.rotating {
  transition: transform .7s ease-in-out;
}
.rotating:hover {
  transform: rotate(360deg);
}

    /* background: #eee; */

</style>