<script lang="ts">
	import { setIcon } from "obsidian";
	import { Dispatcher, WSEvents, WSFileEvent, WSFocusEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSProject } from "src/model/project";
	import { GetProgressGrade } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let events: Dispatcher;

	export let file: WSFile = null;
	export let manager: WSProjectManager;
	let wordCount: string = "";
	let containerEl: HTMLElement;

	let progress: HTMLElement;
	let progressData: string;

	let project: WSProject = null;

	onMount(() => {
		registerEvents();
		events.on(WSEvents.Focus.File, updateFile, { filter: null });
		setIcon(containerEl, "document", 16);
		updateProject();
		updateCount();
	});

	onDestroy(() => {
		unregisterEvents();
		events.off(WSEvents.Focus.File, updateFile, { filter: null });
	});

	function updateFile(event: WSFocusEvent) {
		unregisterEvents();
		file = event.info.file;
		updateProject();
		registerEvents();
		updateCount();
	}

	function updateProject() {
		if (file instanceof WSFile) {
			let projects = manager.getProjectsByFile(file);
			if (projects.length === 1) {
				project = projects[0];
			} else {
				project = null;
			}
		}
	}

	export function getWatchFile() {
		return file;
	}

	function registerEvents() {
		events.on(WSEvents.File.WordsChanged, updateCount, { filter: file });
		events.on(WSEvents.Project.GoalsSet, updateCount, { filter: null });
		events.on(WSEvents.Path.GoalsSet, updateCount, { filter: null });
	}

	function unregisterEvents() {
		events.off(WSEvents.File.WordsChanged, updateCount, { filter: file });
		events.off(WSEvents.Project.GoalsSet, updateCount, { filter: null });
		events.off(WSEvents.Path.GoalsSet, updateCount, { filter: null });
	}

	function updateCount(event?: WSFileEvent) {
		if (file instanceof WSFile) {
			let words = event?.info.words | file.totalWords;
			wordCount = Intl.NumberFormat().format(words) + " " + (words == 1 ? "word" : "words");
			let goal = manager.getWordGoalForFileByContext(file, project);
			if (goal) {
				let percent = Math.round((words / goal) * 100);
				percent = percent > 100 ? 100 : percent < 0 ? 0 : percent;
				progressData = GetProgressGrade(percent);
				progress.style.width = percent.toString() + "%";
			} else {
				progressData = "0";
				progress.style.width = "0";
			}
		}
	}
</script>

<div class="ws-sb-counter-file">
	<div class="ws-sb-icon" bind:this={containerEl} />
	<div class="ws-sb-count-file">{wordCount}</div>
	<div class="ws-word-progress" data-progress={progressData} bind:this={progress} />
</div>
