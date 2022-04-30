<script lang="ts">
	import { Dispatcher, WSEvents, WSFileEvent, WSFocusEvent } from "src/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";
	import Tooltip from "./Tooltip.svelte";

	export let events: Dispatcher;
	export let manager: WSProjectManager;

	let project: WSProject;
	let wordCount: string = "";
	let monitoring: boolean = false;
	let errMessage = "";
	let projects: WSProject[] = [];

	onMount(() => {
		registerEvents();
		events.on(WSEvents.Focus.File, onFocus, { filter: null });
	});

	onDestroy(() => {
		unregisterEvents();
		events.off(WSEvents.Focus.File, onFocus, { filter: null });
	});

	function onFocus(event: WSFocusEvent) {
		let file = event.info.file;
		unregisterEvents();
		if (file instanceof WSFile) {
			projects = manager.getProjectsByFile(file);
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

{#if errMessage}
	<Tooltip>
		<div slot="content" class="ws-sb-project-counter">
			{#if monitoring}<span class="ws-sb-project">{wordCount}</span>{:else if errMessage}<span class="ws-sb-error"><span class="ws-sb-error-sym" />{errMessage}</span>{/if}
		</div>
		<div class="ws-sb-tooltip" slot="tooltip">
			<ul class="ws-sb-tooltip-list">
				{#each projects as project}
					<li>{project.name}</li>
				{/each}
			</ul>
		</div>
	</Tooltip>
{:else}
	<div class="ws-project-counter">
		{#if monitoring}<span class="ws-sb-project">{wordCount}</span>{/if}
	</div>
{/if}
