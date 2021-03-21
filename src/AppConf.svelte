<script>
    import { browser } from "webextension-polyfill-ts";

    import { saveAs } from 'file-saver';

	async function get_bg_module() {
		let bg_module = await browser.runtime.getBackgroundPage()
		return bg_module.background
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    let bookmark_import_started = false
    let bookmark_import_done = false
    let bookmark_import_count = 0

    async function export_bookmarks() {
        let bg = await get_bg_module()
        let pages = await bg.pages_db.allPages()
        let json = JSON.stringify(pages, null, 2)
        console.log(json)
        var file = new File([json], "total_recall_backup.json", {type: "application/json"});
        saveAs(file);
    }

    export async function import_browser_bookmarks()
    {
        let bg = await get_bg_module()
        let db = await bg.pages_db

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
</script>

<style>
/* section {
    background: #eee;
    border: 1px solid black;
    border-radius: 10px;
} */
</style>


<main>
	<h1>Configuration</h1>

    <div id="sections">
    <section class="section">
        <h2>Tracking</h2>

        <h4>Control which information is collected</h4>

        <p>
        Note: These features require access to the pages that you visit
        </p>

        <label><input type="checkbox" bind:checked={collect_tags} />Collect and suggest tags based on page contents</label>
        <label><input type="checkbox" bind:checked={collect_content} disabled/>Collect page contents for full-text search</label>

    </section>

    <section class="section">
        <h2>Replication (Sync)</h2>

        <h4>Control which pages are synced to an external database</h4>

        <label><input type="checkbox" /> Sync bookmarks</label>

        <!-- <label><input type="checkbox" /> Sync visited pages</label> -->

        <h4>Replication targets</h4>

        Note: if no target

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