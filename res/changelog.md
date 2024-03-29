## To-Do for 1.0 release
 - Add calendar UI for stats display
 - Create a project overview and reporting system for generating statistics reports.
 - Cleanup any outstanding bugs.

## Changelog
### 2023-05-24 v0.0.5
 - Fixed #14
 - Updated titleEl to selfEl for FileItem view definition.
 - Removed a couple of errant debug statements.
 - No longer caching the file explorer.

### 2022-12-02
 - Potential fix for #14. Could not reproduce on development platform, but new code should prevent NaN from showing up. In this event, no update will be made, so if it was already 0 words, it will stay as 0 words until the next update.
 - Fixed unhandled exception error in StatsDebug.update.
 - Fixed some accessibility issues with Stats view interfaces (onClick without onKeypress).

### 2022-11-10 v0.0.4
 - Bugfix: YAML comments are not parsed as YAML comments if a newline does not appear after the closing dash sequence. Updated the regex to allow $/EOL to work in place of a newline.
 - BugFix: WSFileManager.countAll() now properly re-calculates folder word counts.
 - BugFix: WSFileManager.onDelete() now propagates a word count change.
 - BugFix: WSFileManager.onRename() now propagates a word count change.
 - BugFix: WSFolder.moveChildHere and moveFolderHere now properly set the child or child folder's parent to the new parent. This possibly fixes #13.
 - Bugfix: WSFileManager.setMonitoringForFolder() was not calling triggerFolderUpdate(), resulting in the state not being immediately saved to the database.
 - Fixed #11
 - Added a clear button to the Word Goal modal.
 - Added option to export statistics on a folder basis rather than file basis.
 - Replaced ParanoiaMode setting from on/off to an option to output nothing, file stats, folder stats, or both (these will be in separate CSV files). Note that the option is ignored if you use the "Backup statistics to CSV" command.

### 2022-11-01 v0.0.3
 - Bugfix: StatsDebug.svelte was attempting to run Update() on an uninstantiated display object.

### 2022-11-01 v0.0.2
 - Fixed #6: WSFolders will no longer be included in database.json if they are empty of children (if they are nothing but empty foldersStats exporting will no longer include folders with no children.
 - Fixed #7; WSFileManager.newFolder() was instantiating folders with the folder name as the title, rather than leaving it blank.
 - Fixed #8; Amended StatsPropagate to propagate start time and start words as they were remaining at 0. Also adjusted net words, as that was being left at 0 as well.

### 2022-10-31 v0.0.1
 - Added rounding for WPM, plus correctly indicated WPM/WAPM vs "words" for stats display.
 - Added net words to stats display.
 - Added stats display for ProgressFolder, so stats are now shown encompassing the whole folder.
 - Cleared out old CSS.

### 2022-10-30
 - BUGFIX: WordStats namespace functions were returning sums for statistics that should be returned as individual values (e.g., StartTime, EndTime).
 - BUGFIX: WordStats namespace functions were returning incorrect values for StartWords and EndWords. In the case of StartWords, the startWords should be the beginning word count from the first stat in the collection (sorted by startTime), while the EndWords needs to be the sum total of each individual WSFile's most recent stats object.
 - Removed WordStats functions for certain periods, as those periods should be obtained before sending the array into the functions so that sorts and filters aren't being done multiple times. Added Sort() and SortForPeriod() functions.
 - Added stat propagation to files and folders to keep total stats cached. Recalulation function is available on load and when files are moved/renamed and deleted.
 - Moved stats display out of ProgressFile and ints CachedStatsDisplay so that it can be re-used in ProgressFolder. Made a slightly altered copy called DebugStatDisplay for the debug of individual WSFileStats for the debug view.
 - Updated some Settings text that was out of date, along with many updates to README.md. Preparing for 0.0.1 pre-release.
 - CSS adjustment for recording light colors.
 - Reimplemented Debug View and Day Stats Views.

