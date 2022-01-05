(_**This plugin doesn't actually do anything yet.**_)

# Obsidian Word Statistics

This will be a plugin for Obsidian (https://obsidian.md) that tracks word count statistics.

`/((?:\p{L}\.)+)|(?:\p{N}+(?:[\.,]\p{N}{3})+(?:[\.,]\p{N}+)?)|((?:\p{N}+[\.,])+\p{N}+?)|(\p{N}+(?:\p{Ps}\S+\p{Pe})*)|((?:(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?=[\p{L}\p{N}])))+)(?:(?:-|\u2011)(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?<=[\p{L}\p{N}])))+)*)/gmu`

(Considering replacing any \p{L}\p{N} bits with this: \[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}\]
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
- [ ] Basic word counting
- [ ] Custom status bar for display stats
- [ ] Historical word counts stored on a per file basis (with rename and relocation tracking)

## Planned Features
- [ ] Project-based counting and progress indicators (including progress bars)
- [ ] Non-English language support
- [ ] Statistic tables
- [ ] Per-project statistics tables
- [ ] Statistic table embeds (for home pages, indices, and the like) through code blocks

## Future Possibilities
- [ ] Statistics graphs
- [ ] Word sprint functionality
- [ ] XP and Level system
- [ ] Achievement system

## Installation
### Via GitHub
- Clone this repo.
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode.

### Manually installing the plugin
- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-word-statistics`.

### Via BRAT
- Add `MalignantCarp/obsidian-word-statistics` to your Beta Plugin List

