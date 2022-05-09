<script lang="ts">
	import { setIcon } from "obsidian";
	import type { WSProjectManager } from "src/model/manager";
	import { WSPType } from "src/model/project";
	import { onMount } from "svelte";

	import { createPopperActions } from "svelte-popperjs";
	import PmProjectList from "./PMProjectList.svelte";

	const [menuPopperRef, menuPopperContent] = createPopperActions({
		placement: "bottom-start"
	});

	const [sortPopperRef, sortPopperContent] = createPopperActions({
		placement: "bottom-start"
	});

	const extraOpts = {
		modifiers: [
			{ name: "offset", options: { offset: [0, 8] } },
			{ name: "flip", options: { fallbackPlacements: ["top"] } }
		]
	};

	// Our toggle buttons
	interface ToggleButton {
		element: HTMLElement;
		on: boolean;
		type: WSPType;
	}

	let filterFile: ToggleButton = { element: null, on: true, type: WSPType.File };
	let filterFolder: ToggleButton = { element: null, on: true, type: WSPType.Folder };
	let filterTag: ToggleButton = { element: null, on: true, type: WSPType.Tag };

	let newFileIcon: HTMLElement;
	let newFolderIcon: HTMLElement;
	let newTagIcon: HTMLElement;

	let optButton: HTMLElement;
	let sortButton: HTMLElement;

	let checkmark: HTMLElement;

	let sortMenu: HTMLElement;
	let mainMenu: HTMLElement;

	let showMenu = false;
	let showSortOptions = false;
	let alphaSort = false;

	export let manager: WSProjectManager;

	onMount(() => {
		setIcon(filterFile.element, "document", 16);
		setIcon(filterFolder.element, "folder", 16);
		setIcon(filterTag.element, "price-tag-glyph", 16);
		setIcon(optButton, "plus-with-circle", 16);
		setIcon(sortButton, "up-and-down-arrows", 16);
	});

	$: if (checkmark) {
		checkmark.empty();
		setIcon(checkmark, "checkmark", 16);
	}

	$: if (newFileIcon) {
		newFileIcon.empty();
		setIcon(newFileIcon, "document", 16);
	}

	$: if (newFolderIcon) {
		newFolderIcon.empty();
		setIcon(newFolderIcon, "folder", 16);
	}

	$: if (newTagIcon) {
		newTagIcon.empty();
		setIcon(newTagIcon, "price-tag-glyph", 16);
	}

	function onClickMenu(event: MouseEvent) {
		showMenu = !showMenu;
		event.stopPropagation();
	}

	function onClickSort(event: MouseEvent) {
		showSortOptions = !showSortOptions;
		event.stopPropagation();
	}

	function onSort(sort: boolean) {
		alphaSort = sort;
		showSortOptions = false;
	}

	function newFile() {
		let modal = manager.modals.createFileProjectModal();
		modal.open();
	}

	function newFolder() {
		let modal = manager.modals.createFolderProjectModal();
		modal.open();
	}

	function newTag() {
		let modal = manager.modals.createTagProjectModal();
		modal.open();
	}

	function onPageClick(event: MouseEvent) {
		if (showSortOptions && event.target != sortMenu && !sortMenu.contains(event.target as Node)) {
			showSortOptions = false;
		}
		if (showMenu && event.target != mainMenu && !mainMenu.contains(event.target as Node)) {
			showMenu = false;
		}
	}
</script>

<svelte:body on:click={onPageClick} />
<div class="ws-project-management-view">
	<div class="nav-header">
		<div class="nav-buttons-container">
			<div class="group">
				<div
					class="nav-action-button"
					class:is-active={filterFile.on}
					aria-label="Show File Index Projects"
					bind:this={filterFile.element}
					on:click={() => (filterFile.on = !filterFile.on)}
				/>
				<div
					class="nav-action-button"
					class:is-active={filterFolder.on}
					aria-label="Show Folder Index Projects"
					bind:this={filterFolder.element}
					on:click={() => (filterFolder.on = !filterFolder.on)}
				/>
				<div
					class="nav-action-button"
					class:is-active={filterTag.on}
					aria-label="Show Tag Index Projects"
					bind:this={filterTag.element}
					on:click={() => (filterTag.on = !filterTag.on)}
				/>
			</div>
			<div class="group">
				<div class="nav-action-button" aria-label="Change Sort Order" bind:this={sortButton} use:sortPopperRef on:click={onClickSort} />
			</div>
			<div class="group">
				<div class="nav-action-button" aria-label="New Project" bind:this={optButton} use:menuPopperRef on:click={onClickMenu} />
			</div>
		</div>
	</div>
	<div class="ws-project-management-view-body">
		{#if alphaSort}
			<PmProjectList {manager} type={null} />
		{:else}
			{#each [filterFile, filterFolder, filterTag] as filter}
				{#if filter.on}
					<PmProjectList {manager} type={filter.type} />
				{/if}
			{/each}
		{/if}
	</div>
</div>
{#if showMenu}
	<div use:menuPopperContent class="ws-project-management menu" bind:this={mainMenu}>
		<div class="menu-item" on:click={newFile}>
			<div class="menu-item-icon" bind:this={newFileIcon} />
			<div class="menu-item-title">Create new File Index Project</div>
		</div>
		<div class="menu-item" on:click={newFolder}>
			<div class="menu-item-icon" bind:this={newFolderIcon} />
			<div class="menu-item-title">Create new Folder Index Project</div>
		</div>
		<div class="menu-item" on:click={newTag}>
			<div class="menu-item-icon" bind:this={newTagIcon} />
			<div class="menu-item-title">Create new Tag Index Project</div>
		</div>
	</div>
{/if}
{#if showSortOptions}
	<div use:sortPopperContent class="ws-project-management menu" bind:this={sortMenu}>
		<div class="menu-item" class:selected={alphaSort} on:click={() => onSort(true)}>
			{#if alphaSort}
				<div class="menu-item-icon" bind:this={checkmark} />
			{:else}
				<div class="menu-item-icon" />
			{/if}
			<div class="menu-item-title">Sort groups by name</div>
		</div>
		<div class="menu-item" class:selected={!alphaSort} on:click={() => onSort(false)}>
			{#if !alphaSort}
				<div class="menu-item-icon" bind:this={checkmark} />
			{:else}
				<div class="menu-item-icon" />
			{/if}
			<div class="menu-item-title">Sort groups by type, then name</div>
		</div>
	</div>
{/if}
