<script lang="ts">
    import { writable } from 'svelte-local-storage-store'

    import {SyncConfig, SyncStatus, SyncTarget} from './interfaces.ts';

    const sync_status = writable<SyncStatus>('sync_status', {status: 'disabled', message: 'Sync disabled'})
    const sync_config = writable<SyncConfig>('sync_config', {sync_target: "None"})

    let main_server_user, main_server_pass, custom_couch_url
    function load_config_into_locals() {
        ({main_server_user, main_server_pass, custom_couch_url} = $sync_config)
    }

    $: $sync_config, load_config_into_locals()

    async function save_custom_couch() {
        $sync_config = {...$sync_config, custom_couch_url}
    }

    async function save_main_server() {
        $sync_config = {...$sync_config, main_server_user, main_server_pass}
    }
</script>

<style scoped>
    input {
        margin-right: 5px;
    }
</style>

<div>
    <h4>Sync status:</h4>

    {#if $sync_status.status === 'ok'}
        <i class="material-icons" style="color: lime">wifi_tethering</i>
    {:else if $sync_status.status === 'disabled'}
        <i class="material-icons" style="color: silver">wifi_tethering_off</i>
    {:else if $sync_status.status === 'error'}
        <i class="material-icons" style="color: red">wifi_tethering_error</i>
    {/if}
    {$sync_status.message}


    <h4>Sync target:</h4>

    <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.None}/>No sync</label>

    <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.MainServer}/>Sync to TotalRecall free server</label>

    <label><input type="radio" bind:group={$sync_config.sync_target} value={SyncTarget.CustomCouch}/>Sync to custom CouchDB</label>

    {#if $sync_config.sync_target == SyncTarget.MainServer}
        <div class="inner_dialog">
            <h5>Login details for free server:</h5>
            <form on:submit|preventDefault={save_main_server}>
                <label>username: <input type="text" bind:value={main_server_user} required /></label>
                <label>password: <input type="password" bind:value={main_server_pass} required /></label>
                <button type="submit">Save</button>
            </form>
            (registration is automatic)
        </div>
    {:else if $sync_config.sync_target == SyncTarget.CustomCouch}
        <div class="inner_dialog">
            <h5>URL for custom CouchDB:</h5>
            <form on:submit|preventDefault={save_custom_couch}>
                <label>URL: <input type="url" bind:value={custom_couch_url} required placeholder="http://mycouch.com:5984/db" /></label>
                <button type="submit">Save</button>
            </form>
        </div>
    {/if}
</div>