### 2022-10-29
 - BUGFIX: Stats saving doesn't complete when no files have been changed on load. WordStatisticsPlugin.lastRef was not updated in updateFileWordCountOffline() because newCount was the same as oldCount. It is now saved before the return when word count hasn't changed.
 - BUGFIX: WSFile.getGoalParents() does not return parents that have a word goal but have not set file or folder word goals when there is a WSFolder in between that has no word goal resolution (e.g., Folder 1/Folder 2/Folder 3 if Folder 3 has a goal set, Folder 2 has no word goals set but Folder 1 has just its own word goal set, getGoalParents) would only return Folder 3 rather than the whole hierarchy.
 - BUGFIX: Adding a word to a file without a pre-existing stat object was showing that initial word as imported when it was not. New stat is now initialized and run with the old count and then the later update with the new count updates it appropriately. This eliminates a long-standing issue in previous version where if the first action recorded was deletion, it would show the initial count as 0. Now it shows the initial count and deletion of the words.
 - Made ProgressView a bit more compact.
 - Added a setting for moving the target when a goal doesn't exist. When a goal is unset and the option is unset, the progress bar is solid blue. When Moving Target Mode is enabled and no goal is set, the goal will be increased to the next 10% increment of the current count.
 - Added statistics viewing information to ProgressFile (ProgressFolder is coming). Need to adjust positioning and sizing and then decided whether to leave certain stats out in favour of a different view to be created at a later date. This one is simple but detailed enough to work. ProgressFolder stats may show more basic stats, as I suspect it may get a little slow constantly reducing arrays of data every time there is a debounced change. Will need to cache stats information by sending data with the wordsChanged event so each folder can adjust its stats accordingly.

### 2022-10-28
 - BUGFIX: (ProgressMain) When switching to another file that has as long a folder tree (or longer), those folders are not updated. Svelte was not reactive because the array items were not properly keyed.
 - ProgressMain renaming bug was not a bug. A folder title was in place causing the presumed mismatch.

### 2022-10-27
 - BUGFIX: Changes to folder word goals are not saving.
 - BUGFIX: ProgressMain does no update word goals when they are modified.
 - BUGFIX: ProgressMain does not add new folders to the listing when word goals are set.
 - BUGFIX: Data events are not triggering a save when no stats have changed.
 - BUG: (ProgressMain) When switching to another file that has as long a folder tree (or longer), those folders are not updated. Svelte reactivity seems to have an issue here because the array is the same or greater length. When the array has fewer items, it updates correctly.
 - ~~BUG: (ProgressMain) When renaming a folder, there is a name/title mismatch that occurs, and the title is not updated correctly. May also be an issue in ProgressFolder.~~

### 2022-10-26
 - Re-added ConfirmationBox.ts and SettingItem.svelte
 - Added TextInputBox
 - Added context menu item for setting folder titles
 - Added GoalModal chooser. Currently the goals are not saving.
 - BUG: Changes to folder word goals are not saving.
 - BUGFIX: WordStatsManager.extendStats is run on WSFiles with no stats, resulting in an exception.
 - BUGFIX: Minify database toggle does not work on its own, as it does not force a re-save of the database.
 - BUGFIX: UpdateStats was not updating the end words for first-time WSFileStats.
 - BUGFIX: UpdateStats was incorrectly calculating writing timeout, resulting in a new stat for every update.

### 2022-10-25
 - Added context menu items to set word statistics recording state on folders, and commands to set it for the focused file's parent.
 - BUGFIX: ProgressView was not monitoring changes to statistics recording state.
 - Made ProgressView colour the recording light amber if it is inheriting an on recording state.

### 2022-10-23
 - BUGFIX: Database saving check was returning if the last update was newer than the last save rather than if the last update was older than the last save.
 - BUGFIX: WSFolders were being created with the name duplicated in the title field but title is not updated upon rename as it is independent of filename.
 - Added basename capture for WSFile for use in place of title when one is not set.
 - Removed the titleYAML and goalYAML flags, as they are redundant.
 - Re-implemented ProgressView. ProgressView will show the currently focused file and any folders that have goals up to the outermost folder that has a goal. That is, in Root/Outer/Middle/Inner/File.md, if Inner and Middle have word goals, then both Inner and Middle will be shown in the listing. If Outer and Inner have word goals, Inner, Middle, and Outer will be shown.

### 2022-10-19
 - Purged old TS files that are no longer used for the NewModel branch.
 - Rebuilt layout of current Settings namespaces and moved some settings around. Added new settings for the status bar.
 - Rebuilt status bar with new layout.
 - Added some setting events for updating UI elements when certain settings change.
 - BUGFIX: Main vault wasn't showing full word count on file explorer.
 - BUGFIX: Manager.countAll() was not waiting on the word counts, resulting in word counts not being updated properly on initial load. This may need to be altered if large vaults lag on startup.

### 2022-10-18
 - Re-implemented paranoia CSV exporting.
 - Finished adding sync routines for WordStatsManager to keep stats linked there for access.
 - Commented out all old CSV for the great purge. Will add things back as necessary.
 - Added some logging in to help benchmark building of larger trees and word counting.

