<script lang="ts">
import { countReset } from 'console';

	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent } from "src/model/event";
import type { WSFile } from 'src/model/file';
	import type { IWordCount } from "src/model/statistics";
	import { Settings } from "src/settings";
	import { FormatWords, GetDateStart, SecondsToHMS } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let collector: WSDataCollector;

	let viewDate: Date;
	let todayStart: number;
	let dayEnd: number;

    let stats: Map<WSFile, IWordCount[]>;
    let totalDuration: number = 0;
    let totalWordsAdded: number = 0;
    let totalWordsDeleted: number = 0;
    let totalWordsImported: number = 0;
    let totalWordsExported: number = 0;
    let totalWritingTime: number = 0;
    let startWords: number = 0;
    let endWords: number = 0;

	onMount(() => {
		viewDate = GetDateStart(new Date());
		collector.plugin.events.on(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
		todayStart = viewDate.getTime();
		dayEnd = todayStart + Settings.Statistics.DAY_LENGTH;
        reloadStats();
	});

	onDestroy(() => {
		collector.plugin.events.off(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
	});

	function reloadStats() {
        stats = collector.stats.getHistoryForTimePeriod(viewDate);
        totalDuration = 0;
        totalWordsAdded = 0;
        totalWordsDeleted = 0;
        totalWordsImported = 0;
        totalWordsExported = 0;
        totalWritingTime = 0;
        startWords = 0;
        endWords = 0;
        stats.forEach((counters, file) => {
            if (counters) {
                startWords += counters.first().startWords;
                endWords += counters.last().endWords;
            }
            counters.forEach(count => {
                totalDuration += count.endTime - (count.startTime + count.air);
                totalWordsAdded += count.wordsAdded;
                totalWordsDeleted += count.wordsDeleted;
                totalWordsImported += count.wordsImported;
                totalWordsExported += count.wordsExported;
                totalWritingTime += count.writingTime;
            })
        })
    }

	function onWordsChanged(evt: WSFileEvent) {
		let start = new Date();
		let timeCheck = start.getTime();
		start = GetDateStart(start);
		// if the current view date is today and our new time is over the end of that date
		if (viewDate.getTime() === todayStart && timeCheck >= dayEnd) {
			viewDate = start;
			todayStart = start.getTime();
			dayEnd = todayStart + Settings.Statistics.DAY_LENGTH;
			reloadStats();
			return;
		}
		// if we are adding or removing words in the day we are examining
		if (timeCheck >= viewDate.getTime() && timeCheck <= dayEnd) {
			// update the stats
			reloadStats();
		}
	}
</script>

<div class="ws-sv-date">
	<p class="ws-title">{viewDate instanceof Date ? viewDate.toLocaleDateString() : ""}</p>
	<div class="ws-sv-stats">
        <div>Start Words:</div>
        <div>{FormatWords(startWords)}</div>
        <div>End Words:</div>
        <div>{FormatWords(endWords)}</div>
        <div>Words Added:</div>
        <div>{FormatWords(totalWordsAdded)}</div>
        <div>Words Deleted:</div>
        <div>{FormatWords(totalWordsDeleted)}</div>
        <div>Words Imported:</div>
        <div>{FormatWords(totalWordsImported)}</div>
        <div>Words Exported:</div>
        <div>{FormatWords(totalWordsExported)}</div>
        <div>Writing Time:</div>
        <div>{SecondsToHMS(totalWritingTime / 1000)}</div>
        <div>Logged Time:</div>
        <div>{SecondsToHMS(totalDuration/1000)}</div>
        <div>Time Writing (%)</div>
        <div>{(totalWritingTime/totalDuration*100).toFixed(2) + "%"}</div>
    </div>
</div>
