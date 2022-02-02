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