<script lang="ts">
	import type { IFileStat } from "src/model/statistics";
	import { FormatWords, SecondsToHMS } from "src/util";
	import { DateTime } from "luxon";

	export let stat: IFileStat;

	export function update() {
		stat = stat;
	}
</script>

<div class="ws-sv-file-stat ws-sv-stats">
	<div>Start Time:</div>
	<div class="ws-sv-value">{DateTime.fromMillis(stat.timeStart).toLocaleString(DateTime.DATETIME_SHORT)}</div>
	<div>End Time:</div>
	<div class="ws-sv-value">{DateTime.fromMillis(stat.timeEnd).toLocaleString(DateTime.DATETIME_SHORT)}</div>
	<div>Start Words:</div>
	<div class="ws-sv-value">{FormatWords(stat.wordsStart)}</div>
	<div>End Words:</div>
	<div class="ws-sv-value">{FormatWords(stat.wordsEnd)}</div>
	<div>Words Added:</div>
	<div class="ws-sv-value">{FormatWords(stat.wordsAdded)}</div>
	<div>Words Deleted:</div>
	<div class="ws-sv-value">{FormatWords(stat.wordsDeleted)}</div>
	<div>Words Imported:</div>
	<div class="ws-sv-value">{FormatWords(stat.wordsImported)}</div>
	<div>Words Exported:</div>
	<div class="ws-sv-value">{FormatWords(stat.wordsExported)}</div>
	<div>Last Word At:</div>
	<div class="ws-sv-value">{DateTime.fromMillis(stat.wordsUpdatedAt).toLocaleString(DateTime.DATETIME_SHORT)}</div>
	<div>Writing Time:</div>
	<div class="ws-sv-value">{SecondsToHMS(stat.writingTime / 1000)}</div>
</div>
