import { App, ItemView, WorkspaceLeaf } from 'obsidian';
import type WordStatisticsPlugin from 'src/main';
import type { WSDataCollector } from 'src/model/collector';
import type { WSStatisticsManager } from 'src/model/statistics';
import StatisticsPane from './svelte/StatisticsView/StatisticsPane.svelte';

export const STATISTICS_VIEW = {
    type: 'ws-view-statistics',
    name: 'Word Statistics',
    icon: 'trending-up'
};

export class StatisticsView extends ItemView {
    app: App;
    plugin: WordStatisticsPlugin;
    collector: WSDataCollector;
    stats: WSStatisticsManager;
    parent: HTMLElement;
    container: HTMLDivElement;
    pane: StatisticsPane;

    constructor(leaf: WorkspaceLeaf, plugin: WordStatisticsPlugin) {
        super(leaf);
        this.app = plugin.app;
        this.plugin = plugin;
        this.collector = plugin.collector;
        this.stats = plugin.collector.stats;
    }

    getDisplayText(): string {
        return STATISTICS_VIEW.name;
    }

    getViewType(): string {
        return STATISTICS_VIEW.type;
    }

    getIcon(): string {
        return STATISTICS_VIEW.icon;
    }

    async onOpen(): Promise<void> {
        this.pane = new StatisticsPane({
            target: this.contentEl,
            props: {
                collector: this.collector,
            }
        })
    }

    onClose(): Promise<void> {
        if (this.pane) {
            this.pane.$destroy;
        }
        return Promise.resolve();
    }
}