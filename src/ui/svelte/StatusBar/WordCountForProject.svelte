<script lang="ts">
	import { setIcon } from "obsidian";
	import { Dispatcher, WSEvents, WSFileEvent, WSFocusEvent, WSProjectEvent } from "src/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";
	import Tooltip from "../util/Tooltip.svelte";

	export let events: Dispatcher;
	export let manager: WSProjectManager;

	let project: WSProject;
	let wordCount: string = "";
	let monitoring: boolean = false;
	let errMessage = "";
	let projects: WSProject[] = [];
	let containerEl: HTMLElement;
	let errorEl: HTMLElement;
	let focus: WSFile;

	onMount(() => {
		registerEvents();
		events.on(WSEvents.Focus.File, onFocus, { filter: null });
		events.on(WSEvents.Project.FilesUpdated, onProjectsUpdated, { filter: null });
		setIcon(containerEl, "folder", 16);
		setIcon(errorEl, "alert-triangle", 16);
	});

	onDestroy(() => {
		unregisterEvents();
		events.off(WSEvents.Focus.File, onFocus, { filter: null });
		events.off(WSEvents.Project.FilesUpdated, onProjectsUpdated, { filter: null });
	});

	function onProjectsUpdated(event: WSProjectEvent) {
		unregisterEvents();
		projects = manager.getProjectsByFile(focus);
		if (projects.length > 1) {
			errMessage = `File in ${projects.length} project${projects.length == 1 ? "" : "s"}`;
			project = null;
		} else if (projects.length === 0) {
			errMessage = "";
			project = null;
		} else {
			project = projects[0];
			errMessage = "";
		}
		registerEvents();
		updateCount();
	}

	function onFocus(event: WSFocusEvent) {
		focus = event.info.file;
		unregisterEvents();
		if (focus instanceof WSFile) {
			projects = manager.getProjectsByFile(focus);
			if (projects.length > 1) {
				errMessage = `File in ${projects.length} project${projects.length == 1 ? "" : "s"}`;
				project = null;
			} else if (projects.length === 0) {
				errMessage = "";
				project = null;
			} else {
				project = projects[0];
				errMessage = "";
			}
		} else {
			project = null;
		}
		registerEvents();
		updateCount();
	}

	function registerEvents() {
		if (!monitoring && project instanceof WSProject) {
			events.on(WSEvents.File.WordsChanged, updateCount, { filter: null });
			monitoring = true;
		}
	}

	function unregisterEvents() {
		if (monitoring) {
			events.off(WSEvents.File.WordsChanged, updateCount, { filter: null });
			monitoring = false;
			wordCount = "";
		}
	}

	function updateCount(event?: WSFileEvent) {
		if (project instanceof WSProject) {
			let words = project.totalWords;
			wordCount = Intl.NumberFormat().format(words) + " " + (words == 1 ? "word" : "words");
		}
	}
</script>

<div class="ws-sb-counter-project">
	<div class="ws-sb-icon" bind:this={containerEl} class:hidden={errMessage || !monitoring} />
	<div class="ws-sb-icon-error" bind:this={errorEl} class:hidden={!errMessage} />
	{#if !errMessage && monitoring}
		<div class="ws-sb-count-project">{wordCount}</div>
	{/if}
	{#if errMessage}
		<Tooltip>
			<div slot="content" class="ws-sb-count-project error">{errMessage}</div>
			<div slot="tooltip" class="ws-sb-tooltip">
				<ul class="ws-sb-tooltip-list">
					{#each projects as project}
						<li>{project.name}</li>
					{/each}
				</ul>
			</div>
		</Tooltip>
	{/if}
</div>
