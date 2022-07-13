## Bugs
 - BUG: Settings sliders don't show their value, which makes it hard to apply settings. Considered svelte for the settings dialog to simplify things.
 - BUG: Default Obsidian theme doesn't show status bar progress bars.

## Changelog
### 2022-07-03
 - BUGFIX: Air was being calculated as 30,000 ms instead of 300,000 ms. It is supposed to be 5 minutes, which is 300,000 ms, not 30 seconds.
 - Added a helper function to WSProjectManager for getting the title for a file based on the project.
 - Added some CSS for the word statistics view.

### 2022-07-12
 - Fixed a typo in settings
 - BUGFIX: Air recorded as negative.
 - BUGFIX: Air is in milliseconds but display says seconds.
 - BUGFIX: Length is in milliseconds but display says seconds.
 - BUGFIX: Word stats pane not updated on file focus event.
 - BUGFIX: Writing time stored in ms but used like stored in seconds.
 - Started work on adding next/previous for stats viewing

### 2022-07-11
 - Added a few util functions and added the new StatisticsView with a basic pane (untested) for display the current active stats. Need to add left and right buttons to go between items.

### 2022-07-09
 - Changed setting to record stats for projects into an option between all, projects only, and monitored projects only (i.e., opt-in).
 - Added monitorCounts field to WSProject classes.
 - Added Checkbox svelte to mimic the Obsidian checkbox.
 - Updated Project Editor to include an option for monitoring word counts for when monitored-projects only is on.

### 2022-07-08
 - Main statistics code is done.
 - Added save and load code for statistics
 - Added minify toggle for statistics/word count history database, default to on.
 - Added WSEvents.Data.Stats and trigger in event trigger to fire when WSEvents.File.WordsChanged is triggered.
 - Added simple mutex to WSStatisticsManager to prevent creating WSCountHistory objects prior to loading saved data, as well as a queue to process afterwards.
 - Linked onWordCountUpdate() in WSStatisticsManager with WSDataCollector's logWords()
 - TESTING IS REQUIRED

### 2022-07-07
 - Start to the main statistics code. Need to further review and refine, as there are some logic gaps that are going to cause trouble with the way writingTime is calculcated right now.

### 2022-07-04
 - Added new settings interface for Word Statistic settings.
 - Added some information on how Word Stats will be stored to README.md. Added Beta warning in anticipation of first beta release.

### 2022-07-02
 - Added methods to WSDataCollector to get files for a folder and get word count for a folder.
 - Word counts may now be displayed in the file explorer (defaults to on). Idea from Isaac Lyman's Novel Word Count plugin.

### 2022-07-01
 - BUGFIX: Misplaced colons in some of the table headings.
 - Removed a couple of old svelte files that were no longer being used.
 - Added error checking in TreeProjectContainer and TreePathContainer for when progress is null/undefined
 - BUGFIX: In WordCountForFile, sometimes progress is null/undefined, resulting in an exception when trying to modify its progress bar. Still unsure how this is ever null, but have put in a fix to ensure it's not modified unless it exists.
 - BUGFIX: WSDataCollector was sometimes using TFile.name in place of TFile.basename
 - BUGFIX: LoadFileData attempted to load file data even after failed JSON parsing
 - BUGFIX: LoadProjectData and LoadPathData were missing JSON parsing error checking
 - BUGFIX: onStartup() was passing empty file data, project data, and path data to formatting routines
 - BUGFIX: LinkCache.displayText? always returns the link even when there is no displayText; this appears to be an Obsidian bug, for now have made it check to see if link.link === link.displayText and if so return null so that the proper TFile.basename is used instead
 - Added a plugin setting to display the word count speed debug messages.
 - BUGFIX: Database Settings heading was being displayed twice.
 - Created model/statistics.ts to begin work on statistic history
 - Updated package.json to include the latest version of Obsidian