### 2022-10-17
 - Moved WSFile methods pertaining to stats into the WordStats namespace in stats.ts, as they will be used broadly on all lists of WSFileStat[].
 - Brought in obsidian-calendar-ui from npm for use in the upcoming Day/Week/Month view.
 - More tweaks to README.md
 - Amended WSFile.canUseLastStat() so always compare self to plugin.lastFile in the end. Failure to do so will result in duration being counted multiple times if a user goes back and forth between multiple files.
 - BUGFIX: WSFile.canUseLastStat() is never used. Corrected by adding to WSFile.updateStats().

### 2022-10-16
 - BUGFIX: canUseLastStat() was not calculating period end properly
 - Added a few more routines to WordStatsManager.

### 2022-10-08, 2022-10-09, 2022-10-10, 2022-10-11, 2022-10-12, 2022-10-13, 2022-10-15
 - Eliminated the old file/folder/tag indexing system and old file/project/path model.
 - Built new File/Folder model to simplify all of the backend project management. Now Paths and Projects have been replaced by folders and they will function in a hierarchical manner. The files have their parent folders accessible, and folders have child folders and files accessible via arrays, so there will be no need to traverse backwards to find something via algorithm when it can be obtained easily by reference. Goals for files and folders for statistical purposes will stem from the parent folder if there is not one set, else it will be 0 if unset all the way up the file tree.
 - The new file model has complete statistics and methods to fire all event triggers related to its use. These will allow internal properties to be set if necessary without triggering, while also providing a quick means of triggering the event.
 - The new system will allow one to open a Word Statistics Properties on folders to set titles and word goals using the context menu or command palette. The Project Management View will be replaced with a listing of watched folders. By default, only folders that are "set to record" will have ongoing statistics recorded.

### 2022-10-02
 - BUGFIX: CSV stats using localTime instead of endTime for end date and end time.
 - BUGFIX: Starting Words is incorrect for time period.
 - CHANGE: Amended start and end words for a time period to be equal to the sum of start words and sum of ends words for all contained files modified during that time period. Previously, this was erroneously not set at all.
 - Added NetWords to both stats views. This is the total added and imported words minus deleted and exported words.

### 2022-10-01
 - Finished ProgressPath.svelte.
 - Broke apart the various progress bars so the bars pertain specifically to whatever progress they're monitoring (File, Project, Path)
 - ProgressFocus shows all paths first, then project, then the focused file. If there are more than one project for a file, it will display the file and then list the projects it is in so the user can clear that up. Eventually, the user will be able to view a particular project or path by request.
 - BUGFIX: StartWords and EndWords in day view is 0.

### 2022-09-30
 - Updated LICENSE to remove reference to plugins from which code was previously borrowed (Validator and Suggestion Box) but now replaced by Svelte.
 - Most of the new ProgressView is in place for the focused file. Eventually, there will be project/path specific ones where you can setup what projects you want to monitor in particular, but this will do for now.
 - TODO: Finished ProgressPath to show the path progress bars.
 - Right now, Progress Bars always assume a goal that is equal to the nearest 10% of the current word count when there is no current goal. This will eventually be an option.

### 2022-09-24
 - Added ProgressView
 - Revised View icons
 - BUGFIX: Files for the TimePeriod (debug) View were not being populated on load.
 - BUGFIX?: Changing project path makes project disappear from project view. (Added event watcher for project path and project index set events)
 - BUGFIX?: Updating the file index for a project does not appear to update the word count. (Added event watcher for project index set events)

### 2022-09-18
 - BUGFIX: CSV export naming is invalid on Windows (due to present of colons)
 - STYLE FIX: "All Projects" adds unnecessary offset. Need to find a way to make it just offset as a heading rather than the root element of the tree.

### 2022-09-17
 - Added paranoia mode.
 - BUGFIX: Paranoia mode sometimes fails if the main collection systems haven't loaded yet.
 - BUGFIX: WordsChanged event was only firing when monitoring was on for the given file.

### 2022-09-04
 - BUGFIX: Progress bars in the status bar are invisible with the default theme.
 - Added command to export stats to CSV for backup purposes.
 - Updated README.md.
 - Updates for Obsidian 0.16.0 API changes to Debouncer and debounce().
 - Updated statistics.ts and respective views to use Luxon's DateTime. This will allow custom date and time formats.
 - Removed old WSCountHistory and respective interfaces.

