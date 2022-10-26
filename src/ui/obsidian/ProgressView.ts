import { App, ItemView, WorkspaceLeaf } from "obsidian";
import type WordStatisticsPlugin from "src/main";
import ProgressMain from "../svelte/ProgressView/ProgressMain.svelte";

export const PROGRESS_VIEW = {
    type: 'ws-view-progress',
    name: 'ProgressView',
    icon: 'bar-chart-horizontal'
};

export class ProgressView extends ItemView {
    app: App;
    plugin: WordStatisticsPlugin;
    parent: HTMLElement;
    container: HTMLDivElement;
    pv: ProgressMain;

    constructor(leaf: WorkspaceLeaf, plugin: WordStatisticsPlugin) {
        super(leaf);
        this.app = plugin.app;
        this.plugin = plugin;
    }

    getDisplayText(): string {
        return PROGRESS_VIEW.name;
    }

    getViewType(): string {
        return PROGRESS_VIEW.type;
    }

    getIcon(): string {
        return PROGRESS_VIEW.icon;
    }

    async onOpen(): Promise<void> {
        this.pv = new ProgressMain({
            target: this.contentEl,
            props: {
                plugin: this.plugin,
            }
        });
    }

    onClose(): Promise<void> {
        if (this.pv) {
            this.pv.$destroy;
        }
        return Promise.resolve();
    }
}