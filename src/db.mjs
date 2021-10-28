import FlexSearch from 'flexsearch';

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

class PageDB {

    constructor() {
        this.pouch = new PouchDB('Total Recall', {})

        // this.remote_pouch = new PouchDB('http://142.93.52.229:5984/_users')

        // let remote = new PouchDB('http://admin:couchdb@142.93.52.229:5984/pages_127001')
        // this.pouch.replicate.to(remote)

        this._rebuild_flex()
    }

    //
    // FlexSearch access functions
    //

    async _rebuild_flex() {
        this.flex = new FlexSearch({
            encode: "advanced",
            tokenize: "full",
            suggest: true,
            cache: true,
            doc: {
                id: "_id",
                field: [
                    "_id",
                    "description",
                    "notes",
                    "tags_str",
                ],
                tag: "starred"
            }
        });


        let docs = await this.pouch.allDocs({include_docs:true})
        let rows = docs.rows.filter(x => x.doc.starred)        // only index starred pages, for performance reasons
        console.log('Building search index for ' + rows.length + ' pages.')
        let i = 0;
        for (let d of rows) {
            this._add_flex(d.id, d.doc)     // Todo optimize?
            i += 1;
            if (i % 1000 == 0) {
                console.debug('Built ' + Math.round(i*100/rows.length) + "%")
            }
        }
        console.debug("Search index built.")
    }

    _add_flex(url, attrs) {
        let search_data = {
            _id: url,
            description: attrs.description,
            notes: attrs.notes,
            tags_str: attrs.tags?attrs.tags.join(','):'',
            starred: attrs.starred,
            ...attrs
        }

        if (this.flex.find('url', url)) {
            this.flex.update([search_data])
        } else {
            this.flex.add([search_data])
        }
    }

    _del_flex(url) {
        console.debug("Removing url from flex:", url)
        let page = this.flex.find(url)
        this.flex.remove(page)
        console.debug("done")
    }

    //
    // Public interface
    //

    // Attrs: title, tags, marked, content; Okay if page already exists
    async addPage(url, attrs) {
        let doc = {
            _id: url,
            created: new Date(),
            ...attrs
        }

        this._add_flex(url, doc)

        try {
            let res = await this.pouch.put(doc)
            doc._rev = res.rev
        } catch(err) {
            console.error("Error in addPage:", err)
        }

        return doc
    }

    async updatePage(page) {
        page.updated = new Date()
        this._add_flex(page._id, page)
        let current_page = await this.getPage(page._id)
        return await this.pouch.put({...page, _rev: current_page._rev})
    }

    // async upsertPage(url, make_new_page) {
    //     let page = await this.getPage(url)
    //     let new_page = make_new_page(page)
    //     if (page) {
    //         return await this.updatePage({...page, ...new_page})
    //     } else {
    //         return await this.addPage(url, new_page)
    //     }
    // }

    async deletePage(url) {
        let page = await this.getPage(url)
        if (page) {
            this._del_flex(page._id)
            await this.pouch.remove(page)
            return true
        }
        return false
    }


    _includes_all_tags(r, tags) {
        let tags_str = r.tags_str.toUpperCase()
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

    _search(words, tags, exclude, only_starred) {
        let results = null
        if (tags.length && !words.length) {
            results = this.flex.where({})
        } else {
            results = this.flex.search(words.join(' '), {
                where: only_starred?{"starred": true}:{},
                // limit: 100
            })
        }
        console.debug("Search for ", words, "returned:", results.length, "initial results ---- options:", tags, exclude, only_starred)

        return results
                .filter((r) => this._includes_all_tags(r, tags))
                .filter((r) => this._not_includes_excluded(r, exclude))
    }

    search(phrase, only_starred=false) {
        console.debug("Searching:", phrase)
        if (!phrase) {
            return []
        }
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
        return this._search(elems, tags, exclude, only_starred)
    }

    async destroy() {
        await this.pouch.destroy()
        this.pouch = new PouchDB('Total Recall', {})
        this._rebuild_flex()
    }


    async count() {
        let res = await this.pouch.allDocs()
        return res.total_rows
    }

    async allPages() {
        let docs = await this.pouch.allDocs({include_docs:true})
        return docs.rows.map( (item) => item.doc)
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
            return await this.pouch.get(url)
        } catch(e) {
            if (e.status != 404) {
                console.error("Error trying to get url:", url)
                throw new Error(e)
            }
            return null
        }
    }

}

export let db = new PageDB()