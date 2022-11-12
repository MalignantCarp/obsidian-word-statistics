<script lang="ts">
	import type { WSFolder } from "src/model/folder";
	import { onMount } from "svelte";
	import SettingItem from "./SettingItem.svelte";

	export let folder: WSFolder;

	let wordGoal: number;
	let wordGoalForFiles: number;
	let wordGoalForFolders: number;

	onMount(() => {
		wordGoal = folder.wordGoal;
		wordGoalForFiles = folder.wordGoalForFiles;
		wordGoalForFolders = folder.wordGoalForFolders;
	});

	export function getWordGoals(): [number, number, number] {
		return [wordGoal, wordGoalForFiles, wordGoalForFolders];
	}

	export function clear() {
		wordGoal = 0;
		wordGoalForFiles = 0;
		wordGoalForFolders = 0;
	}

</script>

<div class="ws-word-goals">
	<SettingItem
		name={`Word Goals for ${folder.getTitle()}`}
		desc={`Set word goals for this folder, folders contained within this folder (and their descendents), and files contained within this folder. To remove a goal, set it to 0.`}
		itemClass="setting-item-heading"
	/>
	<SettingItem name="Word Goal" desc="Set a word goal for this folder.">
		<input
			type="number"
			bind:value={wordGoal}
			min="0"
			max="1000000000"
			step="100"
		/>
	</SettingItem>
	<SettingItem
		name="Word Goal For Folders"
		desc="Set a word goal for folders within this folder (that do not have their own goal set)."
	>
		<input
			type="number"
			bind:value={wordGoalForFolders}
			min="0"
			max="1000000000"
			step="100"
		/>
	</SettingItem>
	<SettingItem
		name="Word Goal For Files"
		desc="Set a word goal for files within this folder (that do not have their own goal set)."
	>
		<input
			type="number"
			bind:value={wordGoalForFiles}
			min="0"
			max="1000000000"
			step="50"
		/>
	</SettingItem>
</div>
