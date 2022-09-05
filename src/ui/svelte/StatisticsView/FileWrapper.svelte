<script lang="ts">
	import { setIcon } from "obsidian";

	import type { IFileStat, IFileWrapper } from "src/model/statistics";
	import { onDestroy, onMount } from "svelte";
	import FileStat from "./FileStat.svelte";

	export let wrapper: IFileWrapper;
	let stat: IFileStat;

	let open: boolean = false;

	let collapseIcon: HTMLElement;

	$: if (collapseIcon) {
		collapseIcon.empty();
		setIcon(collapseIcon, "right-triangle", 12);
	}

	onMount(() => {
		stat = wrapper.stats;
	});

	onDestroy(() => {});

	export function update() {
		wrapper = wrapper;
		stat = wrapper.stats;
	}

	function collapseToggle() {
		open = !open;
	}
</script>

<div class="ws-sv-wrapper">
	<div class="ws-sv-wrapper-file">
		<div class="collapse-icon tree-item-icon" bind:this={collapseIcon} on:click={collapseToggle} />
		<div class="ws-sv-file-title">{wrapper.file.title}</div>
	</div>
	{#if open}
		<div>{wrapper.file.path}</div>
		<FileStat {stat} />
	{/if}
</div>
