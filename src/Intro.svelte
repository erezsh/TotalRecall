<script lang="ts">
    import ImportBrowserBookmarks from "./ImportBrowserBookmarks.svelte"
    import ChooseSyncOption from "./ChooseSyncOption.svelte"
</script>

<style type="text/css">
	.explanation {
		margin-left: 20px;
	}

	main {
		font-size: 18px;
	}

	code {
/*	    background: #7a7a7a;
	    color: #eee;
*/
	    border-radius: 10px;
	    padding: 3px 10px;
        color: #666;
	    box-shadow: 0px 2px 3px #888;
	    font-weight: bold;
	}
	code.strong {
		color:  blue;
		font-weight: bold;
	}


	.explanation li {
		margin: 5px;
	}

	h1 {
		font-size: 32px;
	}
	h2 {
		font-size: 32px;
		color: #77c;
		font-weight: bold;
	}
	h3 {
		font-size: 26px;
	}

	td {
		padding: 10px;
	}
	tr {
	}
	table {
		border-color: #888;
	}

	main {
		padding: 20px;
	}

	.setup-item {
		margin-left: 20px;
	}

</style>

<main>
	<h1>Thank you for installing TotalRecall.</h1>

	Prepare for a bookmarking experience like never before.

    <h2>How to use?</h2>

	<p>
		TotalRecall is a keyboard-first extension for marking and recalling the webpages you've visited before.
	</p>

	<p>
		To use it effectively, you need to learn two shortcuts, one for each basic operation:
	</p>

    <ol class="explanation">
    	<li><p><b>Bookmark - </b>Press <code class="strong">Ctrl+Shift+.</code> to mark the current page.</p>
    		<ul>
    			<li>Edit the bookmark, and press <code>Enter</code> to confirm</li>
    			<li><code>Escape</code> - cancel bookmark, if it's new.</li>
    		</ul>
    	</li>
    	<li><p><b>Find - </b>Press <code class="strong">Ctrl+Shift+F</code> to open the search page, and start typing!</p>
    		<ul>
    			<li><code>Up</code>/<code>Down</code> - Navigate the results </li>
    			<li><code>Enter</code> - go to selected page(s)</li>
    			<li><code>Ctrl+Enter</code> - open the selected pages in new tabs</li>
    			<li><code>Shift+Enter</code> - open the selected pages in a new window</li>
    			<li><code>Insert</code> - edit the bookmarks for the selected pages</li>
    			<li><code>Delete</code> - delete the bookmarks for the selected pages</li>
    			<li><code>Page Up</code>/<code>Page Down</code>/<code>Home</code>/<code>End</code> - Fast navigate</li>
    		</ul>
    	</li>
    </ol>

	<h2>Setup</h2>

	<p>Before you start using TotalRecall, we recommend that you go through these setup options.</p>
	<p>You can also find them later in the Settings page.</p>

	<ul>
	<li class="setup-item">
		<h3>Import bookmarks from browser</h3>
		<p>If you're currently managing bookmarks with your browser, for some reason, you can import them into TotalRecall!</p>
		<p>We'll automatically set tags for each item according to its parent directories.</p>
		<ImportBrowserBookmarks />
	</li>

	<li class="setup-item">
		<h3>Set up synchronization to the server</h3>
		<p>You can set up TotalRecall to backup and synchronize your bookmarks across browsers.</p>
		<p>Note: Your bookmarks will be stored in the server unencrypted.</p>
		<div style="background: #eee; padding: 10px 40px; border-radius: 20px; display: inline-block;">
		    <ChooseSyncOption />
	    </div>
	</li>
	</ul>


</main>
