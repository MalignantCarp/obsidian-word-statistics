<script lang="ts">
	import type WordStatisticsPlugin from "src/main";
	import { WSEvents, WSFocusEvent } from "src/model/events";
	import { WSFile } from "src/model/file";
	import type { WSFolder } from "src/model/folder";
	import { onDestroy, onMount } from "svelte";
	import ProgressFile from "./ProgressFile.svelte";
	import ProgressFolder from "./ProgressFolder.svelte";

	export let plugin: WordStatisticsPlugin;

	let progress: ProgressFile;
	let focus: WSFile = null;

	let okay = false;

	let folderList: WSFolder[] = [];

	onMount(() => {
		plugin.events.on(WSEvents.Focus.File, onFocus, { filter: null });
	});

	onDestroy(() => {
		plugin.events.off(WSEvents.Focus.File, onFocus, { filter: null });
	});

	function onFocus(event: WSFocusEvent) {
		focus = event.info.file;
		folderList = focus?.getGoalParents().reverse() || [];
	}
	
	$: if (focus instanceof WSFile) {
		okay = true;
	}

	$: if (focus instanceof WSFile) {
		progress?.FocusFile(focus);
		progress?.updateAll();
	}
</script>

<div class="ws-progress-view">
	<h1>Word Goal Progress</h1>
	{#if okay}
		{#each folderList as folder}
			<ProgressFolder {plugin} {folder} />
		{/each}
		<ProgressFile {plugin} file={focus} bind:this={progress} />
	{:else}
		<div>No file focused.</div>
	{/if}
</div>
