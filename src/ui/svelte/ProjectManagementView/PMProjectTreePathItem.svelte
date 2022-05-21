<script lang="ts">
import { WSEvents } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
    import type { WSPath } from "src/model/project";
    import { onDestroy, onMount } from "svelte";

    export let manager: WSProjectManager;
    export let path: WSPath;
    
    let title = path.title;
    let fullPath = path.path;

	onMount(() => {
        manager.plugin.events.on(WSEvents.Path.Titled, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Cleared, reset, { filter: null });
	});

	onDestroy(() => {
        manager.plugin.events.off(WSEvents.Path.Titled, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Cleared, reset, { filter: null });
	});

    function reset() {
        title = path.title;
        fullPath = path.path;
    }

</script>
