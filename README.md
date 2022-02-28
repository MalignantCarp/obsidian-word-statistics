# Obsidian Word Statistics

This will be a plugin for Obsidian (https://obsidian.md) that tracks word count statistics.

`/((?:\p{L}\.)+)|(?:\p{N}+(?:[\.,]\p{N}{3})+(?:[\.,]\p{N}+)?)|((?:\p{N}+[\.,])+\p{N}+?)|(\p{N}+(?:\p{Ps}\S+\p{Pe})*)|((?:(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?=[\p{L}\p{N}])))+)(?:(?:-|\u2011)(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?<=[\p{L}\p{N}])))+)*)/gmu`

(Considering replacing any `\p{L}\p{N}` bits with this: `[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]`
as recommended by UTS18 for Unicode representation of \w in Regular Expressions)

The basic word-counting algorithm, represented by the above regular expression, is made up of a couple of small pieces. First and foremost, we runs checks for certain edge cases.

1. Acronyms that utilize a period.
2. Numbers with thousands separators (and optional decimals)
3. Decimal numbers and decimal number-based statements that you might see in non-fiction, (e.g., 'Please refer to 1.2.2').
4. One edge-case comes up in legal writings. For example, `18 U.S.C. 924(a)(1)(B)` is said to have only 3 words in it. The first two are adequately captured by just general numbers and the period-delimited acronym edge case, but the number followed by sections in parentheses are not. We've added an edgecase that allows not just parentheses but also other forms of brackets.

The final statement is the basic word counting regex. The statement reads thus: Any sequence of letters or numbers or (a single dumb apostrophe or closing single quote both preceded by and followed by a letter or number) and optionally followed by the same with a connecting hyphen or non-breaking hyphen. This allows us to count hyphenated words as a single word.

Prior to counting words, the content of comments and YAML blocks will be removed from the to-be-counted text. I will also ensure that the contents of links are adjusted for both types of links so only the appropriate text is counted.

## Limitations
### Non-English Languages
As far as I am aware, this only works with English as I have little experience working with non-English languages. This should theoretically work fairly consistently across English-like languages, but if they have different rules with respect to apostrophes and hyphens and their place in determining word boundaries, the counts will definitely be off.

By all means, please log an issue with respect to your language, being sure to provide example text and the correct word counts and I will attempt to implement support.

### Code blocks and embeds
Short of determining an adequate means of pre-rendering the content, any YAML block content in code blocks for things such as admonitions and dataview is likely to be included, and the contents of embeds is likely to not be. The latter, however, may be possible by loading the content of the markdown file and running it through the script (and so on and so forth), while maintaining a list of included files to ensure they are not included twice (in the case of recursive embeds or where two embeds embed the same document).

One caveat to note is that the word counts stored for a particular document will not include the embed. It will be for display purposes only, as the original file that is referenced will be the one storing its own word count.

## Features
- [x] Basic word counting
- [x] Custom status bar for word counts - currently shows current note words/total words
- [x] Project-based counting
- [ ] Per-project statistics tables via code blocks
- [ ] Per-project statistics tables via command (i.e., Markdown tables that could be included in daily notes to show progress on a particular project over time.)
- [ ] Per-project word goals
    - [ ] Macro (i.e., project word goal)
    - [ ] Micro (i.e., individual note word goals, overridable on a per note basis)
    - [ ] Progress indicators (status bar)
    - [ ] Progress indicators (tables)
- [ ] Word counts for highlighted words (I believe now with CM6 that these may be universal, but I have separated them out in case they are not)
    - [ ] In Editor
    - [ ] In Rendered View
    - [ ] Legacy editor? (Maybe; since the legacy editor will eventually be removed, not sure there is a huge userbase for whom this would be a useful feature.)

## Planned Features
- [ ] Compatibility with Longform project index
- [ ] Per-section breakdown of notes (i.e., utilizing headings to break up counting)
- [ ] Historical word counts stored on a per file basis (with rename and relocation tracking)
    - The main caveats of this functionality are:
        - external modification of notes, since there is no way to account for these in determining the time during which the change in word count occurred
        - clipboard-related changes (i.e., cut/paste), since these can both move, duplicate, and delete words (see below on clipboard-related word count deferrals)
- [ ] Non-English language support - The main challenge with this feature is in coming up with some universal regex for counting words. Mine is potentially more robust than the internal word counting algorithm, but the internal one is supposedly multi-lingual, which mine is not. I will need test cases and breakdowns of what results are obtained and what results _should_ be obtained in order to make the necessary determinations for counting non-English words.

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

