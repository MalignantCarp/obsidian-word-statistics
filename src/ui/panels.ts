import { App, DropdownComponent, Setting } from "obsidian";
import { WSProjectGroup } from "src/model/group";
import { WSProjectManager } from "src/model/manager";
import { PROJECT_TYPE_STRING, WSProject, WSPType } from "src/model/project";
import WordStatisticsPlugin from "../main";
import { ProjectElement, ProjectList } from "./components";
import { EditFileProjectModal, EditFolderProjectModal, EditTagProjectModal } from "./modals";

export class ProjectManagerPanel {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    container: HTMLDivElement;
    fileProjects: ProjectList;
    folderProjects: ProjectList;
    tagProjects: ProjectList;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement) {
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.parent = parent;
        this.container = parent.createDiv();
        this.fileProjects = null;
        this.folderProjects = null;
        this.tagProjects = null;
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-update", this.rebuild.bind(this)));
        this.rebuild();
    }

    clear() {
        // cleanup?
    }

    getModalForType(pType: WSPType) {
        let modal: EditFileProjectModal | EditFolderProjectModal | EditTagProjectModal;
        switch (pType) {
            case WSPType.File:
                modal = new EditFileProjectModal(this.app, this.plugin, this.manager);
                break;
            case WSPType.Folder:
                modal = new EditFolderProjectModal(this.app, this.plugin, this.manager);
                break;
            case WSPType.Tag:
                modal = new EditTagProjectModal(this.app, this.plugin, this.manager);
                break;
        }
        if (modal === undefined || modal === null) {
            console.error(`Failed to create modal for new ${pType}/${PROJECT_TYPE_STRING[pType]}`);
            return;
        }
        modal.onClose = () => {
            if (modal.cancelled) {
                return;
            }
            this.manager.triggerProjectUpdate(modal.project);
            //manager.updateProject(modal.project);
        };
        return modal;
    }

    rebuild(project?: WSProject) {
        this.container.empty();
        new Setting(this.container)
            .setName("File Index Projects")
            .setDesc("Create a new project based on a file index.")
            .addButton((button) => {
                button.setButtonText("New File Index Project");
                button.onClick(() => {
                    let modal = this.getModalForType(WSPType.File);
                    modal.open();
                });
            });
        this.fileProjects = new ProjectList(this.app, this.plugin, this.manager, this.container, WSPType.File);
        new Setting(this.container)
            .setName("Folder Projects")
            .setDesc("Create a new project based on a folder.")
            .addButton((button) => {
                button.setButtonText("New Folder Project");
                button.onClick(() => {
                    let modal = this.getModalForType(WSPType.Folder);
                    modal.open();
                });
            });
        this.folderProjects = new ProjectList(this.app, this.plugin, this.manager, this.container, WSPType.Folder);
        new Setting(this.container)
            .setName("Tag Projects")
            .setDesc("Create a new project based on a tag.")
            .addButton((button) => {
                button.setButtonText("New Tag Project");
                button.onClick(() => {
                    let modal = this.getModalForType(WSPType.Tag);
                    modal.open();
                });
            });
        this.tagProjects = new ProjectList(this.app, this.plugin, this.manager, this.container, WSPType.Tag);
    }
}

