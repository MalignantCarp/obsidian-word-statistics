<script lang="ts">
	import type { WSProjectManager } from "src/model/manager";
	import { PROJECT_CATEGORY_NAME, PROJECT_INDEX_TYPE, PROJECT_TYPE_DESCRIPTION, PROJECT_TYPE_NAME, WSProject, WSPType } from "src/model/project";
	import { onMount } from "svelte";
	import SuggestBox from "../util/SuggestBox.svelte";
	import ValidatedInput from "../util/ValidatedInput.svelte";

	export let manager: WSProjectManager;
	export let _project: WSProject = null;
	export let onClose: () => void;

	let pType: WSPType = WSPType.File;

	let projectIndex: SuggestBox;
	let projectID: ValidatedInput;
	let path: SuggestBox;
	let projTitle: HTMLInputElement;

	let categoryEl: HTMLSelectElement;
	let wordGoalFile: HTMLInputElement;
	let wordGoalProject: HTMLInputElement;
	let typeEl: HTMLSelectElement;
	let titleEl: HTMLInputElement;

	$: projectType = PROJECT_TYPE_NAME[pType];
	$: projectDesc = PROJECT_TYPE_DESCRIPTION[pType];

	const options: string[][] = [manager.collector.getAllPaths(), manager.collector.getAllFolders(), manager.collector.getAllTags()];

	$: optionPlaceholder = PROJECT_INDEX_TYPE[pType];
	$: project = _project instanceof WSProject ? _project : null;

	let title: string;

	onMount(() => {
		title = (project instanceof WSProject ? "Edit " : "New ") + "Project";
		if (project instanceof WSProject) {
			projectIndex.setInitial(project.index);
			pType = project.pType;
			projectID.setText(project.id);
			titleEl.setText(project.title);
			path.setInitial(project.path);
			categoryEl.selectedIndex = project.category;
			wordGoalProject.value = project.wordGoalForProject.toString();
			wordGoalFile.value = project.wordGoalForFiles.toString();
		}
	});

	$: canSave = validID && validIndex && validPath;
	let validID: boolean;
	let validIndex: boolean;
	let validPath: boolean;

	function onSave() {
		//manager.projectEditorCallback(type, projectName.getText(), suggestBox.getSelectedOption(), project);
		if (_project === null) {
			manager.createProject(
				pType,
				projectID.getText(),
				path.getSearchString(),
				projectIndex.getSelectedOption(),
				categoryEl.selectedIndex,
				titleEl.getText(),
				parseInt(wordGoalProject.value) || 0,
				parseInt(wordGoalFile.value) || 0
			);
		} else {
			if (_project.path != path.getSearchString()) {
				manager.setProjectPath(_project, path.getSearchString());
			}
			if (_project.id != projectID.getText()) {
				manager.setProjectID(_project, projectID.getText());
			}
			if (_project.index != projectIndex.getSelectedOption()) {
				manager.setProjectIndex(_project, projectIndex.getSelectedOption());
			}
			if (_project.category != categoryEl.selectedIndex) {
				manager.setProjectCategory(_project, categoryEl.selectedIndex);
			}
			if (_project.title != titleEl.getText()) {
				manager.setProjectTitle(_project, titleEl.getText());
			}
			let oldGoal = _project.wordGoalForProject;
			let oldFileGoal = _project.wordGoalForFiles;
			let newGoal = parseInt(wordGoalProject.value) || 0;
			let newFileGoal = parseInt(wordGoalFile.value) || 0;
			if (oldGoal != newGoal || oldFileGoal != newFileGoal) {
				manager.setProjectGoals(_project, newGoal, newFileGoal);
			}
		}
		onClose();
	}

	function onCancel() {
		onClose();
	}

	function onTypeChange() {
		if (_project instanceof WSProject) {
			console.log("Attempted to change type of existing project.");
			return;
		}
		let newType = typeEl.selectedIndex;
		if (newType != pType) {
			pType = newType;
			// do we need to go projectIndex = projectIndex or ;?
			projectIndex.resetOptions(options[pType]);
		}
	}

	function validateProjectID(id: string): [boolean, string] {
		if (project instanceof WSProject && project.id === id) {
			return [true, ""];
		}
		return manager.validateProjectID(id);
	}

	function validateProjectPath(path: string): [boolean, string] {
		if (project instanceof WSProject && project.path === path) {
			return [true, ""];
		}
		return manager.validatePath(path);
	}
