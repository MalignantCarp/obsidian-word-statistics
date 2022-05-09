import { App, ItemView, WorkspaceLeaf } from "obsidian";
import type WordStatisticsPlugin from "src/main";
import type { WSProjectManager } from "src/model/manager";
import ProjectManagement from "./svelte/ProjectManagementView/ProjectManagement.svelte";

export const PROJECT_MANAGEMENT_VIEW = {
    type: 'ws-view-project-management',
    name: 'Project Management',
    icon: 'sheets-in-box'
};

export class ProjectManagementView extends ItemView {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    container: HTMLDivElement;
    pmv: ProjectManagement;

    constructor(leaf: WorkspaceLeaf, plugin: WordStatisticsPlugin) {
        super(leaf);
        this.app = plugin.app;
        this.plugin = plugin;
        this.manager = plugin.collector.manager;
    }

    getDisplayText(): string {
        return PROJECT_MANAGEMENT_VIEW.name;
    }

    getViewType(): string {
        return PROJECT_MANAGEMENT_VIEW.type;
    }

    getIcon(): string {
        return PROJECT_MANAGEMENT_VIEW.icon;
    }

    async onOpen(): Promise<void> {
        this.pmv = new ProjectManagement({
            target: this.contentEl,
            props: {
                manager: this.manager,
            }
        })
    }

    onClose(): Promise<void> {
        if (this.pmv) {
            this.pmv.$destroy;
        }
        return Promise.resolve();
    }
}