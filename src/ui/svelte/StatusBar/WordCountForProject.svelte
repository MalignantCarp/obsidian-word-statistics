<script lang="ts">
	import { setIcon } from "obsidian";
	import { Dispatcher, WSEvents, WSFileEvent, WSFocusEvent, WSProjectEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
import type { WSPath } from "src/model/path";
	import { WSProject } from "src/model/project";
	import { FormatWords, GetProgressGrade } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import Tooltip from "../util/Tooltip.svelte";

	export let events: Dispatcher;
	export let manager: WSProjectManager;
	export let focus: WSFile;

	let path: WSPath = null;
	let project: WSProject = null;
	let wordCount: string = "";
	let errMessage = "";
	let projects: WSProject[] = [];
	let containerEl: HTMLElement;
	let errorEl: HTMLElement;

	let progress: HTMLElement;
	let progressData: string;

	onMount(() => {
		events.on(WSEvents.Focus.File, onFocus, { filter: null });
		events.on(WSEvents.Project.FilesUpdated, onProjectsUpdated, { filter: null });
		events.on(WSEvents.File.WordsChanged, updateCount, { filter: null });
		setIcon(containerEl, "folder", 16);
		setIcon(errorEl, "alert-triangle", 16);
		loadProjects();
		updateCount();
	});

	onDestroy(() => {
		events.off(WSEvents.Focus.File, onFocus, { filter: null });
		events.off(WSEvents.Project.FilesUpdated, onProjectsUpdated, { filter: null });
		events.off(WSEvents.File.WordsChanged, updateCount, { filter: null });
		UnregisterEvents();
	});

	function RegisterEvents() {
		events.on(WSEvents.Path.GoalsSet, updateCount, {filter: path});
	}

	function UnregisterEvents() {
		events.off(WSEvents.Path.GoalsSet, updateCount, {filter: path});
	}

	function loadProjects() {
		UnregisterEvents();
		if (focus instanceof WSFile) {
			projects = manager.getProjectsByFile(focus);
			if (projects.length > 1) {
				errMessage = `File in ${projects.length} project${projects.length == 1 ? "" : "s"}`;
				path = null;
				project = null;
			} else if (projects.length === 0) {
				errMessage = "";
				path = null;
				project = null;
			} else {
				project = projects[0];
				path = manager.getPath(project.path);
				RegisterEvents();
				errMessage = "";
			}
		} else {
			project = null;
			projects = [];
		}
	}

	function onProjectsUpdated(event: WSProjectEvent) {
		loadProjects();
		updateCount();
	}

	function onFocus(event: WSFocusEvent) {
		focus = event.info.file;
		loadProjects();
		updateCount();
	}

	function updateCount(event?: WSFileEvent) {
		if (project instanceof WSProject) {
			let words = project.totalWords;
			wordCount = FormatWords(words);
			let goal = manager.getWordGoalForProjectByContext(project);
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

<div class="ws-sb-counter-project">
	<div class="ws-sb-icon" bind:this={containerEl} />
	<div class="ws-sb-icon error" bind:this={errorEl} class:hidden={!errMessage} />
	{#if project instanceof WSProject}
		<div class="ws-sb-count-project">{wordCount}</div>
	{/if}
	{#if projects.length > 1}
		<Tooltip>
			<div slot="content" class="ws-sb-count-project error">{errMessage}</div>
			<div slot="tooltip" class="ws-sb-tooltip">
				<ul class="ws-sb-tooltip-list">
					{#each projects as project}
						<li>{project.title}</li>
					{/each}
				</ul>
			</div>
		</Tooltip>
	{/if}
	<div class="ws-word-progress" data-progress={progressData} bind:this={progress} />
</div>
