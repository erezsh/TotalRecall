<script>
    import SidebarItem from './SidebarItem.svelte'

    export let name
    export let items
</script>

<style>
li {
    margin-bottom: 5px;
    white-space: nowrap;
}

ul {
    padding: 0;
    list-style-type: none;
}

.sidebar {
    padding: 10px;
    max-width: 400px;
    overflow-x: clip;
}

</style>


<div class="sidebar">
    <h3>{name}</h3>
    <ul>
        {#each items.slice(0, 20) as item}
        <li>
            <SidebarItem {item} />
        </li>
        {/each}
    </ul>

</div>