### 2022-06-29
 - Removed table settings from main settings window. These will now be accessed from the insert table modal, which will need to be adapted into Svelte to allow for greater customization. The new modal will allow current settings to be saved (sans project name, at this time). In the future, different settings can be saved as templates, including the project, and can additionally be mapped to commands and key-combinations (enhancement #2).
 - Made table creation more modular to support enhancement #3. Rows are now constructed of all available information and then the table is built based on the settings and how the table is to be displayed (right now this is only inserted as a markdown table, but later enhancements will allow it to build an HTML table for a leaf view)

### 2022-06-27
 - FileInfo now displays the display text for a file if that option is enabled in settings.
 - Can now build basic project table.
 - BUGFIX: Insert table no longer inserts the default project table upon opening the modal, it is now done when you hit insert and close.

### 2022-06-23
 - Renamed Open Project Management View menu command to Attach Project Management View, as it does not open or focus it, but merely attaches it to the right leaf.
 - Re-added the Insert Project Table Modal and associated command. (Incomplete)
 - BUGFIX: getWordGoalForProjectByContext() was stopping at the path for the project rather than checking ancestors.
 - BUGFIX: getWordGoalForFileByContext() was stopping at the path of the project rather than checking ancestors.
 - BUGFIX: Progress bar for path is not beneath the tree item but at the side
 - BUGFIX: Progress bars were not updating when paths were reset
 
### 2022-06-22
 - ProjectInfoModal now shows project word goal
 - ProjectInfoModal file list now shows file word goal
 - Added the GoalsSet event for WSEvent.File, which fires when file word goal is updated in YAML. Updated file word count status bar element to watch for this event

### 2022-06-21
 - ProjectInfo Modal now shows when there are no files rather than having an empty table.
 - Preliminary CSS in place for ProjectInfo Modal

### 2022-06-20
 - Most of ProjectInfo Modal is complete. Might add some functionality from the old PMFileInfo panel to it as far as individual file info is concerned, but for now the key functionality is there.
 -[x] Needed: Determine display for no files in ProjectInfo modal.
 -[x] Needed: CSS for ProjectInfo Modal.
 - Needed: svelte cleanup (there may be some old UI components still lingering).
 - Needed: CSS cleanup (there is some old CSS from prior UI iterations that are no longer required).

### 2022-06-19
 - Re-enabled saving of serialized data.
 - Added command to open the project management view if it has been closed.
 - BUGFIX: Exception when creating a project with a file index that has no links.
 - Added ability to stop propagation of events in event system.
 - Added ProjectInfo Modal, which can be used to get more detailed info about a particular project when the project is clicked on. (UNFINISHED)
 - Hooked into file creation event to create WSFile object prior to it coming up in getFileSafer();
 - BUGFIX: Paths are not loading from file (data events were firing and causing the data files to be overwritten before path data could be read)
 - BUGFIX: Path data loaded from file is ignored (paths were being registered after they were all created, and their data was not part of the tree)
 - buildPath() will now build up to a path, such as one loaded from paths.json
 - BUGFIX: Path data from paths.json was not being loaded into existing path structure. Now paths are loaded first, before projects, so they can be populated as necessary from saved path data. Then projects are loaded and any remaining path structures built. (It might be worth just saving all paths at some point.)
 - BUGFIX: ProjectWordCount.svelte was not watching project or path events for GoalsSet, so was not updating when goals were set



### 2022-06-15
 - BUGFIX: clearEmptyPath setting deletion of paths does not ascend the tree, deleting the parent paths that are also empty
 - BUGFIX: Delete project doesn't reset the path buttons correct for the paths above it.
 - BUGFIX: Purge path results in an exception when a root child is purged.
 - Pulled WSPath branch back into master.

### 2022-06-13
 - BUGFIX: Purge path does not function -- the clearEmptyPath setting was being queried as a conditional for purging, rather than for auto purging following the deletion of its contained project
  - BUG: clearEmptyPath setting deletion of paths does not ascend the tree, deleting the parent paths that are also empty
  - purgePath() now returns the parent path of the purged path

### 2022-06-12
 - Added box-glyph as a new icon in PathItemButtons and related CSS to always have an icon in its place where the reset/purge icon would go.
 - Added a label to the confirmation dialog modal to control whether it says Delete or Purge.
 - BUGFIX: Reset path doesn't remove path from the paths.json file.
 - BUGFIX: SuggestBox attempted to use highlightedElement when it was undefined
 - BUGFIX: Reset path doesn't reset the button to its default appearance
 - BUG: Delete project doesn't reset the path buttons correctly for the paths above it.
 - BUG: Purge path does not function properly.
 - Disabled saving of file, project, and path JSON files for testing.  

### 2022-06-11
 - BUGFIX: JSON.parse errors when file, project, and path files do not exist.
 - BUGFIX: category was still part of the Path structures in formats.ts
 - Path editor appears to work.
 - BUG: Reset path doesn't reset the button to its default (hidden) appearance
 - BUG: Reset path doesn't remove the path from the paths.json file.
  - If it has no content, it does not need to appear.
 - Need to alter the reset button so that it shows a neutral icon when the path is already clear and shows the reset button when it is set.

### 2022-05-29
 - Added a svelte file for SettingItems to help cleanup the ProjectEditor.svelte.
 - Cleaned up ProjectEditor.svelte using the new SettingItems.svelte.
 - Some CSS and container fixes to make ValidatedInput and SuggestBox components not jump around when validation messages appear.
 - BUGFIX: SuggestBox was not scrolling with the moved highlight.
 - Made it so SuggestBox can scroll in either direction and will loop around.
 - Removed Category from WSPath. Category will be per-project.
 - Built PathEditor (untested)
 - A few changes to accommodate the PathEditor and updates to goals, so that they are accounted for by the Project and File word counters.

### 2022-05-25
 - Removed PMFileInfo panel.
 - Removed serialization code from WSProject.
 - BUGFIX: Project Title is not saved.
 - Moved check code from ProjectEditor.svelte into the respective WSProjectManager.setProject* methods to determine whether to fire events.
 - Finished the TreeProjectContainer and its subcomponents.
 - Added progress bars to TreeProjectContainer and TreePathContainer and file and project status bar counters.
 - BUGFIX: Since caching file state, Vault Counter read 0. Needed to account for the word totals for each file already being set, so now setting them when the file is initially set and triggering a word count change event as required.

### 2022-05-24
 - Built new WSFormat namespace for saving and loading files, paths, and projects. Moved all supporting code there to get it out of the main files to declutter. Will be considering CSV for a similar smaller format for minifying files.json, as it could get rather enormous for large vaults. Alternatively, it may be that only monitored files (i.e., project files) will be included, though that could be cumbersome in determining project files to output whenever saving is required.
 - BUGFIX: Closing all open files resulted in an unhandled exception.
 - BUGFIX: Status Bar had excess padding when particular word counter not present. Now we don't show the file or project counters if no file is open, and we do not show the project counter if the focused file has no project.
 - Modified the Status Bar widgets (File/Project) a bit to account for no longer needing to check that they are monitoring a focused file, as they will not be shown if that is the case.
 - Broke apart PMProjectTreePathItem into multiple components. Will continue to break down the interface into easily manageable building blocks.
 - Project Manager now shows word count for paths.
 - BUGFIX: Contents of the file collector filled prior to running scanVault. This was due to getFileSafer() being called on all metadata changes and when leaf changes were done. Have replaced with getFile() and deferred adding event listeners to metadata changes until everything has been loaded.

### 2022-05-23
 - Minor cleanups in WSProjectManager arround path building and purging.
 - Added some CSS for PMProjectTree

### 2022-05-22
 - Added method of WSProjectManager to reset the path of a project.
 - Added a few helper methods to WSPath.
 - Added WSEvents.Project event types for setting various aspects of the project. This way the UI can focus only on ones that matter to display.
 - Added WSEvents.Data.File/Project/Path and respect event types.
 - Event dispatcher now fires a Data event for File, Project, and Path events to indicate it is time to save data. This way we don't have to monitor dozens of events in main.ts.
 - Tested ProjectEditor. A few layout issues, but it otherwise works.
 - Moved was WSPath content from projects.ts into new paths.ts.
 - Added a modal to provide messages in an unordered list (for now).
 - Need to test some more and then complete the project items for the project viewer and complete CSS.
 - BUG: For some reason, the contents of the file collector seem to be filled in prior to running scanVault, which makes no sense. Need to see why this is happening. Have entered some debug prints for now to see. May need to add one in the WSFile constructor to see if it's being created elsewhere (though can't imagine where).

