<script lang="ts">
	import { WSEvents } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSProject } from "src/model/project";
	import { FormatWords } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;
    export let onWordCountUpdate:(count:number) => void = null;

	let wordCount = "";

	onMount(() => {
		manager.plugin.events.on(WSEvents.File.WordsChanged, updateWords, { filter: null });
		manager.plugin.events.on(WSEvents.Project.FilesUpdated, updateWords, { filter: project });
		manager.plugin.events.on(WSEvents.Project.IndexSet, updateWords, { filter: project });
		// need to watch both project and path for word goals, as those could potentially apply to project
		manager.plugin.events.on(WSEvents.Project.GoalsSet, updateWords, {filter: null});
		manager.plugin.events.on(WSEvents.Path.GoalsSet, updateWords, {filter: null});
		updateWords();
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.File.WordsChanged, updateWords, { filter: null });
		manager.plugin.events.off(WSEvents.Project.FilesUpdated, updateWords, { filter: project });
		manager.plugin.events.off(WSEvents.Project.IndexSet, updateWords, { filter: project });
		manager.plugin.events.off(WSEvents.Project.GoalsSet, updateWords, {filter: null});
		manager.plugin.events.off(WSEvents.Path.GoalsSet, updateWords, {filter: null});
	});

	function updateWords() {
        let words = project.totalWords;
		wordCount = FormatWords(words);
        if (onWordCountUpdate) {
            onWordCountUpdate(words);
        }
	}
</script>

<div class="ws-project-word-count">{wordCount}</div>
