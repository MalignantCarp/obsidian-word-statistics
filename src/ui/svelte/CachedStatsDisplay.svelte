<script lang="ts">
	import { DateTime } from "luxon";
	import { StatsPropagate } from "src/model/stats";
	import { FormatWords, MillisecondsToReadableDuration } from "src/util";
	import { onMount } from "svelte";

	export let updateObject: StatsPropagate;

	let okay = false;

	let startDate: DateTime;
	let endDate: DateTime;

	let duration: number;
	let netWords: number;

	let startWords: number;
	let endWords: number;

	let wordsAdded: number;
	let wordsDeleted: number;
	let wordsImported: number;
	let wordsExported: number;
	let writingTime: number;

	let WPM: number;
	let WPMA: number;
	let WAPM: number;
	let WAPMA: number;

	onMount(() => {
		Update(updateObject);
	});

	export function Update(object: StatsPropagate) {
		updateObject = object;
		startDate = DateTime.fromMillis(object.startTime);
		endDate = DateTime.fromMillis(object.endTime);
		startWords = object.startWords;
		endWords = object.endWords;
		duration = object.duration;
		netWords = object.netWords;

		wordsAdded = object.wordsAdded;
		wordsDeleted = object.wordsDeleted;
		wordsImported = object.wordsImported;
		wordsExported = object.wordsExported;
		writingTime = object.writingTime;

		WPM = Math.round(((netWords / (duration / 60000)) + Number.EPSILON) * 100) / 100;
		WAPM = Math.round(((wordsAdded / (duration / 60000)) + Number.EPSILON) * 100) / 100

		WPMA = Math.round(((netWords / (writingTime / 60000)) + Number.EPSILON) * 100) / 100;
		WAPMA = Math.round(((wordsAdded / (writingTime / 60000)) + Number.EPSILON) * 100) / 100
	}

	$: okay =
		updateObject instanceof StatsPropagate && startDate instanceof DateTime && updateObject.startTime > 0;
</script>

{#if okay}
	<div class="ws-progress-stats">
		<div class="heading">Start Time</div>
		<div class="value">
			{startDate?.toLocaleString(DateTime.DATETIME_SHORT)}
		</div>
		<div class="heading">End Time</div>
		<div class="value">
			{endDate?.toLocaleString(DateTime.DATETIME_SHORT)}
		</div>
		<div class="heading">Duration</div>
		<div class="value">{MillisecondsToReadableDuration(duration)}</div>
		<div class="heading">Writing Time</div>
		<div class="value">{MillisecondsToReadableDuration(writingTime)}</div>
		<div class="heading">Start Words</div>
		<div class="value">{FormatWords(startWords)}</div>
		<div class="heading">End Words</div>
		<div class="value">{FormatWords(endWords)}</div>
		<div class="heading">Net Words</div>
		<div class="value">{FormatWords(netWords)}</div>
		<div class="heading">Words Added</div>
		<div class="value">{FormatWords(wordsAdded)}</div>
		<div class="heading">Words Deleted</div>
		<div class="value">{FormatWords(wordsDeleted)}</div>
		<div class="heading">Words Imported</div>
		<div class="value">{FormatWords(wordsImported)}</div>
		<div class="heading">Words Exported</div>
		<div class="value">{FormatWords(wordsExported)}</div>
		<div class="heading">WPM</div>
		<div class="value">{FormatWords(WPM)}</div>
		<div class="heading">WAPM</div>
		<div class="value">{FormatWords(WAPM)}</div>
	</div>
{/if}
