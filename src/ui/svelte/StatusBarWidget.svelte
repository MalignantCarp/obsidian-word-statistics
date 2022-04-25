<script lang="ts">
	import type { Dispatcher } from "src/event";
	import type { WSDataCollector } from "src/model/collector";
	import type { WSProjectManager } from "src/model/manager";
	import WordCountForFile from "./WordCountForFile.svelte";
	import WordCountForProject from "./WordCountForProject.svelte";
	import WordCountForVault from "./WordCountForVault.svelte";

	export let eventDispatcher: Dispatcher;
	export let dataCollector: WSDataCollector;
	export let projectManager: WSProjectManager;

    let wcFile: WordCountForFile;

    export function getWatchFile() {
        return wcFile.getWatchFile();
    }

</script>

<div class="ws-status-bar">
	<WordCountForFile bind:this={wcFile} events={eventDispatcher} />
	<WordCountForProject events={eventDispatcher} manager={projectManager} />
	<WordCountForVault events={eventDispatcher} collector={dataCollector} />
</div>
