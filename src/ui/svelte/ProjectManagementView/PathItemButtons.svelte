<script lang="ts">
	import { setIcon } from "obsidian";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";

	export let editPath: () => void;
	export let pathClear: () => void;
	export let pathDelete: () => void;
	export let path: WSPath;
	export let manager: WSProjectManager;

	let editIcon: HTMLElement;
	let clearIcon: HTMLElement;

	let isClear = false;
	let canClear = false;
	let canPurge = false;

	$: if (editIcon) {
		editIcon.empty();
		setIcon(editIcon, "vertical-three-dots", 12);
	}

	$: if (clearIcon) {
		clearIcon.empty();
		if (canClear) {
			setIcon(clearIcon, "reset", 12);
		} else if (isClear && canPurge) {
			setIcon(clearIcon, "trash", 12);
		}
	}

	export function reset() {
		isClear = !manager.canClearPath(path);
		canClear = manager.canClearPath(path);
		canPurge = manager.canPurgePath(path);
	}
</script>

<div class="ws-path-item-buttons">
	<div class="ws-path-item-button ws-icon-edit" on:click={editPath} aria-label="Customize Path" bind:this={editIcon} />
	{#if canClear}
		<div class="ws-path-item-button ws-icon-mod" on:click={pathClear} aria-label="Reset Path" bind:this={clearIcon} />
	{:else if isClear && canPurge}
		<div class="ws-path-item-button ws-icon-delete" on:click={pathDelete} aria-label="Purge Path" bind:this={clearIcon} />
	{/if}
</div>