### 2022-08-20
 - Moved next and previous buttons to top of the stats debug view.
 - BUGFIX: Next and previous buttons were not updating properly
 - BUGFIX: (Could not replicate) Certain statistic properties are null in successive time periods

### 2022-08-17
 - BUGFIX: Setting for which files to log stats for was ignored.
 - BUGFIX: TimePeriod (previously StatObj) next and previous buttons were not centered.
 - Completed new stats model. Further cleanup.
 - Cleanup and rebuild of StatObj.svelte into TimePeriod.svelte, which is now not file-sensitive. Because TimePeriod.svelte is basically the debug view of the internal object, it does encompass all files held within it, so it does receive updates and will change as appropriate. To accommodate this, events are fired when new files are touched in the stats manager.

### 2022-08-13
 - Cleaned up some old serialization code.
 - Designing new stats model based on WSTimePeriod. Under the existing design, quickly going back and forth between two files could result in one 15 minute period showing up as 30 minutes of writing.

### 2022-07-28
 - BUGFIX: Queued silent updates resulted in undefined lastWordAt and endTime values as it was passing undefined to the queue in place of the updateTime.
 - BUGFIX: StatObj.svelte threw an exception when currentStat was undefined (i.e., first time a stab object is created).

### 2022-07-25
 - Additional CSS
 - Now have Previous Day, Yesterday, Today, Next Day buttons for DayStats.svelte.

### 2022-07-22
  - BUGFIX: DayStats does not load intially until an update.
  - BUGFIX: & writing time can yield NaN if a word is added as the first typing entry. Made the minimum writing time/duration as 1 for the calculation
  - BUGFIX: Not tracking time properly as only when a keystroke yields a word count change does the stats system receive an update. Added a WordsUpdated event (first WordsChanged) to trigger updates for these and a silent update method for the stats manager from WSDataColector.logWords(). There is still the possibility of missing some updates as a result of using debounce for updates, but this will only affect words added/deleted counts if doing rapid and repeated cut/paste operations. Final count should stil be picked up.

### 2022-07-21
 - Added words imported/exported to StatObj.svelte
 - WSCountHistory.update() now has separate functions for creating the first counter object for a history and the next ones so they the added/deleted/imported/exported words are set correctly
 - BUGFIX: Duration was being reported as endTime - startTime - air instead of endTime - (startTime + air) in getPercentTimeSpentWriting and getDuration
 - DayStats now shows today's stats.
 - BUG: DayStats does not load initially until first update.

### 2022-07-20
 - Started work on Today Mode for Statistics View.

### 2022-07-19
 - Pulled current stats view into a new Svelte file specificaly for showing the IWordStat objects. This will become the debug viewer. Added debug view button to the main StatisticsPane.

### 2022-07-18
 - BUGFIX: Buttons have no disabled styling.
 - BUGFIX: Next button in Stats view not disabled when it should be.
 - BUGFIX: onWordCountChange was not updating the stat view index.
 - Added setting for the stats panel view mode, which will be stored to open the panel to the appropriate view mode. Right now the default is the debug view mode, which shows most of the internal structure of each stat object.
 - Added some to-do notes.

### 2022-07-17
 - BUGFIX: Settings sliders don't show their value, which makes it hard to apply settings. Didn't realize the need to use setDynamicTooltip().
 - Implemented Imported and Exported words for word statistics. These values will take care of issues where word counts have changed outside of Obsidian. It can also later be used to perhaps plug into clipboard events to not include pasted text as words added, as that can wildly break WPM stats. Made WSDataCollector.logWords() pass the old word count along with the new word count to ensure all changes are handled properly. The update routine will now initialize a new IWordCount and then run the update to ensure any changes are accommodated.
 - Revamped Settings code with namespaces.
 - Updated statistics settings.
 - Changed default writingTimeout to 120 seconds.
 - Removed history consolidation for now. Need to find a way to work in time zone issues. For now all time periods are 15 minutes long, so at most 4 entries per hour for each file.
 - Added next/prev buttons to the basic stats history view.

### 2022-07-16
 - Added methods to retrieve stats history based on project and time periods
 - Completed WPM stats code

### 2022-07-14
 - Started adding WPM stats code
 - Adjusted time period calculation to make everything always fall within 15 minute segments, so that will be the maximum time period for recent history so adjustments will be made to future segments to ensure there is no overlap beyond those periods. May just make 15 minutes the normal length for period instead of configurable.

### 2022-07-13
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
 - BUG: SuggestBox key navigation doesn't work, nor does selecting an option

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