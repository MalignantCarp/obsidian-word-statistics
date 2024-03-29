<script lang="ts">
	import { DateTime } from "luxon";
	import type { WSFileStat } from "src/model/file";
	import { WordStats } from "src/model/stats";
	import { FormatNumber, FormatWords, MillisecondsToReadableDuration } from "src/util";
	import { onMount } from "svelte";

	export let stats: WSFileStat[];

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
		Update(stats);
	});

	export function Update(newStats: WSFileStat[]) {
        stats = newStats;
		startDate = DateTime.fromMillis(WordStats.GetStartTime(stats));
		endDate = DateTime.fromMillis(WordStats.GetEndTime(stats));
		startWords = WordStats.GetStartWords(stats);
		endWords = WordStats.GetEndWords(stats);
		duration = WordStats.GetDuration(stats);
		netWords = WordStats.GetNetWords(stats);

		wordsAdded = WordStats.GetWordsAdded(stats);
		wordsDeleted = WordStats.GetWordsDeleted(stats);
		wordsImported = WordStats.GetWordsImported(stats);
		wordsExported = WordStats.GetWordsExported(stats);
		writingTime = WordStats.GetWritingTime(stats);

		WPM = Math.round(((netWords / (duration / 60000)) + Number.EPSILON) * 100) / 100;
		WAPM = Math.round(((wordsAdded / (duration / 60000)) + Number.EPSILON) * 100) / 100

		WPMA = Math.round(((netWords / (writingTime / 60000)) + Number.EPSILON) * 100) / 100;
		WAPMA = Math.round(((wordsAdded / (writingTime / 60000)) + Number.EPSILON) * 100) / 100
	}

	$: okay =
		stats.length > 0 && startDate instanceof DateTime;
</script>

{#if okay}
	<div class="ws-day-stats">
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
		<div class="value">{`${FormatNumber(WPM)} wpm`}</div>
		<div class="heading">WAPM</div>
		<div class="value">{`${FormatNumber(WAPM)} wapm`}</div>
	</div>
{/if}
