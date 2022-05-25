<script lang="ts">
	import { WSEvents, WSFocusEvent, type Dispatcher } from "src/model/event";
	import type { WSDataCollector } from "src/model/collector";
	import type { WSProjectManager } from "src/model/manager";
	import WordCountForFile from "./WordCountForFile.svelte";
	import WordCountForProject from "./WordCountForProject.svelte";
	import WordCountForVault from "./WordCountForVault.svelte";
	import { onDestroy, onMount } from "svelte";
	import { WSFile } from "src/model/file";

	export let eventDispatcher: Dispatcher;
	export let dataCollector: WSDataCollector;
	export let projectManager: WSProjectManager;

	let file: WSFile;

	export function getWatchFile() {
		return file;
	}

	onMount(() => {
		eventDispatcher.on(WSEvents.Focus.File, updateFile, { filter: null });
	});

	onDestroy(() => {
		eventDispatcher.off(WSEvents.Focus.File, updateFile, { filter: null });
	});

	function updateFile(event: WSFocusEvent) {
		file = event.info.file;
	}
</script>

<div class="ws-status-bar">
	{#if file instanceof WSFile}
		<WordCountForFile {file} events={eventDispatcher} />
		{#if projectManager.getProjectsByFile(file).length > 0}
			<WordCountForProject events={eventDispatcher} manager={projectManager} focus={file}/>
		{/if}
	{/if}
	<WordCountForVault events={eventDispatcher} collector={dataCollector} />
</div>
