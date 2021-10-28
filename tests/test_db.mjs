import assert from 'assert';
import _ from 'lodash';

import {db} from '../src/db.mjs'


async function test1(N=1000) {
    console.log("Testing with", N, "rows")
    for (let i=0; i<N; i++) {
        let options = {tags: ['test']}
        if (i % 10 == 1) {
            options.starred = true;
        }

        await db.addPage('reddit.com/'+i, {description: ''+i, ...options})
    }

    assert(await db.count() == 1000)

    // Test sanity + search
    let item43 = await db.search('reddit 43')[0]
    assert(item43.description == '43')
    assert(!item43.starred)

    let item101 = await db.search("reddit 101")[0]
    assert(item101.description == '101')
    assert(item101.starred)

    let item0 = await db.search("commm/")[0]
    assert(item0.description == '0')

    assert( await db.search("commmx").length == 0 )

    assert( await db.search("reddit").length == 1000 )
    assert( await db.search("#test").length == 1000 )
    assert( await db.search("#test -999").length == 999 )
    assert( await db.search("#test2").length == 0 )

    // Test deletePage 
    await db.deletePage(item0._id)
    let item1 = await db.search("commm/")[0]
    assert(item1.description == '1')

    assert(await db.count() == 999)

    // Test getPage 
    let item1_copy = await db.getPage(item1._id)
    assert( item1._id === item1_copy._id )
    assert( item1.description === item1_copy.description )
    assert( item1.notes === item1_copy.notes )
    assert( _.isEqual( item1.tags, item1_copy.tags ))
    assert( item1.starred === item1_copy.starred )
    assert( item1.created.toISOString() === item1_copy.created )    // TODO make all dates strings?

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
    // item1.description = "haha"
    // await db.upsertPage(item1)
    // let item1_copy4 = await db.getPage(item1._id)
    // assert( item1.description === item1_copy4.description )

    // item1._id += '@test2'
    // let item1_copy5 = await db.getPage(item1._id)
    // assert( item1._id === item1_copy5._id )
    // assert( item1.description === item1_copy5.description )



}

async function cleanup() {
    await db.destroy()
}

async function test_all() {
    try {
        await test1()
    } finally {
        await cleanup()
    }
}

function main() {
    test_all().then()
}

main()