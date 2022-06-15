<script lang="ts">
	import { setIcon } from "obsidian";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";

	export let path: WSPath;
	export let manager: WSProjectManager;

	export let collapseToggle: () => void;

	let collapseIcon: HTMLElement;

	let title = path.title;
	let fullPath = path.path;

	$: if (collapseIcon) {
		collapseIcon.empty();
		setIcon(collapseIcon, "right-triangle", 12);
	}

	export function reset() {
		title = path.title;
		fullPath = path.path;
	}
</script>

{#if path != manager.pathRoot}
	<div class="ws-path-item-icon collapse-icon tree-item-icon" bind:this={collapseIcon} on:click={collapseToggle} />
{/if}
<div
	class="ws-path-item-inner"
	class:tree-item-inner={path != manager.pathRoot}
	aria-label={fullPath}
	on:click={path != manager.pathRoot ? collapseToggle : undefined}
>
	{title}
</div>
