<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import ProjectEditPanel from "./ProjectEditPanel.svelte";
	import { WSPType } from "src/model/project";

	export let manager: WSProjectManager;
</script>

<div class="ws-project-manager">
	<ProjectEditPanel type={WSPType.File} {manager} getProjectList={manager.getFileProjects.bind(manager)} />
	<hr />
	<ProjectEditPanel type={WSPType.Folder} {manager} getProjectList={manager.getFolderProjects.bind(manager)} />
	<hr />
	<ProjectEditPanel type={WSPType.Tag} {manager} getProjectList={manager.getFolderProjects.bind(manager)} />
</div>
