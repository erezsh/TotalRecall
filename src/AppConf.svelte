<script lang="ts">
    import browser from "webextension-polyfill";
    import {get_db, get_bg_module, get_search_config} from './interfaces.ts';
    import Tags from "./Tags.svelte";
    import ImportBrowserBookmarks from "./ImportBrowserBookmarks.svelte"
    import ChooseSyncOption from "./ChooseSyncOption.svelte"

    import { saveAs } from 'file-saver';
    import { writable } from 'svelte-local-storage-store'

    import Button from '@smui/button';


    const search_config = get_search_config()

    function handleTags(event) {
        $search_config.sidebar_tags = event.detail.tags;
    }
    let sidebar_tags: Array<string> = $search_config.sidebar_tags

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


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
            return
        }

        let rows = json.data
        console.log(`Importing ${rows.length} rows from file ${f.name}`)

        rows = rows.map(i => ({
            ...i,
            updated: (i.updated),
            created: (i.created),
            last_visited: (i.last_visited),
        }))

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

</script>


<style>
    #sections {
        display: flex;
    }
    section {
        background: #f8f8f8;
        box-shadow: 0px 0 0pt 1pt #ddd;
        padding: 5px 20px 20px 10px;
        border-radius: 10px;
        margin: 10px;
    }

    .inner_dialog {
        padding: 0 20px;
    }

    #glass {
        margin-top: 6px;
        margin-left: 16px;
        margin-right: 8px;
    }

    #glass i {
        font-size: 28px;
    } 

    .spring {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }


    #find-text {
        font-size: 21px;
        margin-right: 10px;
        color: #666;
    }

    #find-button i {
        font-size: 34px;
        margin-right: 16px;
    }

</style>

<main>
    <div class="spring">
        <div class="spring">
            <div id="glass">
                <a href="/conf.html">
                    <i class="material-icons">settings</i>
                </a>
            </div>
            <h1>
                Configuration
            </h1>
        </div>
        <div>
            <a href="/find.html">
                <div class="spring">
                    <div id="find-text">
                        Find
                    </div>
                    <div id="find-button">
                        <i class="material-icons rotating">search</i>
                    </div>
                </div>
            </a>
        </div>
    </div>

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

        <ChooseSyncOption />

    </section>

    <section class="section">
        <h2>Customize</h2>
        <div>
            <h3>Tags to show in main page</h3>
            <Tags
                placeholder="Choose tags"
                onlyUnique={true}
                addKeys={[9, 188]}
                on:tags={handleTags}
                tags={sidebar_tags}
            />

        </div>
    </section>

    <section>
        <h2>Import / Export</h2>
        <div>
            <h3>Browser Bookmarks</h3>
            <ImportBrowserBookmarks/>
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
