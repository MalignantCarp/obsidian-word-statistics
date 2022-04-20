import { App, ItemView, WorkspaceLeaf } from "obsidian";
import WordStatisticsPlugin from "src/main";
import { WSProjectManager } from "src/projects";

export const WORD_STATS_PROJECT_VIEW = "word-stats-project";

class ProjectPanel extends ItemView {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    container: HTMLDivElement;

    constructor(leaf: WorkspaceLeaf, app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement) {
        super(leaf);
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.parent = parent;
        this.container = parent.createDiv();
    }

    getDisplayText(): string {
        return "Project View";
    }

    getViewType(): string {
        return WORD_STATS_PROJECT_VIEW;
    }

}