import browser from "webextension-polyfill";

export enum SyncTarget {
  None = "None",
  MainServer = "MainServer",
  CustomCouch = "CustomCouch",
}

interface SyncConfig {
    sync_target: SyncTarget
    main_server_user?: string
    main_server_pass?: string
    custom_couch_url?: string
}

interface Page {
	_id: string
    description: string
    notes: string
    tags: Array<string>
    starred: boolean
}

interface PagesDB {
	search(s: string): Array<Page>
	count(): number
	getOrNewPage(url: string, defaults): Page

    replicate_to_couch(url: string)
    replicate_to_auth_server(name: string, password: string)
    deleteAllPages()
    addPages(pages: Array<Page>)
}

interface BackgroundPage {
	pages_db: PagesDB
	update_icon(tab_id: number, page: Page)

	get_sync_config(): SyncConfig
    set_sync_config(c: SyncConfig)
}

export function set_config(conf) {
}

declare global {
    interface Window {
        background: BackgroundPage
    }
}


export async function get_bg_module(): Promise<BackgroundPage> {
	let bg_page = await browser.runtime.getBackgroundPage()
	return bg_page.background
}

export async function get_db(): Promise<PagesDB> {
	let bg_module = await get_bg_module()
	return bg_module.pages_db
}
