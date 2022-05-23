<script lang="ts">
	import { setIcon } from "obsidian";
	import { WSEvents, WSPathEvent, WSProjectEvent } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import type { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";
	import PmProjectTreeProjectItem from "./PMProjectTreeProjectItem.svelte";

	export let manager: WSProjectManager;
	export let path: WSPath;

	let title = path.title;
	let fullPath = path.path;
	let collapsed = false;

	let editIcon: HTMLElement;
	let clearIcon: HTMLElement;
	let collapseIcon: HTMLElement;

	let childPaths: WSPath[] = [];
	let childProjects: WSProject[] = [];

	$: if (collapseIcon) {
		collapseIcon.empty();
		setIcon(collapseIcon, "right-triangle", 12);
	}

	$: if (editIcon) {
		editIcon.empty();
		setIcon(editIcon, "vertical-three-dots", 12);
	}

	$: if (clearIcon) {
		clearIcon.empty();
		setIcon(clearIcon, "reset", 12);
	}

	onMount(() => {
		manager.plugin.events.on(WSEvents.Path.Titled, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Cleared, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Created, updateChildren, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Deleted, updateChildren, { filter: null });
		manager.plugin.events.on(WSEvents.Project.Created, updateProjects, { filter: null });
		manager.plugin.events.on(WSEvents.Project.Deleted, updateProjects, { filter: null });
		childPaths = path.getChildren();
		childProjects = manager.getProjectsByExactPath(path.path);
	});

	onDestroy(() => {
		manager.plugin.events.off(WSEvents.Path.Titled, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Cleared, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Created, updateChildren, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Deleted, updateChildren, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Created, updateProjects, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Deleted, updateProjects, { filter: null });
	});

	function reset(event: WSPathEvent) {
		title = path.title;
		fullPath = path.path;
	}

	function updateProjects(event: WSProjectEvent) {
		// we only need to update our projects if this project is a direct children
		if (event.info.project.path === path.path) {
			childProjects = manager.getProjectsByExactPath(path.path);
		}
	}

	function updateChildren(event: WSPathEvent) {
		// we only need to update our path children if the created or deleted path is a direct child
		if (path.hasChild(event.info.path)) {
			childPaths = path.getChildren();
		}
	}

	function collapseToggle() {
		if (manager.plugin.settings.viewSettings.treeView) {
			collapsed = !collapsed;
		}
	}

	function editPath() {}

	function clearPath() {}

	function deleteProject(project: WSProject) {
		manager.deleteProject(project);
	}
</script>

{#if path === manager.pathRoot}
	<div class="ws-path-item-root">
		<div class="ws-path-item-children" class:tree-item-children={manager.plugin.settings.viewSettings.treeView}>
			{#each childPaths as childPath}
				<svelte:self {manager} path={childPath} />
			{/each}
			{#each childProjects as childProject}
				<PmProjectTreeProjectItem {manager} project={childProject} onDelete={deleteProject} />
			{/each}
		</div>
	</div>
{:else}
	<div class="ws-path-item" class:is-collapsed={collapsed} class:tree-item={manager.plugin.settings.viewSettings.treeView}>
		<div class="ws-path-item-self is-clickable" class:tree-item-self={manager.plugin.settings.viewSettings.treeView}>
			{#if manager.plugin.settings.viewSettings.treeView}
				<div class="ws-path-item-icon collapse-icon tree-item-icon" bind:this={collapseIcon} on:click={collapseToggle} />
				<div class="ws-path-item-inner tree-item-inner" aria-label={fullPath} on:click={collapseToggle}>
					{title}
				</div>
			{:else}
				<div class="ws-path-item-inner" aria-label={fullPath}>
					{title}
				</div>
			{/if}
			<div class="ws-path-item-buttons">
				<div class="ws-path-item-edit-button" on:click={editPath} aria-label="Customize Path" bind:this={editIcon} />
				<div class="ws-path-item-clear-button" on:click={clearPath} aria-label="Clear Path" bind:this={clearIcon} />
			</div>
		</div>
		{#if !collapsed && (path.hasChildren() || path.hasProjects(manager))}
			<div class="ws-path-item-children" class:tree-item-children={manager.plugin.settings.viewSettings.treeView}>
				{#each childPaths as childPath}
					<svelte:self {manager} path={childPath} />
				{/each}
				{#each childProjects as childProject}
					<PmProjectTreeProjectItem {manager} project={childProject} onDelete={deleteProject} />
				{/each}
			</div>
		{/if}
	</div>
{/if}
