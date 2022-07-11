<script lang="ts">
	import { getPackedSettings } from "http2";
	import { getLinkpath, Plugin } from "obsidian";
	import { WSEvents, WSFileEvent } from "src/model/event";
	import type { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSFileProject, type WSProject } from "src/model/project";
	import { FormatWords, FormatNumber } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let file: WSFile;
	export let project: WSProject;
	export let manager: WSProjectManager;

	let wordGoal: number = 0;

	onMount(() => {
		manager.plugin.events.on(WSEvents.File.Renamed, onFileRename, { filter: null });
		manager.plugin.events.on(WSEvents.File.Updated, onFileUpdated, { filter: null });
		manager.plugin.events.on(WSEvents.File.WordsChanged, onFileWordsChanged, { filter: null });
		manager.plugin.events.on(WSEvents.File.GoalsSet, onGoalUpdate, { filter: file });
		manager.plugin.events.on(WSEvents.Project.GoalsSet, onGoalUpdate, { filter: project });
		manager.plugin.events.on(WSEvents.Path.GoalsSet, onGoalUpdate, { filter: null });
		wordGoal = manager.getWordGoalForFileByContext(file, project);
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.File.Renamed, onFileRename, { filter: null });
		manager.plugin.events.off(WSEvents.File.Updated, onFileUpdated, { filter: null });
		manager.plugin.events.off(WSEvents.File.WordsChanged, onFileWordsChanged, { filter: null });
		manager.plugin.events.off(WSEvents.File.GoalsSet, onGoalUpdate, { filter: file });
		manager.plugin.events.off(WSEvents.Project.GoalsSet, onGoalUpdate, { filter: project });
		manager.plugin.events.off(WSEvents.Path.GoalsSet, onGoalUpdate, { filter: null });
	});

	function onGoalUpdate() {
		wordGoal = manager.getWordGoalForFileByContext(file, project);
	}

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

<tr class="ws-pmv-proj-file">
	{#if manager.plugin.settings.useDisplayText && project instanceof WSFileProject}
		<td class="title">{project.file.getLinkTitle(file) || file.title}</td>
	{:else}
		<td class="title">{file.title}</td>
	{/if}
	<td class="path">{file.path}</td>
	{#if wordGoal > 0}
		<td class="word-count">{FormatNumber(file.words)} / {FormatWords(wordGoal)}</td>
	{:else}
		<td class="word-count">{FormatWords(file.words)}</td>
	{/if}
</tr>
