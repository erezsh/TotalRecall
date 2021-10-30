import {db} from './db.mjs'
import browser from "webextension-polyfill";

console.log("Background page loaded")


const SYNC_CONFIG_ITEM = 'sync_config'


let sync_config = JSON.parse(localStorage.getItem(SYNC_CONFIG_ITEM))
function apply_sync_config() {
    console.log("###", sync_config)
    switch (sync_config.sync_target) {
        case "None":
            db.cancel_sync()
            break
        case "CustomCouch":
            db.sync_to_couch(sync_config.custom_couch_url)
            break
        case "MainServer":
            db.sync_to_main_server(sync_config.main_server_user, sync_config.main_server_pass)
            break
        default:
            console.error("Bad sync target!!", sync_config)
    }
}

window.addEventListener('storage', function(event){
    if (event.storageArea === localStorage) {
        if (event.key === 'sync_config') {
            sync_config = JSON.parse(event.newValue)
            apply_sync_config()

        }
    }
}, false);

apply_sync_config()




export let pages_db = db;


function isSupportedProtocol(urlString) {
  var supportedProtocols = ["https:", "http:", "ftp:", "file:"];
  var url = document.createElement('a');
  url.href = urlString;
  return supportedProtocols.indexOf(url.protocol) != -1;
}

function setIcon(tab_id, marked) {
  browser.browserAction.setIcon({
    path: marked ? {
        "16": "images/star-16.png",
        "32": "images/star-32.png",
        "48": "images/star-48.png",
        "128": "images/star-128.png"
    } : {
        "16": "images/star-h-16.png",
        "32": "images/star-h-32.png",
        "48": "images/star-h-48.png",
        "128": "images/star-h-128.png"
    },
    tabId: tab_id
  })
  browser.browserAction.setTitle({
    // Screen readers can see the title
    title: marked ? 'Forget' : 'Remember',
    tabId: tab_id
  })
}


function assert_attr(obj, attr) {
    if (obj == null) {
        throw new Error('null object')
    }
    if (!obj.hasOwnProperty(attr)) {
        throw new ReferenceError('The property ' + attr + ' is not defined on this object');
    }
}

export function update_icon(tab_id, page) {
    try {
        setIcon(tab_id, page?Boolean(page.starred):false)
    } catch(e) {
        console.error("Could not update icon:", e)
        console.trace()
    }
}


async function extractTabMeta(tab) {
    try {
        await install_page_content_script(tab.id)
    } catch(e) {
        console.log("@@ Failed installing script", e.message, tab, e)
    }
    // console.log("Installed. Sending message", tab.url)

    let meta
    try {
        // let command = true? "getPageContent" : "getPageKeywords"
        // the db can't handle page content right now
        command = "getPageKeywords"
        meta = await browser.tabs.sendMessage(tab.id, { command })
        console.log("Page metadata: ", tab.url, meta)
    } catch(e) {
        console.log("@@ Failed sending message", e.message, tab, e)
    }

    return meta
}


async function handleUpdated(tabId, changeInfo, tab) {
    try{
    // Gets called every time a tab is updated

    // TODO log previous URL in page.visits
    // https://stackoverflow.com/questions/33770825/get-previous-url-from-chrome-tabs-onupdated/33771228

    // if ((changeInfo.status == 'loading' || changeInfo.status == 'complete')
    //     && tab.url && isSupportedProtocol(tab.url)) {
    //     console.log("loading#", tab)
    if (tabId != tab.id) {
        console.error("whoops!", tabId, tab.id)
    }

    if (!tab.active) {
        return
    }
    if (!tab.url) {
        console.log("no tab url")
        return
    }

    // if (false) { //"track_visited") {      // TODO
        // Disabled for now. Only track bookmarked pages
        // let defaults = {description: tab.title, starred: false}
        // ;[page, _just_created] = await db.getOrNewPage(tab.url, defaults)
        // console.log("tracking", tab.url, page, _just_created)
    // } else {
    // }

    let page = await db.getPage(tab.url)
    
    update_icon(tab.id, page)

    // Only edit pages that have already been recorded

    // TODO if track_visited && (collect_tags || collect_content)
    if (page && changeInfo.status == 'complete') {

        // if (tab.url.startsWith('http')) {
        //     let meta = await extractTabMeta(tab)
        //     if (meta) {
        //         if (meta.url) {
        //             page = (await db.getPage(meta.url)) || page // Try to find canonical page
        //             page._id = meta.url                         // Update to canonical url
        //             console.log("Updating URL to:", meta.url, page)
        //         }

        //         if (_just_created) {
        //             page.src_meta = meta
        //             page.description = meta.title
        //             page.notes = meta.description
        //             console.log("Updating page from information", page)
        //         }
        //     }
        // }

        // TODO if (track_visited || page && page.starred)
        let now = new Date()
        page.last_visited = now
        page.visit_count = (page.visit_count || 0) + 1
        // TODO limit on visits length? Aggregate? Only count once per day?
        // page.visits = (page.visits || [])
        // page.visits.push({when: now})

        try {
            console.log("Updated page", page)
            await db.updatePage(page)
        } catch(err) {
            // Not so bad if we fail to write
            console.error(err)
        }

    }

} catch (e) {
    console.error("AAAA", e)
    console.trace()
}
}

export function get_browser() {
    return browser
}
async function install_page_content_script(tab_id) {
    let r = await browser.permissions.contains({origins: ["*://*/*"]})
    if (r) {
        try {
            await browser.tabs.executeScript(tab_id, { file: "/build/extract_content.js" })
        } catch(e) {
            console.error('Failed:', e.message, e)
        }
    }
}


async function handleActivated(info) {
    try{
    let tab
    try {
        tab = await browser.tabs.get(info.tabId);
    } catch(e) {
        console.error("Cannot find activated tab:", e)
        console.trace()
        return
    }
    let page = await db.getPage(tab.url)
    update_icon(tab.id, page)
} catch(e) {
    console.error("AAAA", e)
    console.trace()
}
}

console.log("Adding handler")
browser.tabs.onUpdated.addListener(handleUpdated);
browser.tabs.onActivated.addListener(handleActivated)

browser.commands.onCommand.addListener(function(command) {
    let page = 'find.html'
    browser.tabs.create({'url': browser.runtime.getURL(page)})
    console.log('Command:', command);

});

// apply_sync_config()
