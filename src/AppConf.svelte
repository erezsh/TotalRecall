<script lang="ts">
    import browser from "webextension-polyfill";
    import {get_db, get_bg_module, SyncTarget} from './interfaces.ts';

    import { saveAs } from 'file-saver';
    import { writable } from 'svelte-local-storage-store'

    import Button from '@smui/button';

    const sync_config = writable<SyncConfig>('sync_config', {sync_target: "null"})
    const sync_status = writable<SyncConfig>('sync_status', {status: "disabled"})

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let bookmark_import_started = false
    let bookmark_import_done = false
    let bookmark_import_count = 0

    let files
    let import_json_result

    async function export_bookmarks() {
        let db = await get_db()
        let pages = await db.allPages()
        let json = JSON.stringify({app: "totalrecall", version: '1', data: pages}, null, 2)
        var file = new File([json], "total_recall_backup.json", {type: "application/json"});
        saveAs(file);
    }

    async function import_json_file(f) {
        let json = JSON.parse(await f.text())
        if (json.app != 'totalrecall' || json.version != '1') {
            import_json_result = {status: 'error', message: "Bad file format or version!"}
            console.log("CC", f)
            return
        }

        let rows = json.data
        console.log(`Importing ${rows.length} rows from file ${f.name}`)

        let db = await get_db()
        await db.addPages(rows)
        import_json_result = {status: 'ok', message: `imported ${rows.length} pages`}
    }

    function handle_files_changed() {
        if (files && files.length) {
            import_json_file(files[0]).then()
        }
        files = null
    }

    $: files, handle_files_changed()


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

    let delete_all_pages_result = ""
    async function delete_all_pages() {
        let res = confirm("Do you really want to delete all your pages??\n\nThis operation is difficult to reverse!")
        if (res) {
            let db = await get_db()
            await db.deleteAllPages()
            delete_all_pages_result = "Deleted!"
        }
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

        {#if $sync_status.status == 'ok'}
            <i class="material-icons" style="color: lime">wifi_tethering</i>
        {:else if $sync_status.status == 'disabled'}
            <i class="material-icons" style="color: silver">wifi_tethering_off</i>
        {:else if $sync_status.status == 'error'}
            <i class="material-icons" style="color: red">wifi_tethering_error</i>
        {/if}
        {$sync_status.message}

        <h4>Sync target:</h4>

        <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.None}/>No sync</label>

        <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.MainServer}/>Sync to TotalRecall free server</label>

        <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.CustomCouch}/>Sync to custom CouchDB</label>

        {#if $sync_config.sync_target == SyncTarget.MainServer}
            <div class="inner_dialog">
                <h5>Login details for free server:</h5>
                <form on:submit|preventDefault={save_main_server}>
                    <label>username: <input type="text" bind:value={main_server_user} required /></label>
                    <label>password: <input type="password" bind:value={main_server_pass} required /></label>
                    <button type="submit">Save</button>
                </form>
                (registration is automatic)
            </div>
        {:else if $sync_config.sync_target == SyncTarget.CustomCouch}
            <div class="inner_dialog">
                <h5>URL for custom CouchDB:</h5>
                <form on:submit|preventDefault={save_custom_couch}>
                    <label>URL: <input type="url" bind:value={custom_couch_url} required placeholder="http://mycouch.com:5984/db" /></label>
                    <button type="submit">Save</button>
                </form>
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
            <button>
                <label class="custom-file-upload">
                    <input type="file" bind:files hidden />
                    Import JSON of bookmarks
                </label>
            </button>
            {#if import_json_result}
                <span class={import_json_result.status}>
                <i class="material-icons">{import_json_result.status}</i>
                </span>
                {import_json_result.message}
            {/if}


        </div>
    </section>


    <section>
        <h2>Advanced</h2>
        <div>
            <h3>Destroy</h3>
            <button on:click={delete_all_pages}>Delete all pages!</button>
            {delete_all_pages_result}
        </div>
    </section>
    </div>

</main>

<style>

</style>