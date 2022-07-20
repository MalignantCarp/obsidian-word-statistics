<script lang="ts">
	import type { WSDataCollector } from "src/model/collector";
	import { WSEvents, WSFileEvent } from "src/model/event";
	import { Settings } from "src/settings";
	import { GetDateStart } from "src/util";
	import { onDestroy, onMount } from "svelte";

	export let collector: WSDataCollector;

	let viewDate: Date;
    let todayStart: number;
    let dayEnd: number;

	onMount(() => {
		viewDate = GetDateStart(new Date());
		collector.plugin.events.on(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
        todayStart = viewDate.getTime();
        dayEnd = todayStart + Settings.Statistics.DAY_LENGTH;
	});

	onDestroy(() => {
		collector.plugin.events.off(WSEvents.File.WordsChanged, onWordsChanged, { filter: null });
	});

    function reloadStats() {

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

    </div>
</div>
