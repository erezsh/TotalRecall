import assert from 'assert';
import _ from 'lodash';

import {db} from '../src/db.mjs'


async function test1(N=2000) {
    console.log("Testing with", N, "rows")
    for (let i=0; i<N; i++) {
        let options = {tags: ['test']}
        if (i % 10 == 1) {
            options.starred = true;
        }

        await db.addPage('reddit.com/'+i, {description: ''+i, ...options})
    }

    assert(await db.count() === N)

    // Test sanity + search
    let item43 = (await db.search('reddit 43'))[0]
    assert(item43.description == '43')
    assert(!item43.starred)

    let item101 = (await db.search("reddit 101"))[0]
    assert(item101.description == '101')
    assert(item101.starred)

    // let item0 = await db.search("commm/")[0]
    let item0 = (await db.search("com"))[0]
    assert(item0.description == '0')

    assert( (await db.search("commmx")).length == 0 )

    assert( (await db.search("reddit")).length == N )
    assert( (await db.search("#test")).length == N )
    assert( (await db.search("#test -999")).length == N - (N/1000) )
    assert( (await db.search("#test2")).length == 0 )

    assert( (await db.search("reddit #test")).length == N )
    assert( (await db.search("com #test")).length == N )

    // Test deletePage 
    await db.deletePage(item0._id)
    // let item1 = await db.search("commm/")[0]
    let item1 = (await db.search("com"))[0]
    assert(item1.description == '1')

    assert(await db.count() == N-1)

    // Test getPage 
    let item1_copy = await db.getPage(item1._id)
    assert( item1._id === item1_copy._id )
    assert( item1.description === item1_copy.description )
    assert( item1.notes === item1_copy.notes )
    assert( _.isEqual( item1.tags, item1_copy.tags ))
    assert( item1.starred === item1_copy.starred )
    assert( item1.created === item1_copy.created )    // TODO make all dates strings?

    // Test getOrNewPage
    let defaults = {description: "lala", tags:['haha']}
    let [item1_copy2, is_new] = await db.getOrNewPage(item1._id, defaults)
    assert( !is_new )
    assert( item1._id === item1_copy2._id )
    assert( item1.description === item1_copy2.description )

    let [new_item, is_new2] = await db.getOrNewPage(item1._id + "@test", defaults)
    assert( is_new2 )
    assert( new_item.description === defaults.description )
    assert( _.isEqual(new_item.tags, defaults.tags ))

    // Test allPages
    let all = await db.allPages() 
    assert( all.length === await db.count() )

    // Test updatePage
    item1.description = "hoho"
    await db.updatePage(item1)
    let item1_copy3 = await db.getPage(item1._id)
    assert( item1.description === item1_copy3.description )

    // Test upsertPage
    item1.description = "haha"
    await db.upsertPage(item1._id, (i) => item1)
    let item1_copy4 = await db.getPage(item1._id)
    assert( item1.description === item1_copy4.description )

    item1._id += '@test2'
    await db.upsertPage(item1._id, (i) => item1)
    let item1_copy5 = await db.getPage(item1._id)
    assert( item1._id === item1_copy5._id )
    assert( item1.description === item1_copy5.description )

    let f = (i) => ({...i, description: "lala"})
    await db.upsertPage(item1._id, f)
    let item1_copy6 = await db.getPage(item1._id)
    assert( item1_copy6.description === "lala" )


    // Test deleteAllPages
    await db.deleteAllPages()
    assert( await db.count() === 0 )

    // Test addPages
    await db.addPages(all)
    assert( all.length === await db.count() )




}

async function test2() {
    // assert(await db.count() === 0)
    // await db.addPage("https://www.erezsh.com/", {description: "Erez Shinan's website", starred: true, tags: ["test", "test2"]})
    // assert(await db.count() === 1)

    // let res = await db.search("shinan")

    await db.flex.add({_id:"bla2", description: 'hello', starred: true, tags: ["aa", "bb"]})
    await db.flex.add({_id:"bla3", description: 'hello world', starred: true, tags: ["airplane"]})
    await db.flex.add({_id:"hello", description: 'world', starred: true})
    await db.flex.add({_id:"bye", description: 'world', starred: true})

    // let res = await db.search('Airplan', {enrich: true})
    let res = await db.search(null, {enrich: true})
    console.log(res)
    // console.log(db.flex.get('bla2'))
}

async function cleanup() {
    console.log("[!] Destroying")
    await db.destroy()
}

async function test_all() {
    try {
        await test1()
        // await test2()
    } finally {
        await cleanup()
    }
}

function main() {
    test_all().then()
}

main()