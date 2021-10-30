<script lang="ts">
    import browser from "webextension-polyfill";
    import {get_db, get_bg_module, SyncTarget} from './interfaces.ts';

    import { saveAs } from 'file-saver';
    import { writable } from 'svelte-local-storage-store'

    const sync_config = writable<SyncConfig>('sync_config', {sync_target: "null"})
    const sync_status = writable<SyncConfig>('sync_status', {status: "disabled"})

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let bookmark_import_started = false
    let bookmark_import_done = false
    let bookmark_import_count = 0

    async function export_bookmarks() {
        let db = await get_db()
        let pages = await db.allPages()
        let json = JSON.stringify(pages, null, 2)
        console.log(json)
        var file = new File([json], "total_recall_backup.json", {type: "application/json"});
        saveAs(file);
    }

    export async function import_browser_bookmarks()
    {
        let db = await get_db()

        console.log('Starting bookmarks import...')
        bookmark_import_started = true
        bookmark_import_done = false
        bookmark_import_count = 0

        async function _extract_bookmarks(nodes, tags=[]) {
            for (let n of nodes) {
                if (n.url) {
                    if (!n.url.startsWith('javascript:') && !n.url.startsWith('data:')) {
                        let page = await db.getPage(n.url)
                        if (!page) {
                            await db.addPage(n.url, {
                                description: n.title,
                                tags: tags,
                                starred: true
                            }, false)
                            bookmark_import_count += 1
                        }
                    }
                } else if (n.title && n.title != 'Other bookmarks') {
                    await _extract_bookmarks(n.children, tags.concat(n.title))
                } else {
                    await _extract_bookmarks(n.children, [])
                }
            }
            await sleep(0)  // yield execution
        }

        let tree = await browser.bookmarks.getTree();

        await _extract_bookmarks(tree).then( () => { })
        console.log('Done with bookmarks import...')
        bookmark_import_done = true
    }

    async function request_page_access() {
        let r = await browser.permissions.request({origins: ["*://*/*"]})
        if (!r) {
            collect_tags = false
            return
        }

        console.log("approved!")
    }

    let collect_tags = false;
    let collect_content = false;
    // $: collect_tags && request_page_access().then( () => {} )


    let main_server_user, main_server_pass, custom_couch_url
    function load_config_into_locals() {
        ({main_server_user, main_server_pass, custom_couch_url} = $sync_config)
    }

    $: $sync_config, load_config_into_locals()

    async function save_custom_couch() {
        $sync_config = {...$sync_config, custom_couch_url}
    }

    async function save_main_server() {
        $sync_config = {...$sync_config, main_server_user, main_server_pass}
    }
</script>


<main>
	<h1>Configuration</h1>

    <div id="sections">

    {#if false}
    <section class="section">
        <h2>Tracking</h2>

        <h4>Control which information is collected</h4>

        <p>
        Note: These features require access to the pages that you visit
        </p>

        <label><input type="checkbox" bind:checked={collect_tags} />Collect and suggest tags based on page contents</label>
        <label><input type="checkbox" bind:checked={collect_content} disabled/>Collect page contents for full-text search</label>

    </section>
    {/if}

    <section class="section">
        <h2>Replication (Sync)</h2>

        <h4>Control which pages are synced to an external database.</h4>

        <h4>Sync status:</h4>

        {$sync_status.status} -- {$sync_status.message}

        <h4>Sync target:</h4>

        <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.None}/>No sync</label>

        <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.MainServer}/>Sync to TotalRecall free server</label>

        <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.CustomCouch}/>Sync to custom CouchDB</label>

        {#if $sync_config.sync_target == SyncTarget.MainServer}
            <div class="inner_dialog">
                <h5>Login details for free server:</h5>
                <label>username: <input type="text" bind:value={main_server_user} required /></label>
                <label>password: <input type="password" bind:value={main_server_pass} required /></label>
                <button on:click={save_main_server}>Save</button>
                (registration is automatic)
            </div>
        {:else if $sync_config.sync_target == SyncTarget.CustomCouch}
            <div class="inner_dialog">
                <h5>URL for custom CouchDB:</h5>
                <label>URL: <input type="url" bind:value={custom_couch_url}/></label>
                <button on:click={save_custom_couch}>Save</button>
            </div>
        {/if}

    </section>

    <section>
        <h2>Import / Export</h2>
        <div>
            <h3>Browser Bookmarks</h3>
            <button on:click={import_browser_bookmarks}>Import bookmarks from browser</button>
            {#if bookmark_import_started}
                <div>
                {#if bookmark_import_done}
                    Done!
                {:else}
                    Importing...
                {/if}
                Imported {bookmark_import_count} bookmarks
                </div>
            {/if}
            <p>(This won't overwrite existing bookmarks)</p>
        </div>

        <div>
            <h3>To/from JSON</h3>
            <button on:click={export_bookmarks}>Export bookmarks as JSON</button>
            <br/>
            <button disabled={true}>Import JSON of bookmarks</button>
        </div>
    </section>
    </div>

</main>

<style>

</style>