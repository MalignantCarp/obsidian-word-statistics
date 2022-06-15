<script lang="ts">
	import { WSEvents } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import { WSPath } from "src/model/path";
	import { onDestroy, onMount } from "svelte";
	import TreePathContainer from "./TreePathContainer.svelte";

	export let manager: WSProjectManager;

	let path: WSPath;

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
		path = manager.pathRoot;
	}

	function onDeletePath(path: WSPath) {
		manager.purgePath(path);
	}
</script>

<div class="ws-pm-project-tree">
	{#if path instanceof WSPath}
	<TreePathContainer {manager} {path} {onDeletePath}/>
	{/if}
</div>
