<script lang="ts">
	import { browser } from "webextension-polyfill-ts";
	import { onMount } from 'svelte';

	import SearchList from './SearchList.svelte'
	import Sidebar from './Sidebar.svelte'
	import EditDialog from './EditDialog.svelte';
	import {get_db, Page} from './interfaces.ts';
    import { writable } from 'svelte-local-storage-store'

    const general_config = writable<GeneralConfig>('general_config', {sidebar_tags: []})

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
		search_results = new Promise( (then, except) => {then(res)})
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
		for (let tag of $general_config.sidebar_tags)
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
	<h1>Find bookmarked pages</h1>
	<div>
		{#await get_count()}
			Counting ...
		{:then r}
			<p>total: {r}</p>
		{:catch error}
			<p style="color: red">{error.message}</p>
		{/await}
	</div>
	<div>
		<a href="conf.html">conf</a>
	</div>

	{#if edit_mode}
	<button on:click={()=>edit_mode=false}>Back to search</button>
	<div id="edit_area">
		{#each edit_items as page}
		<div class="edit_item">
			<EditDialog
				description={page.description}
				url={page._id}
				notes={page.notes || ''}
				tags={page.tags || []}
				suggested_tags={["do!", "watch!", "read!", "play!", "listen!"]}
				on:save={() => {save_edit_item(page)}}
				on:cancel={() => {close_edit_item(page)}}
			/>
		</div>
		{/each}
	</div>
	{:else}
	<div id="search">
		<div id="search_bar">
			<!-- <input type="search" id="search_input" placeholder="Search" bind:value={search} use:focus /> -->
			<input type="search" id="search_input" placeholder="Search" bind:value={search} bind:this={search_input} use:focus />
			<!-- <label><input type="checkbox" bind:checked={only_starred} />Only Starred</label> -->
		</div>
		{#if search}
			{#await search_results}
				...?
			{:then r}
				<SearchList items={r} on:edit={set_edit_mode} on:delete={delete_items}/>
			{:catch error}
				<p style="color: red">{error.message}</p>
			{/await}
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
	</div>
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
	padding: 10px;
	font-size: 18px;
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

</style>