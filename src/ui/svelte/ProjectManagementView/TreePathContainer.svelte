<script lang="ts">
	import { WSEvents, WSPathEvent, WSProjectEvent } from "src/model/event";
	import type { WSProjectManager } from "src/model/manager";
	import type { WSPath } from "src/model/path";
	import type { WSProject } from "src/model/project";
	import { onDestroy, onMount } from "svelte";
	import PathItemButtons from "./PathItemButtons.svelte";
	import PathWordCount from "./PathWordCount.svelte";
	import ProjectItem from "./ProjectItem.svelte";
	import TreePathLabel from "./TreePathLabel.svelte";

	export let manager: WSProjectManager;
	export let path: WSPath;

	export let onDeletePath: (path: WSPath) => void;

	let childPaths: WSPath[] = [];
	let childProjects: WSProject[] = [];

	let buttons: PathItemButtons;
	let label: TreePathLabel;

	let collapsed = false;

	onMount(() => {
		manager.plugin.events.on(WSEvents.Path.Titled, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Cleared, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Set, reset, { filter: null });
		manager.plugin.events.on(WSEvents.Path.Updated, reset, { filter: null });
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
		manager.plugin.events.off(WSEvents.Path.Set, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Updated, reset, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Created, updateChildren, { filter: null });
		manager.plugin.events.off(WSEvents.Path.Deleted, updateChildren, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Created, updateProjects, { filter: null });
		manager.plugin.events.off(WSEvents.Project.Deleted, updateProjects, { filter: null });
	});

	function reset(event: WSPathEvent) {
		buttons.reset();
		label.reset();
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

	function editPath() {
		// summon a path editing modal
	}

	function onConfirmDelete(confirmed: boolean) {
		if (confirmed) {
			onDeletePath(path);
		}
	}

	function onConfirmClear(confirmed: boolean) {
		if (confirmed) {
			manager.resetPath(path.path);
		}
	}

	function pathDelete() {
		let modal = manager.modals.createConfirmationModal(`Are you sure you want to purge this path ('/${path.title}/')?`, () => {
			onConfirmDelete(modal.confirmation);
		});
		modal.open();
	}

	function pathClear() {
		let modal = manager.modals.createConfirmationModal(`Are you sure you want to reset this path ('/${path.title}/') to defaults?`, () => {
			onConfirmClear(modal.confirmation);
		});
		modal.open();
	}

	function deleteProject(project: WSProject) {
		manager.deleteProject(project);
	}

	function collapseToggle() {
		collapsed = !collapsed;
	}
</script>

<div class="ws-path-item tree-item" class:is-collapsed={collapsed}>
	<div class="ws-path-item-self tree-item-self" class:is-clickable={path != manager.pathRoot}>
		<TreePathLabel bind:this={label} {manager} {path} {collapseToggle} />
		<div class="ws-path-item-end">
			<PathWordCount {path} {manager} />
			<PathItemButtons bind:this={buttons} {manager} {path} {editPath} {pathClear} {pathDelete} />
		</div>
	</div>
	{#if !collapsed && (path.hasChildren() || path.hasProjects(manager))}
		<div class="ws-path-item-children tree-item-children">
			{#each childPaths as childPath}
				<svelte:self {manager} path={childPath} {onDeletePath} />
			{/each}
			{#each childProjects as childProject}
				<ProjectItem {manager} project={childProject} onDelete={deleteProject} />
			{/each}
		</div>
	{/if}
</div>
