 - [ ] TODO: Finish up the WSProjectManager class with respect to building project indices so that a project has contents.
  - [ ] Take a look at Longform to ensure it is possible to integrate a Longform project. Figure out a means of specifying something is a Longform project so that the interface for creating projects can accommodate this.
 - [ ] TODO: Refactor WSFileRef and WSProject systems to simply where possible
 - [ ] TODO: Interface for creating projects -- this should be built so that it can be put in the sidebar in addition to the settings window, ideally without having to replicate code.
 - [ ] TODO: Build view for project creation - Examine Fantasy Calendar's view and perhaps Svelte

2022-03-06
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

2022-03-04
 - Added WSProjectRef interface and array added to plugin settings to store project list.
  - WSPluginRef allows a choice of using a tag, folder, or file as the index for the project.
  - Added WSPIndexType enum for the three types of indices, along with their relevant setters and getter.
 - Cleanup
  - Removed Collector from WSPluginRef was it was not used)
  - Migrated interfaces to their respective project files. No point in having them separate in a types.ts file when they are rarely used outside of their context. It is likely some of them won't even need to be exported.


2022-03-03
 - [x] ~~TODO: Pull table settings into settings.ts for the main settings and just have the table modal select the project~~
 - More cleanup.
 - ProjectManager.getProject() will now return null if the project does not exist. Previously it created the project.
 - ProjectManager has a newProject() routine now. It will return null if the project name is already in use.

2022-03-02
 - Further work on new project system, sadly not much today.
 
2022-03-01
 - Scrapped old project system and links/backlinks. WSFileRefs will now just keep track of file-related things, such as current title, word count, etc.
 - Built new project manager and project ref classes that are solely responsible for everything project-related.
 - Renamed Collector => WSDataCollector
 - Deferred project-management tasks from WSDataCollector to WSProjectManager
 - ProjectManager will now manage project files. The projects will be created through a modal and settings, and possibly later a leaf.

2022-02-28
 - Collector.getProjectWordsTotal() was missing return words

2022-02-27
 - WSFileRef now includes titles for backlinks; added setting to make use of this
 - Moved all validation for WSFileRefs into WSFileRefs, they will handle all addition and deletion of cross-referencing
 - Started tables.ts with table-building functionality. Table ssettings are available through a modal for now. Default settings should ideally be configurable, as should currently-in-use settings (i.e., there should be a flag to save current settings as the default or to save them for the session, so both of these scenarios will need a particular setting in the plugin settings)

2022-02-26
 - Fixed a bug in WordStatisticsPlugin.onInterval() that resulted in an exception when the view object had no file or when the view object itself was null. The interval update will not indicate total words in the vault when there is no active view and/or file.
 - Data collector now handles file deletion.
 - Data collector now can retrieve total project word count and project file list

2022-02-25
 - Project map will now use ID number to avoid having to change any path string keys. ID will remain constant for the life of the plugin.
 - Project map builds automatically based on updates to files. Will need to determine when the update function should be run for a given TFile. Right now it is only run once upon vault sync, but it should ideally be run whenever front matter or links change on a file. Need to determine if there is a way to keep an eye out for that particular kind of change.

2022-02-24
 - There is now a means of determining word count for rendered text in a preview window currently commented out in WordStatisticsPlugin.onLeafChange().
 - Added YAML tag determination. Now need to build the project map.

2022-02-23
 - Laid groundwork for project system. We are going to utilize three YAML tags initially. We may amend this to being able to include folders, etc from settings, but for now we are going to go ahead and just move forward with this.
 - Renamed WCFileRef to WSFileRec (WS for Word Stats)

2022-02-22
 - Finished data collector. Now updates status bar when there has been a change behind the scenes in the collector.

2022-02-04
 - Added words.ts functions for getting character counts of both countable text (i.e., without comments, embeds, links, etc.) and raw text.
 - Added data collector.
 - No commit.

2022-02-01
 - Word counting for current active Markdown editor is complete. Haven't fully tested with editor/source/legacy, but it should theoretically work.
 - NEXT TODO:
   - Selection word counting (this will be a challenge as need to extend CM6 and then the issue is the legacy editor, so will need to solve that issue as well)
   - Recording of current word counts (already have code in to monitor file renaming from within Obsidian; will also need a means of reconciling such changes outside of Obsidian)
   - Once recording of current word counts is complete, ongoing statistics. At this point will need to watch on-paste event and possibly monitor CM6 as well for cut/paste to properly account for imported text and possibly "moved" text.

2022-01-06
 - First steps on getting word counting running. Next up will be evaluating efficiency and then handling the status bar, and then the basic functionality will be complete and it will be on to the more difficult work.

2022-01-05
 - Added some more regex work mostly. Will likely start working on the main word counting stuff tomorrow and will handle embeds afterwards.

2022-01-04
 - Added words.ts with the first of our functions. Should hopefully have basic word counting of Markdown content by the weekend, hopefully in the status bar.