export class ProjectGroupViewerPanel {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    pickerDiv: HTMLDivElement;
    listDiv: HTMLDivElement;
    container: HTMLDivElement;
    list: Map<WSProject, ProjectElement>;
    group: WSProjectGroup;
    groupList: Setting;
    groupComponent: DropdownComponent;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement) {
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.parent = parent;
        this.list = new Map<WSProject, ProjectElement>();
        this.container = parent.createDiv();
        this.pickerDiv = this.container.createDiv();
        this.listDiv = this.container.createDiv();
        this.groupList = new Setting(this.pickerDiv);
        this.manager.collector.updateAllFiles();
        this.rebuildPanel();
        this.rebuildFileList();
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-group-update", this.onProjectGroupUpdate.bind(this)));
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-groups-changed", this.rebuildPanel.bind(this)));
    }

    rebuildPanel() {
        if (this.manager.projectGroups.size < 1) {
            if (this.groupList.components.contains(this.groupComponent)) {
                this.groupList.components.remove(this.groupComponent);
                this.groupComponent = null;
            }
            this.groupList.clear();
            this.groupList.setName("No project groups found.");
            this.groupList.setDesc("Please add at least one project group using the project group manager.");
        } else {
            this.groupList.setName("Project Group");
            this.groupList.setDesc("Choose a project group to view.");
            if (this.groupList.components.contains(this.groupComponent)) {
                this.groupList.components.remove(this.groupComponent);
            }
            this.groupList.addDropdown((dropdown) => {
                this.groupComponent = dropdown;
                this.manager.projectGroups.forEach((group, name) => {
                    dropdown.addOption(name, name);
                });
                dropdown.onChange((value: string) => {
                    this.group = this.manager.projectGroups.get(value);
                    this.rebuildFileList();
                });
                if (this.group instanceof WSProjectGroup) {
                    dropdown.setValue(this.group.name);
                } else {
                    dropdown.setValue(this.manager.projectGroups.keys().next().value);
                }
            });
        }
    }

    clear() {
        // cleanup?
    }

    onProjectGroupUpdate(group: WSProjectGroup) {
        if (group == this.group) {
            this.rebuildFileList();
        }
    }

    rebuildFileList() {
        this.listDiv.empty();
        this.list.clear();
        if (this.group instanceof WSProjectGroup) {
            this.group.projects.forEach((project) => {
                this.list.set(project, new ProjectElement(this.app, this.plugin, this.manager, this.container, project));
            });
        }
    }
}
/*

This panel views all files within the Project Manager, or all projects with the specified group.

*/
export class ProjectViewerPanel {
    app: App;
    plugin: WordStatisticsPlugin;
    manager: WSProjectManager;
    parent: HTMLElement;
    container: HTMLDivElement;
    list: Map<WSProject, ProjectElement>;
    group: WSProjectGroup;

    constructor(app: App, plugin: WordStatisticsPlugin, manager: WSProjectManager, parent: HTMLElement, group?: WSProjectGroup) {
        this.app = app;
        this.plugin = plugin;
        this.manager = manager;
        this.parent = parent;
        this.group = group;
        this.container = parent.createDiv();
        this.list = new Map<WSProject, ProjectElement>();
        this.manager.collector.updateAllFiles();
        this.rebuild();
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-update", this.onProjectUpdate.bind(this)));
        this.plugin.registerEvent(this.app.workspace.on("word-statistics-project-files-update", this.onProjectUpdate.bind(this)));
    }

    clear() {
        // cleanup?
    }

    onProjectUpdate(project: WSProject) {
        if (this.list.has(project)) {
            this.list.get(project).update();
        }
    }

    rebuild() {
        this.container.empty();
        this.list.clear();
        let projects: WSProject[];
        if (this.group != null && this.group != undefined) {
            projects = this.group.projects;
        } else {
            projects = this.manager.getProjectList();
        }
        projects.forEach((project) => {
            this.list.set(project, new ProjectElement(this.app, this.plugin, this.manager, this.container, project));
        });
    }
}

export class ProjectGroupManagerPanel {
    container: HTMLDivElement;

    constructor(public app: App, public plugin: WordStatisticsPlugin, public manager: WSProjectManager, public parent: HTMLElement) {
        this.container = this.parent.createDiv();
    }

    clear() {
        // cleanup?
    }
    /*
    
    Because the code in the component this would use relies on the project group already existing, the workflow for
    this will need to be a bit different than the project manager.
    
    When you open the panel to manage project groups, you will get a list of project groups with the ability to add new
    ones via button, and the ability to modify existing ones from the list. Not sure yet if this will be three
     extra buttons or if one of them will be full sized or not.
    
    This is a unique element of the project system. While a project has name and an index, a project group has a name and
    a list of projects in a particular order.
    
    There may be a possibility to modify the basic project list component to have a + symbol next to it to have a callback
    into the ProjectGroupProjectListPanel to add the project to the group's list.
    
    */

}
