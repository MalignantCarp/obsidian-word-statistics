<script lang="ts">
	import type WordStatisticsPlugin from "src/main";
	import { WSEvents, WSFocusEvent, WSFolderEvent } from "src/model/events";
	import { WSFile } from "src/model/file";
	import { WSFolder } from "src/model/folder";
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
		plugin.events.on(WSEvents.Folder.GoalSet, updateFolders, { filter: null });
	});

	onDestroy(() => {
		plugin.events.off(WSEvents.Focus.File, onFocus, { filter: null });
		plugin.events.off(WSEvents.Folder.GoalSet, updateFolders, { filter: null });
	});

	function onFocus(event: WSFocusEvent) {
		focus = event.info.file;
	}

	function updateFolders(event: WSFolderEvent) {
		console.log(event.info.folder?.path, focus?.path, event.info.folder === focus.parent, event.info.folder.isAncestorOf(focus));
		if (event.info.folder instanceof WSFolder && focus instanceof WSFile && (event.info.folder === focus.parent || event.info.folder.isAncestorOf(focus))) {
			progress?.updateAll();
			focus = focus;
		}
	}

	$: if (focus instanceof WSFile) {
		okay = true;
		progress?.FocusFile(focus);
		progress?.updateAll();
	}

	$: folderList = focus instanceof WSFile ? focus.getGoalParents().reverse() : [];
</script>

<div class="ws-progress-view">
	<h1>Word Goal Progress</h1>
	{#if okay}
		{#each folderList as folder (folder.path)}
			<ProgressFolder {plugin} {folder} />
		{/each}
		<ProgressFile {plugin} file={focus} bind:this={progress} />
	{:else}
		<div>No file focused.</div>
	{/if}
</div>
