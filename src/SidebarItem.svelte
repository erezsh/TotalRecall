<script>
    import _ from 'lodash';
    import {get_db} from './interfaces.ts';
    export let item

    const DONE_TAG = 'done'

    // let done = false
    $: done = item.tags.includes(DONE_TAG)

    function toggle_tag(tags, tag) {
        if (tags.includes(tag)) {
            _.pull(tags, tag)
        } else {
            tags.push(tag)
        }
        return tags
    }

    async function on_toggle(e) {
        // done = e.target.checked
        item.tags = toggle_tag(item.tags, DONE_TAG)
        const db = await get_db()
        await db.updatePage(item)
    }
</script>

<style>

a {
    font-size: 14px;
    margin-left: 6px;
}

.done {
    text-decoration: line-through;
}
</style>



<input class="toggle" type="checkbox" checked={done} on:change={on_toggle} />
<a href={item._id} class:done target="_blank">{item.description}</a>