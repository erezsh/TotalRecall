<script>
    export let item

    let done = false

    function on_toggle(e) {
        done = e.target.checked
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



<input class="toggle" type="checkbox" checked={false} on:change={on_toggle} />
<a href={item._id} class:done target="_blank">{item.description}</a>