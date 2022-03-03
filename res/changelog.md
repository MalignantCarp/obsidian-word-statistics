2022-03-02
 - Further work on new project system, sadly not much today.
 TODO: Pull table settings into settings.ts for the main settings and just have the table modal select the project

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