# Total Recall

TotalRecall is a keyboard-first, cross-browser extension, for marking and recalling webpages.

It can be used for:
- Quickly recalling websites you bookmarked in the past
- Quicklaunching pages you visit often
- Saving/loading browsing sessions (as bookmarks grouped by a session tag)
- Synchronizing your bookmarks across browsers

## Get it now

- [Chrome Extension](https://chrome.google.com/webstore/detail/total-recall/fjhhkjfebkebegmdmemndmbnaoccpfcj)

- [Firefox Extension](https://addons.mozilla.org/en-US/firefox/addon/total-recall/)

## Features

- Tag-based organization (no folders)
- Full-text search + tags search using hashtag syntax (`#mytag`)
	- Sort by relevance, last updated, url, etc. 
- Uses CouchDB for open-protocol live synchronization across devices
- We provide an official CouchDB server with https access, maintained for free
	- Users may sync to their own private CouchDB server instead
- Export and import your database to and from a local JSON file

**Built with:**
- Svelte for UI
- FlexSearch for fast full-text searching
- PouchDB for persistence and synchronization

## How to use

- Press `Ctrl+Shift+K` to bookmark the current page
	- Edit the bookmark, and press `Enter` to confirm
	- Press `Escape` to cancel bookmark

- Press `Ctrl+Shift+F` to open search, and start typing!
	- Navigate the results using `Up`/`Down`/`Page Up`/`Page Down`/`Home`/`End`
	- Press `Enter` to go to selected page(s)
	- Press `Ctrl+Enter` to open the selected pages in new tabs
	- Press `Shift+Enter` to open the selected pages in a new window
	- Press `Insert` to edit the bookmarks for the selected pages
	- Press `Delete` to delete the bookmarks for the selected pages


## Backup & Syncronization

Replication (sync) is disabled by default, but can be enabled by the user.

There are two replication options:

- **Sync to TotalRecall free server** - Will sync to a dedicated server that we provide for free.
	- Data is sent securely over https.
	- We will never share your data (i.e. bookmarks) with anyone, without your permission.
- **Sync to custom CouchDB** - Will sync to any CouchDB that has a public URL.
	- CouchDB databases are very easy to set up. (We highly recommend [Caddy](https://caddyserver.com/) as an SSL front).


## How to build?

If you want to build the extension yourself, just clone it and run:

```bash
	npm run build
```

The files will be written into the `public` directory.

## Screenshot

![Screenshot](screenshot1.png)
