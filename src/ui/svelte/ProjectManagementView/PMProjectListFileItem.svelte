<script lang="ts">
	import { WSEvents, WSFocusEvent } from "src/event";
	import type { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { WSFileProject, WSProject } from "src/model/project";
	import { FormatWordsNumOnly } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;
	export let file: WSFile;

	export let onWordCountUpdate: () => void;

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
		onWordCountUpdate();
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

	function onMouseEnter() {
		manager.plugin.events.trigger(new WSFocusEvent({ type: WSEvents.Focus.FileItem, file }, { filter: null }));
	}

	function onMouseLeave() {
		manager.plugin.events.trigger(new WSFocusEvent({ type: WSEvents.Focus.FileItem, file: null }, { filter: null }));
	}
</script>

<tr class="ws-pm-file-item" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
	<td class="ws-pm-file-item-name">{title}</td>
	<td class="ws-pm-file-item-word-count">{FormatWordsNumOnly(file.words)}</td>
</tr>
