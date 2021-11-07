<script>
    import Time from "svelte-time";

    export let item
    export let expanded=false;
    export let auto_scroll

    async function get_extra_details() {
    }

    let item_node = null;

    $: expanded && item_node && auto_scroll && item_node.scrollIntoView({block: "center"})

</script>

<style>
    .item {
        padding: 10px 20px;
        margin-bottom: 5px;
    }
    .item:hover {
        box-shadow: 0px 0 0pt 1pt #838EF2;
    }

    .item > .base {
        display: flex;
    }
    .item.selected {
        /* outline: 2px solid #838EF2; */
        box-shadow: 0px 0 0pt 1pt #838EF2;
        border-radius: 10px;
        background: #EFF8FF;
    }
    .item.selected .description {
        font-weight: bold;
    }

    .url>a {
        color: #4475D3;
    }
    .url {
        font-size: 16px;
        margin: 5px 0;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }

    .description {
        font-size: 18px;
    }

    .tags {
        margin-left: 10px;
    }
    .tag {
        background: #eee;
        border-radius: 5px;
        padding: 2px 5px;
        margin-left: 6px;
        white-space: nowrap;
        background: #5d84ab;
        color: #fff;
    }
    .star {
        background: url('/images/star-h-16.png');
        width: 16px;
        height: 16px;
        margin-top: 4px;
        margin-right: 9px;
    }
    .star.starred {
        background: url('/images/star-16.png')
    }

    .metadata {
        color: #999;
        font-size: 10px;
    }
    .metadata i {
        font-size: 15px;
    }
    .item.selected .metadata {
        color: #666;
    }
</style>

<div class="item" class:selected={expanded} bind:this={item_node}>
    <div class="base">
        <div class="star" class:starred={item.starred}></div>
        <div class="description">{item.description}</div>
        <div class="tags">
            {#each (item.tags||[]) as tag}
                <span class="tag">{tag}</span>
            {/each}
        </div>
    </div>
    <div class="flex">
        <div class="url"><a href={item._id}>{item._id}</a></div>
        {#if expanded}
        <div class="metadata">
    <!--         @ {item.visit_count}
            @ {item.last_visited}
     -->        
            {#if item.created}
                <i class="material-icons">access_time</i> 
                Created: <Time relative timestamp={item.created} />
            {/if}
            {#if item.updated}
                <i class="material-icons">access_time</i> 
                Updated: <Time relative timestamp={item.updated} />
            {/if}
        </div>
        {/if}
    </div>

    <!-- {#if expanded}
        <div class="expanded">
            {#await get_extra_details()}
                Getting details
            {:then {url, notes}}
                <div class="notes">{notes}</div>
            {:catch}
                Error :(
            {/await}
        </div>
    {/if} -->

</div>