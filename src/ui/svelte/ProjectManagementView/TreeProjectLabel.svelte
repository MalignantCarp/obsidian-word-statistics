<script lang="ts">
	import { WSEvent, WSEvents } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";

	export let project: WSProject;
	export let manager: WSProjectManager;

	let title = project.title;
	let fullPath = project.path + "/" + project.id;

	function reset() {
		title = project.title;
		fullPath = project.path + "/" + project.id;
	}

	onMount(() => {
		manager.plugin.events.on(WSEvents.Project.Renamed, reset, { filter: project });
		manager.plugin.events.on(WSEvents.Project.PathSet, reset, { filter: project });
		manager.plugin.events.on(WSEvents.Project.TitleSet, reset, { filter: project });
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.Project.Renamed, reset, { filter: project });
		manager.plugin.events.off(WSEvents.Project.PathSet, reset, { filter: project });
		manager.plugin.events.off(WSEvents.Project.TitleSet, reset, { filter: project });
	});

</script>

<div class="ws-project-item-inner tree-item-inner" aria-label={fullPath}>
	{title}
</div>
