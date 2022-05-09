## Changelog
### 2022-05-08
 - Cleared out old modals, components, panels, and validation modules.
 - Fixed missing headings in changelog.
 - Began work on the Project Management View panel, which will replace all of the viewers and managers designed for the previous rendition of the plugin. Currently it displays (rather hideously) the projects and their files. A tooltip when hovering over a file name will show the full vault path for the file. This will be moved to an info panel in the next iteration.
 - WSDataCollector and WSProjectManager now trigger events for file deletion and renaming. WSDataCollector now also removes the file from any WSFileProjects for which it is the index.
 - BUGFIX: SuggestBox was not closing suggestions when one was selected.
 - BUGFIX: Event system filter was improperly comparing filters.
 - BUGFIX: Extra space underneath content of tooltip.
 - BUGFIX: Missing tooltip-arrow.
 - WSEventFilter now allows an optional message to record the source of a trigger or listener.

### 2022-05-04
 - BUGFIX: SuggestBox key navigation doesn't work.
 - BUGFIX: ProjectEditor modal Save button was always disabled.
 - Removed old Suggester
 - Added onClose() methods to the modals
 - BUGFIX: Save button was not working due to a bug in WSProjectManager.CreateProject(), which was trying to access type from the project (uninstantiated).
 - ValidatedInput is fully working.
 - SuggestBox is fully working.
 - Thus ProjectEditor and ProjectManager are fully working.
 - ProjectManager has a new layout, which should mitigate any issues with having lots of projects between the different project types. Quite likely this interface will change once there are a lot of projects to manage.
 - Removed the comments preventing ProjectManager from saving new project data.

### 2022-05-03
 - Fixed display on the new ProjectManager interface. This will need to be redesigned at some point as it will no doubt become too ungainly once there are numerous projects, and some people will probably gravitate to only a particular type of project.
 - Fixed ProjectEditListItem, which was not displaying anything.
 - Re-added the some CSS to styles.css that was inadvertently deleted when purging some unused CSS.
 - BUGFIX: WSDataCollector.updateFile() wasn't updating tag addition and deletions properly.
 - BUGFIX: WordCountForProject statusbar widget wasn't updating properly.
 - BUGFIX: ProjectEditList and ProjectEditListItem were not handling deletion properly, so the list of projects was not updating correctly.
 - BUGFIX: SuggestBox and ValidatedInput had certain display issues that have been fixed.
 - [-] BUG: SuggestBox key navigation doesn't work, nor does selecting an option


### 2022-05-02
 - Updated to some dev dependencies
 - Replaced the unicode icons with Obsidian setIcon calls for consistency across themes. Reorganized a bit of how the WordCountFor*.svelte files organized the DOM, and amended styles.css to match.
 - Added a new ValidatedInput.svelte
 - Replaced ProjectList/ProjectListItem with more specific versions, one for the Project List for the group manager, one for viewing, and one for the project manager. Used the Obsidian setIcon calls for styling those buttons, and use the div-style buttons with the extra button classes
 - Reorganized the Svelte files so each major section of the interface is now in its own folder. Shared components are in the util folder.
 - Started the ProjectManager and related Svelte files. Next up is testing and debugging, then the group manager, then the respective viewers.

