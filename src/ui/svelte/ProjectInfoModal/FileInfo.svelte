<script lang="ts">
	import { WSEvents, WSFileEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { onDestroy, onMount } from "svelte";

	export let file: WSFile;
	export let manager: WSProjectManager;

	onMount(() => {
		manager.plugin.events.on(WSEvents.File.Renamed, onFileRename, { filter: null });
		manager.plugin.events.on(WSEvents.File.Updated, onFileUpdated, { filter: null });
		manager.plugin.events.on(WSEvents.File.WordsChanged, onFileWordsChanged, { filter: null });
	});

    onDestroy(() => {
		manager.plugin.events.off(WSEvents.File.Renamed, onFileRename, { filter: null });
		manager.plugin.events.off(WSEvents.File.Updated, onFileUpdated, { filter: null });
		manager.plugin.events.off(WSEvents.File.WordsChanged, onFileWordsChanged, { filter: null });
    });

	function onFileRename(evt: WSFileEvent) {
		file = file;
	}

	function onFileUpdated(evt: WSFileEvent) {
		file = file;
	}

	function onFileWordsChanged(evt: WSFileEvent) {
		file = file;
	}
</script>

<div class="ws-pmv-proj-file">
	<div class="title">{file.title}</div>
	<div class="path">{file.path}</div>
	<div class="word-count">{file.words}</div>
</div>
