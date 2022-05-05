<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import ProjectEditPanel from "./ProjectEditPanel.svelte";
	import { WSPType } from "src/model/project";
	import { onMount } from "svelte";
	import { setIcon } from "obsidian";

	export let manager: WSProjectManager;
	export let showHeader: boolean = true;

	let fileButton: HTMLElement;
	let folderButton: HTMLElement;
	let tagButton: HTMLElement;

	let tab: WSPType = WSPType.File;

	onMount(() => {
		setIcon(fileButton, "document", 16);
		setIcon(folderButton, "folder", 16);
		setIcon(tagButton, "price-tag-glyph", 16);
	});

	function focus(x: WSPType) {
		tab = x;
	}
</script>

<div class="ws-project-manager">
	{#if showHeader}<h2>Project Manager</h2>{/if}
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div class="nav-action-button" class:is-active={tab === WSPType.File} aria-label="File Index Projects" bind:this={fileButton} on:click={() => focus(WSPType.File)} />
			<div class="nav-action-button" class:is-active={tab === WSPType.Folder} aria-label="Folder Projects" bind:this={folderButton} on:click={() => focus(WSPType.Folder)} />
			<div class="nav-action-button" class:is-active={tab === WSPType.Tag} aria-label="Tag Projects" bind:this={tagButton} on:click={() => focus(WSPType.Tag)} />
		</div>
	</div>
	{#if tab === WSPType.File}
		<ProjectEditPanel type={WSPType.File} {manager} getProjectList={manager.getFileProjects.bind(manager)} />
	{:else if tab === WSPType.Folder}
		<ProjectEditPanel type={WSPType.Folder} {manager} getProjectList={manager.getFolderProjects.bind(manager)} />
	{:else if tab === WSPType.Tag}
		<ProjectEditPanel type={WSPType.Tag} {manager} getProjectList={manager.getTagProjects.bind(manager)} />
	{/if}
</div>