</script>

<div class="ws-project-editor">
	<h2>{title}</h2>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Project Type</div>
			<div class="setting-item-description">
				Select the type of project you wish to use. <em>File Index</em> projects are indexed by Markdown file, <em>Folder</em> projects are indexed by a
				file path, and <em>Tag</em> projects are indexed by tag. Once a project has been created, its type cannot be changed.
			</div>
		</div>
		<div class="setting-item-control">
			<select class="ws-project-editor-project-type dropdown" disabled={_project instanceof WSProject} bind:this={typeEl} on:change={onTypeChange}>
				{#each PROJECT_INDEX_TYPE as piType, i}
					<option value={i} selected={i === pType}>{piType}</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Project ID</div>
			<div class="setting-item-description">
				Enter the ID of the project here. The project ID cannot be blank and must be unique. The Project ID will be used in sorting and may be
				overridden (visually) by the project's title.
			</div>
		</div>
		<svelte:component this={ValidatedInput} placeholder={"Project ID"} validate={validateProjectID} bind:this={projectID} bind:isValid={validID} />
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Project Path</div>
			<div class="setting-item-description">
				Enter the path for this project. The project path allows you to organize the hierarchy of your projects. It can be blank (root path), cannot
				begin or end with a forward-slash (/) or space, and can be as deep as you want, with each level separated by a forward-slash (/).
				<br />Example: 'Book Series/Book 1'
			</div>
		</div>
		<svelte:component
			this={SuggestBox}
			options={manager.getPathStrings()}
			placeholder={""}
			bind:this={path}
			bind:isValid={validPath}
			customValidation={validateProjectPath}
		/>
	</div>

	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">{projectType}</div>
			<div class="setting-item-description">{projectDesc}</div>
		</div>
		<svelte:component this={SuggestBox} options={options[pType]} placeholder={optionPlaceholder} bind:this={projectIndex} bind:isValid={validIndex} />
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Category</div>
			<div class="setting-item-description">Choose a category for this project. Defaults to None.</div>
		</div>
		<div class="setting-item-control">
			<select class="ws-project-editor-project-category dropdown" bind:this={categoryEl}>
				{#each PROJECT_CATEGORY_NAME as category, i}
					<option value={i} selected={i === 0}>{category}</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Title</div>
			<div class="setting-item-description">Please enter your project title. If left blank, project ID will be displayed in its place.</div>
		</div>
		<div class="setting-item-control">
			<input type="text" bind:this={titleEl} />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Word Goal For Project</div>
			<div class="setting-item-description">
				Choose a goal word count for this project (0 for no goal, max is {Intl.NumberFormat().format(1000000000)}).
			</div>
		</div>
		<div class="setting-item-control">
			<input type="number" min="0" max="1000000000" step="1000" bind:this={wordGoalProject} />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-info">
			<div class="setting-item-name">Word Goal For Files</div>
			<div class="setting-item-description">
				Choose a goal word count for each file in this project (0 for no goal, max is {Intl.NumberFormat().format(1000000)}).
				<em>A word goal specified in the file will override this goal.</em>
			</div>
		</div>
		<div class="setting-item-control">
			<input type="number" min="0" max="1000000" step="100" bind:this={wordGoalFile} />
		</div>
	</div>
	<div class="setting-item">
		<div class="setting-item-control">
			<button disabled={!canSave} on:click={onSave}>Save</button>
			<button on:click={onCancel}>Cancel</button>
		</div>
	</div>
</div>
