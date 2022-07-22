# Caution
__Please be aware that any modification of your files outside of Obsidian could break project and statistic storage. Please ensure you regularly backup your data.__

__This plugin is BETA software. Please ensure you regularly backup your data. Should you encounter any issues, please file a bug report or contact me in Discord for assistance.__

# Obsidian Word Statistics

This will be a plugin for [Obsidian](https://obsidian.md) that tracks word count statistics.

`/((?:\p{L}\.)+)|(?:\p{N}+(?:[\.,]\p{N}{3})+(?:[\.,]\p{N}+)?)|((?:\p{N}+[\.,])+\p{N}+?)|(\p{N}+(?:\p{Ps}\S+\p{Pe})*)|((?:(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?=[\p{L}\p{N}])))+)(?:(?:-|\u2011)(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?<=[\p{L}\p{N}])))+)*)/gmu`

(Considering replacing any `\p{L}\p{N}` bits with this: `[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]`
as recommended by UTS18 for Unicode representation of \w in Regular Expressions)

The basic word-counting algorithm, represented by the above regular expression, is made up of a couple of small pieces. First and foremost, we runs checks for certain edge cases.

1. Acronyms that utilize a period.
2. Numbers with thousands separators (and optional decimals)
3. Decimal numbers and decimal number-based statements that you might see in non-fiction, (e.g., 'Please refer to 1.2.2').
4. One edge-case comes up in legal writings. For example, `18 U.S.C. 924(a)(1)(B)` is said to have only 3 words in it. The first two are adequately captured by just general numbers and the period-delimited acronym edge case, but the number followed by sections in parentheses are not. I've added an edgecase that allows not just parentheses but also other forms of brackets.

The final statement is the basic word counting regex. The statement reads thus: Any sequence of letters or numbers or (a single dumb apostrophe or closing single quote both preceded by and followed by a letter or number) and optionally followed by the same with a connecting hyphen or non-breaking hyphen. This allows us to count hyphenated words as a single compound word.

Prior to counting words, the content of comments and YAML blocks will be removed from the to-be-counted text. Contents of links are adjusted for both types of links so only the appropriate text is counted.

## Acknowledgements
 - Isaac Lyman's [Novel Word Count](https://github.com/isaaclyman/novel-word-count-obsidian) plugin for the idea to show word counts in the file explorer and some implementation and CSS details.

## Limitations
### Non-English Languages
As far as I am aware, this only works with English as I have little experience working with non-English languages. This should theoretically work fairly consistently across English-like languages, but if they have different rules with respect to apostrophes and hyphens and their place in determining word boundaries, the counts will definitely be off.

By all means, please log an issue with respect to your language, being sure to provide example text and the correct word counts and I will attempt to implement support.

### Code blocks and embeds
Short of determining an adequate means of pre-rendering the content, any YAML block content in code blocks for things such as admonitions and dataview is likely to be included, and the contents of embeds is likely to not be. The latter, however, may be possible by loading the content of the markdown file and running it through the script (and so on and so forth), while maintaining a list of included files to ensure they are not included twice (in the case of recursive embeds or where two embeds embed the same document).

One caveat to note is that the word counts stored for a particular document will not include the embed. It will be for display purposes only, as the original file that is referenced will be the one storing its own word count.

## Features
- [x] Basic word counting
- [x] Custom status bar for word counts
- [x] Project-based counting
    - [ ] Compatibility with Longform project index
- [x] Word count statistics (see below for more information)
- [x] Project manager view
- [x] Statistics view
- [ ] Per-project statistics tables via code blocks
- [x] Per-project statistics tables via command (i.e., Markdown tables that could be included in daily notes to show progress on a particular project over time.)
- [x] Per-project word goals
    - [x] Macro (i.e., project word goal)
    - [x] Micro (i.e., individual note word goals, overridable on a per note basis)
    - [x] Progress indicators (status bar)
    - [ ] Progress indicators (tables)
- [ ] Word counts for highlighted words (I believe now with CM6 that these may be universal, but I have separated them out in case they are not)
    - [ ] In Editor
    - [ ] In Rendered View
    - [ ] Legacy editor? (Maybe; since the legacy editor will eventually be removed, not sure there is a huge userbase for whom this would be a useful feature.)

## Word Count Statistics
### Overview
Word Count Statistics can track words added and words deleted over time for all files, just project files, or just specific project files (tracked on the project level). It also tracks writing time (time spent writing) as configured under settings. Word count changes that occur outside of Obsidian will be recorded as words imported or exported.

All times saved are saved in UTC to avoid time zone issues but will be viewed in local time. Word count statistics are batched in time periods of 15 minutes, which are calculated to always be discrete 15 minute periods (this has been chosen due to 30- and 45-minute time zones).

Recent history (or all history if )

### Configuration
 - Monitor: Choose if word count statistics are monitored for All (Markdown) Files, just Project Files (those included as part of a project), or just Monitored Project Files (files included in projects that have been configured to record word statistics). Note that previously-recorded stats will not be removed if you change options.
 - Writing Timeout: This configures the window in which you will still be considered writing

### Tracked Statistics
 - Words Added: Any time the word count goes up, it counts as words added.
 - Words Deleted: Any time the word count goes down, it counts as words deleted.
 - Writing time: Any time during which you are adding or deleting words is considered writing time.
 - Words Imported: Any time the word count goes up outside of Obsidian, it is considered imported.
 - Words Exported: Any time the word count goes down outside of Obsidian, it is considered exported.

Note that if Obsidian when a file is changed in an external editor and a change is made within Obsidian to that file within the 15 minute time period, it will show up as words added/deleted instead of imported/exported.

### Time Periods
Time periods are 15 minutes long and are calculcated to begin at exactly the :00, :15, :30, and :45 minute park of each hour UTC. This was chosen due to time zones that have 30 or 45 minute adjustments from UTC. The difference between when you actually start typing and the start of these periods is referred to as "air". This way you can still get proper WPM statistics.

Writing time interacts with time periods. If you stop typing and later resume typing before the writing timeout has expired and the time period has not yet ended, your writing time will be adjusted as though you had not stopped writing. If the time period had ended, writing time will not be adjusted and will instead begin anew in the new time period.

### WPM
There are 4 WPM statistics:
 - WPM: Words per minute, which is equal to the number of words added divided by the duration of the period, minus air.
 - WPMA: Words per minute (adjusted), which is equal to the number of words added divided by writing time (this is pretty close to typing speed unless you make a lot of brief stops during writing)
 - NWPM: Net words per minute, which is equal to the net words (words added - words deleted) divided by the duration of the period, minus air.
 - NWPMA: Net words per minute (adjusted), which is equal to the net words divided by writing time.

### Note
If the first change that is made to a file to be recorded in history is deletion, the initial word count that will show for that file will be the word count post-deletion.

## Planned Features
- [ ] Non-English language support - The main challenge with this feature is in coming up with some universal regex for counting words. Mine is potentially more robust than the internal word counting algorithm, but the internal one is supposedly multi-lingual, which mine is not. I will need test cases and breakdowns of what results are obtained and what results _should_ be obtained in order to make the necessary determinations for counting non-English words.
- [ ] Clipboard fixes - A big challenge for the statistics is the handling of the clipboard and clipboard activities. If you paste in text, it will invalidate your WPM statistics, as you could potentially be adding hundreds or even thousands of words in a split-second. Words imported will eventually be used to record when things are pasted in. Determining just how to work that code-wise is proving to be a bit of a challenge, however.

## Future Possibilities
- [ ] Statistics graphs
- [ ] Word sprint functionality
- [ ] XP and Level system
- [ ] Achievement system
- [ ] Clipboard-related word count deferrals
    - We may need to add words moved in and words moved out if it's possible to monitor clipboard-related activity that changes word counts. This would be ideal to ensure moved content does not count as words added or deleted, as it is simply being moved around. At the same time we need to track when words are cut because they are in fact deleted if they do not then get pasted back in.

## Installation
### Via GitHub
- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

### Manually installing the plugin
- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-word-statistics`.

### Via BRAT
- Add `MalignantCarp/obsidian-word-statistics` to your Beta Plugin List

