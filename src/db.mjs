import FlexSearch from 'flexsearch';
import assert from 'assert';

// import PouchAuth from 'pouchdb-authentication';
import PouchDB from 'pouchdb';
// PouchDB.plugin(require('pouchdb-authentication'));
// import { createNoSubstitutionTemplateLiteral } from 'typescript';
// import {upsert} from 'pouchdb-upsert';
// PouchDB.plugin(upsert);
// PouchDB.plugin(require('pouchdb-find'));

// zx = require('pouchdb-authentication');
// import Hello from 'pouchdb-authentication';
// import PouchDBAuth from 'pouchdb-authentication';
// PouchDB.plugin(PouchDB_Auth);

import {register} from './login.mjs'

function get_couch_url(name, password, database) {
    return `https://${name}:${encodeURIComponent(password)}@totalrecall.erezsh.com:8080/${database}`
}

const SYNC_STATUS_ITEM = 'sync_status'
function set_sync_status(status) {
    localStorage.setItem(SYNC_STATUS_ITEM, JSON.stringify(status))
}


function now() {
    return (new Date()).toISOString()
}

function parse_date(d) {
    if (d === undefined) {
        return null
    }
    d = new Date(d)
    if (isNaN(d.getTime())) {
        return null
    }
    return d
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* 
   PageDB maintains a persistent and fast index of pages.

   It does so by storing the pages both in PouchDB and in FlexSearch,
   and keeping them in sync. (where PouchDB is the source of truth)


   page schema:
    _id: string         // this is the URI for the page
    description: string
    notes: string
    tags: Array[string]
    starred: bool

*/

class FlexWrapper {
    constructor(docs) {
        this.tags = null
        this.ready = false
        this._rebuild_flex(docs)
    }

    async _rebuild_flex(docs) {

        this.flex = new FlexSearch.Document({
            // encode: "advanced",
            tokenize: "full",
            bool: "or",
            // worker: true,
            // suggest: true,
            // cache: true,
            document: {
                id: "_id",
                index: [
                    "_id",
                    "description",
                    "notes",
                    "tags",
                ],
                store: [
                    "_id",
                    "description",
                    "notes",
                    "tags",
                    "starred",
                    "created",
                    "updated",
                ],
                // tag: "tags"
            }
        });

        let tags_concat = [].concat.apply([], docs.rows.map(x => x.doc.tags))
        this.tags = new Set(tags_concat.filter(x => x && (typeof x === 'string') && x.length > 0))     // throw away duplicates and bad values

        let rows = docs.rows.filter(x => x.doc.starred)        // only index starred pages, for performance reasons
        if (!rows.length) return

        console.log('Building search index for ' + rows.length + ' pages.')
        let i = 0;
        for (let d of rows) {
            this.add_page(d.id, d.doc, false)     // Todo optimize?
            i += 1;
            if (i % 1000 == 0) {
                console.debug('Built ' + Math.round(i*100/rows.length) + "%")
            }
        }
        console.debug("Search index built.")

        this.ready = true
    }

    add_page(url, attrs, update_tags=true) {
        let search_data = {
            _id: url,
            description: attrs.description,
            notes: attrs.notes,
            // tags_str: attrs.tags?attrs.tags.join(','):'',
            tags: attrs.tags,
            starred: attrs.starred,
            updated: parse_date(attrs.updated),
            created: parse_date(attrs.created),
            last_visited: parse_date(attrs.last_visited),
            ...attrs
        }

        if (this.flex.contain(url)) {
            this.flex.update(search_data)
        } else {
            this.flex.add(search_data)
        }

        if (update_tags) {
            this.tags = new Set([...this.tags || [], ...attrs.tags || []])
        }
    }

    del_page(url) {
        console.debug("Removing url from flex:", url)
        this.flex.remove(url)
    }



    _includes_all_tags(r, tags) {
        if (!r.tags) {
            return false
        }
        let tags_str = r.tags.join(' ').toUpperCase()
        for (let tag of tags) {
            if (!tags_str.includes(tag.toUpperCase())) {
                return false
            }
        }
        return true
    }

    _not_includes_excluded(r, exclude) {
        let id = r._id.toUpperCase()
        let desc = r.description.toUpperCase()
        for (let x of exclude) {
            if (id.includes(x.toUpperCase()) || desc.includes(x.toUpperCase())) {
                return false
            }
        }
        return true
    }

    search(words, tags, exclude, only_starred) {
        // The following line won't work. See: https://github.com/nextapps-de/flexsearch/issues/285
        // let search_str = words.concat(tags).join(' ')

        let search_str = (words.length ? words : tags).join(' ')

        let results = this.flex.search(search_str, {
                limit: Infinity,
                enrich: true,
                // tag: tags
        })

        let docs = {}
        for (let r of results) {
            for (let d of r.result) {
                docs[d.id] = d.doc
            }
        }

        console.debug("Search for ", search_str, "returned:", docs.length) //, "initial results ---- options:", tags, exclude, only_starred)

        return Object.values(docs)
                .filter((r) => this._includes_all_tags(r, tags))
                .filter((r) => this._not_includes_excluded(r, exclude))
    }

}


class PouchWrapper {
    constructor(state) {
        this.pouch = new PouchDB('Total Recall', {})
        this.syncHandler = null
        this.state = state
    }

    cancel_sync() {
        if (this.syncHandler) {
            console.log("Cancelling sync")
            this.syncHandler.cancel()
        }
        set_sync_status({status: 'disabled', message: 'Sync disabled'})
    }

    sync_to_couch(url) {
        let self = this

        this.cancel_sync()

        set_sync_status({status: 'disabled', message: 'Attempting to connect...'})

        let remote = new PouchDB(url)

        if (this.syncHandler) {
          this.syncHandler.removeAllListeners()
          this.syncHandler.cancel()
        }

        this.syncHandler = this.pouch.sync(remote, {
          live: true,
          // retry: true
        }).on('change', function (change) {
          // yo, something changed!
          console.log("Replication changed", change)
          set_sync_status({status: 'ok', message: 'Syncing...'})

          if (change.direction == 'pull') {
              console.log(" - Rebuilding search index", change)
              self.state.flex_invalid = true   // invalidate flex
          }

        }).on('paused', function (info) {
          // replication was paused, usually because of a lost connection
          console.log("Replication paused", info)
          set_sync_status({status: 'ok', message: 'Synced'})
        }).on('active', function (info) {
          // replication was resumed
          console.log("Replication active", info)
          set_sync_status({status: 'ok', message: 'Syncing...'})
        }).on('error', function (err) {
          // totally unhandled error (shouldn't happen)
          set_sync_status({status: 'error', message: `Sync failed. Check your internet connection? (${err.message})`})
          this.removeAllListeners()
          this.cancel()
          self.syncHandler = null
        });


    }

    async sync_to_main_server(name, password) {
        let self = this
        if (!name || !password) {
            return set_sync_status({status: 'error', message: "Name and password are required"})
        }
        set_sync_status({status: 'disabled', message: 'Attempting to register...'})

        let res
        try {
            res = await register(name, password)
        } catch (e) {
            set_sync_status({status: 'error', message: e.message})
            return
        }
        if (res.status === 'ok') {
            let url = get_couch_url(name, password, res.database)
            this.sync_to_couch(url)
        }
        set_sync_status({status: res.status, message: res.message})
    }



}


class PageDB {

    constructor() {
        this.state = {building_flex: false, flex_invalid: true}
        this.pouch = new PouchWrapper(this.state)
        this._pouch = this.pouch.pouch
    }


    async get_flex() {
        let state = this.state

        if (this._flex && !state.flex_invalid) {
            return this._flex
        }

        if (this.state.building_flex) {
            // Another thread is already building flex. Sleep for a bit, it should finish by then.
            for (let i=0; i<10; i++) {
                if (this.state.building_flex) {
                    await sleep(100)
                }
            }

            if (this.state.building_flex) {
                console.warn("Flex didn't finish building in 1 sec. Lock timeout.")
                this.state.building_flex = false
            }
        }

        if (this._flex && !state.flex_invalid) {
            return this._flex
        }

        // (re-)Build flex
        this.state.building_flex = true
        try {
            let docs = await this._pouch.allDocs({include_docs:true})
            this._flex = new FlexWrapper(docs)
            this.state.flex_invalid = false
        } finally {
            this.state.building_flex = false
        }

        return this._flex
    }


    invalidate_flex() {
        this._flex = null
        this.state.flex_invalid = true
    }

    async get_tags() {
        let flex = await this.get_flex()
        return [...flex.tags]
    }

    //
    // Public interface
    //

    // Attrs: title, tags, marked, content; Okay if page already exists
    async addPage(url, attrs) {
        let doc = {
            _id: url,
            created: now(),
            updated: now(),
            ...attrs
        }

        let flex = await this.get_flex()
        flex.add_page(url, doc)

        try {
            let res = await this._pouch.put(doc)
            doc._rev = res.rev
        } catch(err) {
            console.error("Error in addPage:", err)
        }

        return doc
    }

    async updatePage(page) {
        page.updated = now()
        let flex = await this.get_flex()
        flex.add_page(page._id, page)
        let current_page = await this.getPage(page._id)
        if (current_page) {
            page = {...page, _rev: current_page._rev}
        }
        return await this._pouch.put(page)
    }

    async upsertPage(url, make_new_page) {
        let page = await this.getPage(url)
        let new_page = make_new_page(page)
        assert(typeof new_page === 'object')
        if (page) {
            // XXX Inefficient, we getPage twice
            return await this.updatePage({...page, ...new_page})
        } else {
            return await this.addPage(url, new_page)
        }
    }

    async deletePage(url) {
        let page = await this.getPage(url)
        if (page) {
            let flex = await this.get_flex()
            flex.del_page(page._id)
            await this._pouch.remove(page)
            return true
        }
        return false
    }

    async deleteAllPages() {
        let docs = await this._pouch.allDocs({include_docs:false})
        let to_delete = docs.rows.map( (r) => ({_id: r.id, _rev:r.value.rev, _deleted: true}))
        await this._pouch.bulkDocs(to_delete)
        this.invalidate_flex()
    }


    async search(phrase, only_starred=false) {
        if (!phrase) {
            return []
        }

        console.debug("Searching:", phrase)

        let elems = []
        let tags = []
        let exclude = []
        for (let elem of phrase.trim().split(' ')) {
            if (elem.startsWith('#')) {
                tags.push(elem.substr(1))
            } else if (elem.startsWith('-')) {
                exclude.push(elem.substr(1))
            } else {
                elems.push(elem)
            }
        }
        let flex = await this.get_flex()
        return flex.search(elems, tags, exclude, only_starred)
    }

    async destroy() {
        await this._pouch.destroy()
        this.pouch = new PouchWrapper(this.state)
        this._pouch = this.pouch.pouch
        this.invalidate_flex()
    }


    async count() {
        let res = await this._pouch.allDocs()
        return res.total_rows
    }

    async allPages() {
        let docs = await this._pouch.allDocs({include_docs:true})
        let pages = docs.rows.map( (item) => item.doc)
        // Remove revisions, since they are not relevant for this API, and can get it the way.
        for (let page of pages) {
            delete page._rev
        }
        return pages
    }

    async addPages(pages) {
        await this._pouch.bulkDocs(pages)
        this.invalidate_flex()
    }

    async getOrNewPage(url, defaults) {
        let page = await this.getPage(url)
        if (page) {
            return [page, false]
        }

        let new_page = await this.addPage(url, defaults)
        return [new_page, true]
    }

    async getPage(url) {
        try {
            return await this._pouch.get(url)
        } catch(e) {
            if (e.status != 404) {
                console.error("Error trying to get url in getPage:", url)
                // throw new Error(e)
            }
            return null
        }
    }

}

export let db = new PageDB()