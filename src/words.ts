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

const CountWords = (text: string): number => {
    let words = 0;

    words = ((text || '').match(RE_WORD) || []).length;

    return words;
};

const SanitizeText = (text: string): string => {
    // this function removes comments and YAML front-matter
    // should this be optional?

    text.replace(RE_YAML_HEADER, ""); // YAML Header
    text.replace(RE_HTML_COMMENT, ""); // HTML comment block
    text.replace(RE_MD_COMMENT, ""); // markdown comments

    // we don't want to count footnote markers (e.g., [^1]) and this has the added benefit of clearing them out in front of their actual content
    text.replace(RE_FOOTNOTE, "");

    // we now need to match [[link|alt]] and [alt](link) bits and replace them with alt
    console.log(text);
    text.replace(RE_WIKILINK, "$2") // [[link|alt text]]
    console.log("-->", text);
    text.replace(RE_MDLINK, "$2") // [alt text](link)
    console.log("-->", text);
    // remove anything inside a ` - [\S]` bit since we don't want the [x] in a checkbox to register as a word
    text.replace(RE_TASK_START, "");

    return text;
};

const CollectText = (text: string): string[] => {
    // this function will return the main text as the first element, after sanitizing,
    // and then any subsequent blocks from transclusions
    let textBlocks: string[] = [];
    return textBlocks;
};