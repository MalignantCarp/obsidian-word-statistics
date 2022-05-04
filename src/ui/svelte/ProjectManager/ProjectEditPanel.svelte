<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import { PROJECT_TYPE_DESCRIPTION, PROJECT_TYPE_NAME_PLURAL, WSProject, WSPType } from "src/model/project";
	import ProjectEditList from "./ProjectEditList.svelte";

	export let manager: WSProjectManager;
	export let type: WSPType;

	export let getProjectList: () => WSProject[];

	const name = PROJECT_TYPE_NAME_PLURAL[type];
	const description = PROJECT_TYPE_DESCRIPTION[type];

	function onClick() {
		let modal = manager.modals.createModalFromType(type);
		modal.open();
	}
</script>

<div class="ws-project-edit-panel">
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{name}</div>
			<div class="setting-item-description">{description}</div>
		</div>
		<div class="setting-item-control">
			<button on:click={onClick}>New Project</button>
		</div>
	</div>
	<ProjectEditList {manager} {getProjectList} />
</div>