### 2022-04-29
 - Created ProjectEditList.svelte and ProjectEditPanel.svelte
 - Replaced the tooltip with one generated using svelte-PopperJS. Still some kinks to work out. It is still missing the arrow, but otherwise works about as well as the old one did. Included a CSS override to fix an issue caused by the transition when the keyframe transition animation runs. Without removing the animation, the tooltip gets stuck on the left edge of the Obsidian main window.
 - Created a SuggestBox.svelte to eventually replace the entire suggester/*.ts.

### 2022-04-27
 - Changed the F, P, and V into unicode symbols for a sheet, a folder, and a filing cabinet. Also replaced the error ! in combining circle with the exclamation mark in a triangle unicode symbol. Need to find a better way to do these, but at least they are done with CSS in case anyone wants to come up with a different way.
 - Added ProjectListItem.svelte for projects included in lists. This will take in multiple callbacks, which determine which buttons will appear. Button functionality currently includes edit, delete, move up, move down, add, and remove. Edit and delete are for main project lists. Add can be used for a list of projects to add to a group. Remove, move up, and move down can be used for project group listings, which allow for the removal or movement of the item in the list.

### 2022-04-26
 - Added new Tooltip.svelte to handle tooltips for any widgets that may be necessary. They use the tooltip class so they will be themed with the Obsidian theme. The tooltip can take an optional bottom flag which will invert the offset for the tooltip so that it is brought up at least the height of the tooltip to ensure it doesn't go off the screen.
 - Added tooltip to show what projects contain a file when there is more than one. Ideally one should not be including the same file in multiple projects. Alternatives to this are welcome.
 - There is now a F, P, or V appended to the front of the respective word counts for Files, Projects, and the Vault to conserve space.

### 2022-04-25
 - New Svelte status bar and word counting widgets. Need to still make some tweaks (clarity re: file vs project counts) and add a tooltip to list the projects in the case of multiple projects.

### 2022-04-22
 - Completed event system.
 - UI system was becoming ungainly. Have started to develop parts of the UI using Svelte.

### 2022-04-21
 - Added code to allow project groups to have descendents by using pathing (e.g., Group 1/Descendent 1) so that we can show hierarchy.
 - Added project group retrieval methods to get alpha-sorted name lists and project group lists.
 - Moved WSDataCollector to model/collector.ts
 - Moved WSProjectManager to model/manager.ts
 - Moved WSProjectGroup to model/group.ts
 - Moved files.ts to model/file.ts
 - Reorganized methods under WSProjectManager into a more logical order
 - New CSS for div-based tables
 - Started new ProjectFileItem and ProjectFileList components
 - Added more events and supporting code for tracking file renames and file word count updates.
 - Started building a new event system. This wukk allow for proper tracking across various UI elements by registering those elements with their respective files and creating handlers. The lead dispatcher will then handle the queue to clear any of those on respective events. I will also add a filter so that file/project/group-specific events only go to the place watching for them.

### 2022-04-20
 - Data structure population is now deferred until layout is ready to ensure the vault is fully loaded before we start indexing.
 - Finished the dropdown for the ProjectGroupViewer panel.
 - Added commands to open the Project Group manager and viewers.
 - Split the project group events into two separate events, one for when a group itself has changed and the other for when the list of groups has changed.
 - BUGFIX: Project name validation wasn't triggered on window creation, even though it had an invalid name.
 - Broke UI up into ui folder for easier organization
 - Further work on Project Group manager. Lots of untested code.
 - Need to further refine and breakdown UI code to minimize duplicate code and maximize usefulness of components and helper routines.


### 2022-04-19
 - ProjectViewer and ProjectManager panels and modals appear to be fully functional. Next testing requires the viewer leaf so live changes can be seen.
 - Updated ProjectViewer to use the table settings for alpha sorting of non-file-indexed projects. May make this a separate option.
 - Use Display Text settings option was being ignored.
 - Created the ProjectGroupViewerPanel
 - Added methods to the WSProjectManager to handle addition and deletion of projects to project groups as well as moving them up and down.

### 2022-04-18
 - Bug fixes galore
 - CSS changes

### 2022-04-17
 - Most of the manager and viewer modals are finished up, just need to debug them all and clean them up.
 - Need to make sure file-list update event is fired so that the project can update its files list.

### 2022-04-15
 - Created Tag suggester based on Jeremy Valentine's suggester code for folders.
 - Fixed a few small types in the file.ts code
 - Added a method to get all projects of a specific type from WSProjectManager
 - Unified some method naming in data.ts for WSDataCollector
 - Major additions to ui.ts
 - Updated styles.css for new additions to the UI

### 2022-04-14
 - First work on the Project creation Modals
  - Borrowed validation code from Jeremy Valentine's Admonition plugin, MIT Licensed
  - Borrowed suggester code from Jeremy Valentine's Fantasy Calendar plugin, MIT Licensed
    - Adapted path.ts into file.ts for handling TFiles only.
    - Should be able to adapt this for tags as well
 - Updated minimum Obsidian version to 0.14.6.
 - Deferred initial vault scan into first interval update.

### 2022-04-11
 - More work on main plugin re: handling of project data.
 - Added a current list of files on a project, and a method on WSProject to populate the list. The update method will return any file that was removed from the list since last updated.
 - Added events for project updates and project file list updates. The former will trigger after a project has been altered so that we can trigger saving data. The file list update will trigger when something is done that updates a project's file list, so we can call routines for updating the UI.
 - Added routines to WordStatisticsPlugin and WSProjectManager for handling updating projects based on index file, tag, and folder. Also added SaveSerialData method to WordStatisticsPlugin.
 - Updated WSDataCollector's routine for updating tag information when a file is updated. It will now call an update to projects containing tags that now include a file or that no longer include a file when that change occurs.
 - Added methods for unregistering and deleting projects.
 - Added method to unregister a project group.

### 2022-03-11, 2022-03-12, 2022-03-13, 2022-03-18, 2022-03-20, 2022-04-02
 - Rebuilt WSFile and WSProject classes, added WSProjectGroup.
 - WSProject class now has a register and deregister method that will record a callback to send new word counts to
 - Rebuilt WSProjectManager class.
 - Added a Dispatcher class to run function callbacks sending both id (used to remove callback) and message to the callback function. Right now the Dispatcher just receives a message for dispatch, but this could later be expanded to dispatch objects and enum types to tell it what it needs to do. Basic event system.

### 2022-03-06
 - Internalized much of the WSProjectRef interface into the WSProject class. Transformed the interface into WSProjectMap for data mapping to and from data.json.
 - Added code to WSProject to update based on a WSProjectMap (retrieved from the settings interface for creating projects, yet to be coded).
 - Added code to WSFileRef to hold onto tags and links.
 - Added code to WSDataCollector to retrieve a list of all WSFileRefs by tag.
 - Added code to WSDataCollector to retrieve a list of all WSFileRefs by folder.
 - Added code to determine if an index rebuild is required for the project.
 - WSProjectManager now has a list of file indexes.
 - Added code to the WSDataCollector.updateFile() code to update links and tags on the WSFileRef(). Links are only updated if the file is an index.
 - TAbstractFile.name is now set as title when none exists.
 - First steps are in for Longform integration. Will need a flag to specify when an index file is a longform project.
 - [x] ~~We will also want to make sure that when onRename() happens on a folder, that we check to see if any projects use it as an index and perform the rename there accordingly.~~ This is no longer an issue, as the file is now a WSFileRef

### 2022-03-04
 - Added WSProjectRef interface and array added to plugin settings to store project list.
  - WSPluginRef allows a choice of using a tag, folder, or file as the index for the project.
  - Added WSPIndexType enum for the three types of indices, along with their relevant setters and getter.
 - Cleanup
  - Removed Collector from WSPluginRef was it was not used)
  - Migrated interfaces to their respective project files. No point in having them separate in a types.ts file when they are rarely used outside of their context. It is likely some of them won't even need to be exported.


### 2022-03-03
 - [x] ~~TODO: Pull table settings into settings.ts for the main settings and just have the table modal select the project~~
 - More cleanup.
 - ProjectManager.getProject() will now return null if the project does not exist. Previously it created the project.
 - ProjectManager has a newProject() routine now. It will return null if the project name is already in use.

### 2022-03-02
 - Further work on new project system, sadly not much today.
 
### 2022-03-01
 - Scrapped old project system and links/backlinks. WSFileRefs will now just keep track of file-related things, such as current title, word count, etc.
 - Built new project manager and project ref classes that are solely responsible for everything project-related.
 - Renamed Collector => WSDataCollector
 - Deferred project-management tasks from WSDataCollector to WSProjectManager
 - ProjectManager will now manage project files. The projects will be created through a modal and settings, and possibly later a leaf.

### 2022-02-28
 - Collector.getProjectWordsTotal() was missing return words

### 2022-02-27
 - WSFileRef now includes titles for backlinks; added setting to make use of this
 - Moved all validation for WSFileRefs into WSFileRefs, they will handle all addition and deletion of cross-referencing
 - Started tables.ts with table-building functionality. Table ssettings are available through a modal for now. Default settings should ideally be configurable, as should currently-in-use settings (i.e., there should be a flag to save current settings as the default or to save them for the session, so both of these scenarios will need a particular setting in the plugin settings)

### 2022-02-26
 - Fixed a bug in WordStatisticsPlugin.onInterval() that resulted in an exception when the view object had no file or when the view object itself was null. The interval update will not indicate total words in the vault when there is no active view and/or file.
 - Data collector now handles file deletion.
 - Data collector now can retrieve total project word count and project file list

### 2022-02-25
 - Project map will now use ID number to avoid having to change any path string keys. ID will remain constant for the life of the plugin.
 - Project map builds automatically based on updates to files. Will need to determine when the update function should be run for a given TFile. Right now it is only run once upon vault sync, but it should ideally be run whenever front matter or links change on a file. Need to determine if there is a way to keep an eye out for that particular kind of change.

### 2022-02-24
 - There is now a means of determining word count for rendered text in a preview window currently commented out in WordStatisticsPlugin.onLeafChange().
 - Added YAML tag determination. Now need to build the project map.

### 2022-02-23
 - Laid groundwork for project system. We are going to utilize three YAML tags initially. We may amend this to being able to include folders, etc from settings, but for now we are going to go ahead and just move forward with this.
 - Renamed WCFileRef to WSFileRec (WS for Word Stats)

### 2022-02-22
 - Finished data collector. Now updates status bar when there has been a change behind the scenes in the collector.

### 2022-02-04
 - Added words.ts functions for getting character counts of both countable text (i.e., without comments, embeds, links, etc.) and raw text.
 - Added data collector.
 - No commit.

### 2022-02-01
 - Word counting for current active Markdown editor is complete. Haven't fully tested with editor/source/legacy, but it should theoretically work.
 - NEXT TODO:
   - Selection word counting (this will be a challenge as need to extend CM6 and then the issue is the legacy editor, so will need to solve that issue as well)
   - Recording of current word counts (already have code in to monitor file renaming from within Obsidian; will also need a means of reconciling such changes outside of Obsidian)
   - Once recording of current word counts is complete, ongoing statistics. At this point will need to watch on-paste event and possibly monitor CM6 as well for cut/paste to properly account for imported text and possibly "moved" text.

### 2022-01-06
 - First steps on getting word counting running. Next up will be evaluating efficiency and then handling the status bar, and then the basic functionality will be complete and it will be on to the more difficult work.

### 2022-01-05
 - Added some more regex work mostly. Will likely start working on the main word counting stuff tomorrow and will handle embeds afterwards.

### 2022-01-04
 - Added words.ts with the first of our functions. Should hopefully have basic word counting of Markdown content by the weekend, hopefully in the status bar.