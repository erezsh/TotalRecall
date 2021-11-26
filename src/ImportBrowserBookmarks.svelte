<script lang="ts">
    import browser from "webextension-polyfill";
    import {get_db} from './interfaces.ts';

    let bookmark_import_started = false
    let bookmark_import_done = false
    let bookmark_import_count = 0

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function import_browser_bookmarks()
    {
        let db = await get_db()

        console.log('Starting bookmarks import...')
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

        let r = await browser.permissions.request({permissions: ["bookmarks"]})
        if (!r) {
            console.log('Bookmark import cancelled: insufficient permissions')
            return
        }
        bookmark_import_started = true
        let tree = await browser.bookmarks.getTree();

        await _extract_bookmarks(tree).then( () => { })
        console.log('Done with bookmarks import...')
        bookmark_import_done = true
    }

</script>

<div>
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
</div>