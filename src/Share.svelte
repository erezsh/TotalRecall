<script>
	import { Email, HackerNews, Reddit, LinkedIn, Pinterest, Telegram, Tumblr, Vk, WhatsApp, Xing, Facebook, Twitter } from 'svelte-share-buttons-component';

	export let url = 'https://pchynoweth.github.io/svelte-share-buttons-component/';
	export let title = 'Svelte Share Buttons Component';
	export let desc = '';
	export let tags = []

	$: tags_commasep = tags.join(',')


</script>

<!-- 
<Email subject="{title}" body="{desc} {url}" />
<HackerNews class="share-button" {title} {url} />
<Reddit class="share-button" {title} {url} />
<LinkedIn class="share-button" {url} />
<Tumblr class="share-button" {title} {url} caption="{title}" />
<Pinterest class="share-button" {url} media="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/200px-Svelte_Logo.svg.png" description={title} />
<Telegram class="share-button" text={title} {url} />
<Vk class="share-button" {title} {url} />
<WhatsApp class="share-button" text="{title} {url}" />
<Xing class="share-button" {title} {url} />
<Facebook class="share-button" {url} />
<Twitter class="share-button" text="{title}" {url} hashtags="github,svelte" via="username" related="other,users" />
 -->

<Email subject="{title}" body="{desc} {url}" />
<Twitter class="share-button" text="{title}" {url} hashtags={tags_commasep} via="TotalRecall" related="other,users" />
<Facebook class="share-button" {url} />
<Reddit class="share-button" {title} {url} />
<HackerNews class="share-button" {title} {url} />