<script lang="ts">
	import { WSEvents } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import { WSPath } from "src/model/path";
	import { onDestroy, onMount } from "svelte";
	import PmProjectTreePathItem from "./PMProjectTreePathItem.svelte";

	export let manager: WSProjectManager;

	let paths: WSPath[] = [];

	onMount(() => {
		resetPaths();
		manager.plugin.events.on(WSEvents.Path.Deleted, resetPaths, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Created, resetPaths, { filter: null });
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.Path.Deleted, resetPaths, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Created, resetPaths, { filter: null });
	});

	function resetPaths() {
		paths = [];
		if (manager.pathRoot instanceof WSPath) {
			paths.push(manager.pathRoot);
		}
		//paths.push(...manager.getPaths());
		paths = paths;
	}

	function onDeletePath(path: WSPath) {
		manager.purgePath(path);
	}
</script>

<div class="ws-pm-project-tree">
	{#each paths as path}
		<PmProjectTreePathItem {manager} {path} {onDeletePath}/>
	{/each}
</div>
