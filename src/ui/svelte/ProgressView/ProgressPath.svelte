<script lang="ts">
	import type { Dispatcher } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import type { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";


	export let manager: WSProjectManager;
	export let project: WSProject;
    let paths: WSPath[] = [];
    let path: WSPath;

	let events: Dispatcher;

    onMount(() => {
        events = manager.plugin.events;
        path = manager.getPath(project.path);
        paths = manager.getAncestors(path);
    })

    onDestroy(() => {
        //
    })
</script>
<div class="ws-progress-path">

</div>