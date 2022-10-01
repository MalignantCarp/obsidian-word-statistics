<script lang="ts">
	import { WSEvents, WSFocusEvent } from "src/model/event";
	import { WSFile } from "src/model/file";
	import type { WSProjectManager } from "src/model/manager";
	import { onDestroy, onMount } from "svelte";
	import ProgressPanel from "./ProgressPanel.svelte";

	export let manager: WSProjectManager;
	export let events = manager.plugin.events;

	let panel: ProgressPanel;

	let focus: WSFile;

	let okay = false;

	onMount(() => {
		events.on(WSEvents.Focus.File, onFocus, { filter: null });
		focus = manager.plugin.focusFile;
	});

	onDestroy(() => {
		events.off(WSEvents.Focus.File, onFocus, { filter: null });
	});

	function onFocus(event: WSFocusEvent) {
		focus = event.info.file;
	}

	$: if (focus instanceof WSFile) {
		okay = true;
	}

	$: if (focus instanceof WSFile)	{
		panel?.FocusFile(focus);
		panel?.updateProject();
		panel?.updateAll();
	}
</script>

{#if okay}
	<ProgressPanel {manager} file={focus} bind:this={panel} />
{/if}