### 2022-05-20
 - Added IFile and file recording in preparation of bringing in statistics for the files.
 - Updated SuggestBox to allow non-options to be valid (optional flag) or to specify a custom validation routine that will alternatively provide validation even if an option is not selected.
 - Removed the old Project Manager.
 - Updated the ProjectEditor to allow for the creation and editing of any type of project. The type of project will be determined by the input project, or in the case of new projects, the selected project. Once saved, a project's type is immutable.
 - Removed the non-existent null project type.
 - Added View settings
 - Refined WSPath to act as a full tree.
 - Completed new version of ProjectEditor. (untested)
 - Began new PMProjectTree.

### 2022-05-19
 - Taking a slightly different route, eliminating the file/folder/tag grouping of project groups and opting for a path-based tree of projects to allow custom organization. The new system will utilize a basic path structure, and paths are set on a per-project basis. The UI will allow certain modifications to these paths—including giving them titles (and eventually icons) and word goals for the folder, contained groups, and files—but they are otherwise largely immutable and based entirely upon their presence under the path field of the projects. If a particular path has settings and has its final project deleted, then if the user has opted in via settings, the empty paths will be removed. Otherwise, they will remain.

### 2022-05-17
 - Eliminated the project menu in the PMProjectListItem and changed the menu button into an edit and a delete button.
 - Changed the hover-selection of files for the PMFileInfo panel and changed it to click. Added a back button to go back to the current file. This also eliminates the need for fixed height on the info panel, so it can now show as many projects as it needs to.
 - BUGFIX: Deleting the final project in the list, the project is duplicated in the list. This bug was actually specific to tag projects, as push was being used instead of remove. Copy and paste bug.

