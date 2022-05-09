<script lang="ts">
	import { WSEvents } from "src/event";
	import type { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSFileProject, WSProject } from "src/model/project";
	import { FormatWordsNumOnly } from "src/util";
	import { onDestroy, onMount } from "svelte";
	import { createPopperActions } from "svelte-popperjs";

	export let project: WSProject;
	export let manager: WSProjectManager;
	export let file: WSFile;

	const [popperRef, popperContent] = createPopperActions({
		placement: "top",
		strategy: "absolute"
	});

	let showInfo = false;

	function RegisterEvents() {
		manager.plugin.events.on(WSEvents.File.Renamed, onRename, { filter: file });
		manager.plugin.events.on(WSEvents.File.WordsChanged, onWords, { filter: file });
	}

	function UnregisterEvents() {
		manager.plugin.events.off(WSEvents.File.Renamed, onRename, { filter: file });
		manager.plugin.events.off(WSEvents.File.WordsChanged, onWords, { filter: file });
	}

	function onRename() {
		file = file;
	}

	function onWords() {
		file = file;
	}

	function getTitle() {
		if (project instanceof WSFileProject && manager.plugin.settings.useDisplayText) {
			return project.file.getLinkTitle(file);
		}
		return file.title;
	}

	onMount(() => {
		RegisterEvents();
	});

	onDestroy(() => {
		UnregisterEvents();
	});

	$: title = getTitle();
</script>

<tr class="ws-pm-file-item">
	<td class="ws-pm-file-item-name" use:popperRef on:mouseenter={() => (showInfo = true)} on:mouseleave={() => (showInfo = false)}>
		{title}
		{#if showInfo}
			<div class="ws-pm-file-info tooltip mod-top" use:popperContent>
				{file.path}
				<div class="tooltip-arrow" />
			</div>
		{/if}
	</td>
	<td class="ws-pm-file-item-word-count">{FormatWordsNumOnly(file.words)}</td>
</tr>
