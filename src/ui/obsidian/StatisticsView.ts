import { App, ItemView, WorkspaceLeaf } from 'obsidian';
import type WordStatisticsPlugin from 'src/main';
import StatsMain from '../svelte/StatsView/StatsMain.svelte';

export const STATISTICS_VIEW = {
    type: 'ws-view-statistics',
    name: 'Word Statistics',
    icon: 'trending-up'
};

export class StatisticsView extends ItemView {
    app: App;
    plugin: WordStatisticsPlugin;
    parent: HTMLElement;
    container: HTMLDivElement;
    pane: StatsMain;

    constructor(leaf: WorkspaceLeaf, plugin: WordStatisticsPlugin) {
        super(leaf);
        this.app = plugin.app;
        this.plugin = plugin;
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
        this.pane = new StatsMain({
            target: this.contentEl,
            props: {
                plugin: this.plugin
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