### 2022-05-15
 - BUGFIX: File Info Panel resizes depending on number of projects.
 - SuggestBox now uses a fuzzy search (utilizing farzher's fuzzysort package).
 - Added wordGoal on a file, project, and group basis. Project also has a file goal, groups have project and file goals. The more specific will always override the more general, so a word goal specified on a file will take precedent over the file word goal set on a project or project group.
 - Updated Project Editor to handle both the project and file word goals.
 - YAML 'word-goal' can be used on a per-file basis.

### 2022-05-13
 - BUGFIX: Project Category is not auto-selected.
 - Added a File Info Panel to the Project Management View.
 - BUG: File Info Panel resizes depending on number of projects, which results in a potentially large file list being displaced, which in turn moves the file info panel top up or down respectively. This usually results in a rapid glitch where it infinitely expands and contracts. Need to determine the best solution to this. Setting a minimum and maximum height are not working as a solution.

### 2022-05-10
 - Fixed last changelog date.
 - BUGFIX: Total line and word count were not aligned properly in Project Management View.
 - BUG: When deleting the final project in the list, somehow that project duplicated and was stored, resulting in exceptions on load.
 - Redesigned project, project group, and project manager serialization to ease validation and help loading outdated formats should that become an issue.
 - Added category to the project. Right now the available categories are None, Writing, and Worldbuilding.
 - BUGFIX: Newly-created file index projects have no files even when they have links (file wasn't updated to collect links until next time that file is updated)
 - BUGFIX: Word count was not updating for project while typing.

### 2022-05-09
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