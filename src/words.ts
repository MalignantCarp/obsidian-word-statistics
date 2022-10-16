const RE_WORD = /((?:\p{L}\.)+)|(?:\p{N}+(?:[\.,]\p{N}{3})+(?:[\.,]\p{N}+)?)|((?:\p{N}+[\.,])+\p{N}+?)|(\p{N}+(?:\p{Ps}\S+\p{Pe})*)|((?:(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?=[\p{L}\p{N}])))+)(?:(?:-|\u2011)(?:[\p{L}\p{N}]|(?:(?<=[\p{L}\p{N}])['\u2019](?<=[\p{L}\p{N}])))+)*)/gmu;

// Considering replacing any \p{L}\p{N} bits with this: [\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Connector_Punctuation}\p{Join_Control}]
// Recommended by UTS18 for Unicode representation of \w

const RE_WIKILINK = /(?<!\^)(\[{2}[^|\]]*?\|)(.*?)(\]{2})/gmu;
const RE_MDLINK = /(?<!\^|\[)(\[)(?!\[)(.*?)(\]{1})(\(\S*\))/gmu;
const RE_YAML_HEADER = /^---\n.*?\n---\n/s;
const RE_HTML_COMMENT = /<!--.*?-->/sg;
const RE_MD_COMMENT = /%%.*?%%/sg;
const RE_FOOTNOTE = /\[^[\P{L}\P{N}_]+\]/gum;
const RE_TASK_START = /(^\s*-\s\[\S\]\s)/gmu;
const RE_EMBED = /(?:!\[\[)(.*?)(?:\]\])/gm;
const RE_EMBED_CONTENT = /(?<=!\[\[)(.*?)(?=\]\])/gm;
const RE_HTML_EMBED = /<iframe.*?<\/iframe>/gms;
const RE_HTML_TAG = /(?<!\\)\<\/?.*?(?!\\)>/gms;

const CountWords = (text: string): number => {
    let words = 0;

    words = ((text || '').match(RE_WORD) || []).length;

    return words;
};

const SanitizeText = (text: string): string => {
    // this function removes comments and YAML front-matter
    // should this be optional?

    text = text.replace(RE_YAML_HEADER, ""); // YAML Header
    text = text.replace(RE_HTML_COMMENT, ""); // HTML comment block
    text = text.replace(RE_MD_COMMENT, ""); // markdown comments

    // we don't want to count footnote markers (e.g., [^1]) and this has the added benefit of clearing them out in front of their actual content
    text = text.replace(RE_FOOTNOTE, "");

    // we now need to match [[link|alt]] and [alt](link) bits and replace them with alt
    // console.log(text);
    text = text.replace(RE_WIKILINK, "$2"); // [[link|alt text]]
    // console.log("-->", text);
    text = text.replace(RE_MDLINK, "$2"); // [alt text](link)
    // console.log("-->", text);
    // remove anything inside a ` - [\S]` bit since we don't want the [x] in a checkbox to register as a word
    text = text.replace(RE_TASK_START, "");

    // remove HTML embeds
    text = text.replace(RE_HTML_EMBED, "");

    // we should probably attempt to identify other HTML tags and remove the tags themselves, leaving any text content
    // since we've already wiped out comments, this shouldn't be problematic.
    text = text.replace(RE_HTML_TAG, "");

    // remove markdown embeds
    text = text.replace(RE_EMBED, ""); // these will have already been collected to be catalogued as required

    // we can probably ignore whatever is in code blocks as well, with the exception of admonitions. Need to examine all the use cases.
    // Probably can ignore the first line with the backticks

    return text;
};

const CollectEmbeds = (text: string): string[] => {
    let embeds: string[] = [];

    embeds = ((text || '').match(RE_EMBED_CONTENT) || []);
    // we need to clear image and other non-vault entities out

    // we need to extract the content of the embeds by calling up the links making sure to not infinitely recurse
    // may be worth looking at Quoth to possibly support its embeds as well
    // remember that if there are any #headings referenced in the embed declaration, we need to only include what is bound to that
    // heading

    return embeds;
};

const CollectText = (text: string): [string, string[]] => {
    // this function will return the main text as the first element, after sanitizing,
    // and then any subsequent blocks from transclusions
    let embedContent = CollectEmbeds(text);
    let wordText = SanitizeText(text);
    return [wordText, embedContent];
};

/* Blurb from a comment on clipboard-related stuff in case it helps development:

This is kind of tricky business. I've got it in mind for my own word statistics plugin, but I haven't been able to conceptualize a good way of handling this sort of behaviour.

The challenge here is that the means for counting words is to count the words in a file periodically and do the math on the change in word count within the file. So if you delete text (whether that is with delete, backspace, or cut), the words in the file have decreased, thus we count them as deleted. Similarly, with pasting, the words are increased, so words are added.

I've pondered this sort of dilemma a lot over the years with various plans to make my own writing software, but never really came up with a great answer to the problem. The other issue that crops up, too, is say you cut a piece of text with the intention of pasting it back in, but forget. You close the program or end up copying something else and now can't paste it in. Now if you're using version control, you can just check the diff, grab that text, and paste it back in wherever you intended to in that original session. Now ideally, this would have counted as moved words (for lack of a better qualifier), but if you had to retrieve it from outside, now you have a bit of a problem because you can't tell it was cut from somewhere in the project and not just newly added. What if you just happened to write it in a different application and were now pasting it in? It's new words and should be counted as words added. (This probably wouldn't be an issue in this particular context of the word sprint plugin, but for the topic in general...)

The only clear way I've been able to come up with in my mind is to track additional variables—words moved in and words moved out. That would be your paste and cut, respectively. The only caveat is you need a means of tracking when something is pasted in that may have been copied from elsewhere, because that needs a prompt of some kind to ask, "is this new material, or is this a paste from elsewhere in the project?" Short of keeping a log of everything cut, which I don't believe is possible from the plugin context, and matching that to what is being pasted it, I don't see a good means of doing that, which does give us a bit of a problem, at least in the context of tracking word statistics in general.

For the context of this plugin for word sprints, if there is a means of determining the number of words pasted or cut when such an action occurs, it is conceivable to implement an option wherein pasted content would be subtracted from the total word count and cut content would be added, thus nullifying their respective change to the total word count. This would definitely need to be implemented after or in conjunction to #19 due to the issues surrounding moving into different files. But that hinges entirely upon whether or not what was pasted or cut is available to the plugin context. You must remember also, the word count could be off if what was cut or pasted connected two words, as the words of the cut or pasted content would probably need to be counted separately. Short of monitoring CM6 for the cursor position, I don't see a way to correct for that, but it would only be off by 1 or 2 (potential word connections at the start and end).

Things become even more complicated if you consider the use of undo and redo, as I suspect they will result in word counts getting skewed. I don't really see any solution to that issue, short of watching for undo/redo events (if that's possible). The issue with that would be keeping a log of all word count deltas and trying to determine which ones need to be reversed after the undo/redo. I would suspect no plugin could handle that.

*/

const WordCountForText = (text: string): number => {
    let [wordText, embedContent] = CollectText(text);
    let words = CountWords(wordText);
    return (words);
}

const CharacterCountForText = (text: string): number => {
    let [wordText, embedContent] = CollectText(text);
    return wordText.length;
}

const CharacterCountForTextRaw = (text: string): number => {
    return text.length;
}

export {CollectText, CountWords, WordCountForText, CharacterCountForText, CharacterCountForTextRaw};