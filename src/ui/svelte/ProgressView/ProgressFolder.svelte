<script lang="ts">
	import type WordStatisticsPlugin from "src/main";
	import { WSEvents, WSFolderEvent } from "src/model/events";
	import { RECORDING, WSFolder } from "src/model/folder";
	import { FormatNumber, FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import ProgressBar from "./ProgressBar.svelte";

	export let plugin: WordStatisticsPlugin;
	export let events = plugin.events;

	export let folder: WSFolder;

	let progress: ProgressBar;
	let goal: number;
	let goalText: string = "";

	let count: number = 0;
	let countText = "";

	let label: string = "";

	let title = folder.getTitle();
	let name = folder.name;

	let inherit: boolean;
	let recording: boolean;

	onMount(() => {
		events.on(WSEvents.Folder.WordsChanged, onFolderUpdate, {
			filter: null,
		});
		events.on(WSEvents.Folder.Renamed, onFolderUpdate, { filter: null });
		events.on(WSEvents.Folder.GoalSet, onFolderUpdate, { filter: null });
		events.on(WSEvents.Folder.TitleSet, onFolderUpdate, { filter: null });
		events.on(WSEvents.Setting.Recording, onFolderUpdate, { filter: null});
		events.on(WSEvents.Folder.RecordingSet, onFolderUpdate, { filter: null });
		updateAll();
	});

	onDestroy(() => {
		events.off(WSEvents.Folder.WordsChanged, onFolderUpdate, {
			filter: null,
		});
		events.off(WSEvents.Folder.Renamed, onFolderUpdate, { filter: null });
		events.off(WSEvents.Folder.GoalSet, onFolderUpdate, { filter: null });
		events.off(WSEvents.Folder.TitleSet, onFolderUpdate, { filter: null });
		events.off(WSEvents.Setting.Recording, onFolderUpdate, { filter: null});
		events.off(WSEvents.Folder.RecordingSet, onFolderUpdate, { filter: null });
	});

	function onFolderUpdate(event: WSFolderEvent) {
		if (!(event.info.folder instanceof WSFolder)) return;
		updateAll();
	}

	export function updateAll() {
		if (folder instanceof WSFolder) {
			let g: number;
			title = folder.getTitle();
			name = folder.name;

			count = folder.wordCount;
			g = folder.getWordGoal();
			if (g === 0) {
				goal = Math.ceil(count / 10) * 10;
			} else {
				goal = g;
			}
			goalText = FormatWords(goal);
			countText = goal > 0 ? FormatNumber(count) : FormatWords(count);
			label = goal > 0 ? countText + " / " + goalText : countText;
			progress?.SetProgress(goal > 0 ? (count / goal) * 100 : 0);
			inherit = folder.recording === RECORDING.INHERIT;
			recording = folder.isRecording;
		} else {
			countText = "";
			label = "";
		}
		folder = folder;
	}
</script>

<div class="ws-progress-folder">
	<h2><span class="record" class:recording={recording && !inherit} class:inherit={recording && inherit}/>{title}</h2>
	{#if title != name}
		<div class="ws-progress-folder-name">({name})</div>
	{/if}
	<ProgressBar bind:this={progress} />
	<div class="ws-progress-label">{label}</div>
</div>
