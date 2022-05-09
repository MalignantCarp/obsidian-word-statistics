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
	<div class="ws-project-edit-panel-header">
		<h3>{name}</h3>
		<div class="ws-project-edit-description">{description}</div>
		<button on:click={onClick}>New Project</button>
	</div>
	<hr />
	<ProjectEditList {manager} {getProjectList} />
</div>
