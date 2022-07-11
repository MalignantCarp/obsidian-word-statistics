export const FormatWords = (words: number): string => {
    return Intl.NumberFormat().format(words) + " " + (words == 1 ? "word" : "words");
};

export const FormatNumber = (words: number): string => {
    return Intl.NumberFormat().format(words);
};

export const RightWordForNumber = (num: number, singular: string, plural: string, padLeft: boolean = true) => {
    return (padLeft ? " " : "") + (num == 1 ? singular : plural);
}

export const SecondsToHMS = (seconds: number) => {
    return new Date(seconds * 1000).toISOString().slice(11, 19);
}

export const GetProgressGrade = (percent: number): string => {
    if (percent < 25) return "1"; // 0-24
    if (percent < 50) return "2"; // 25-49
    if (percent < 75) return "3"; // 50-74
    if (percent < 90) return "4"; // 75-89
    if (percent < 100) return "5"; // 90-99
    return "6"; // 100
};

export const FindRawText = (el: Node): string => {
    /* This function returns the raw text found within the given node's childNodes, unless contained in <pre> or <code> blocks.
    This function should only be run on <p> and similar text-bearing elements and not text nodes, or it will return nothing.
    */
    let rawText = "";

    // console.log ("Node is ", el);
    for (var i = 0; i < el.childNodes.length; i++) {
        let child = el.childNodes[i];
        // console.log ("Childnode[%d]: %s", i, child.nodeType);
        // console.log ("Offset is %d", offset);

        let ignore = ["pre", "code"];
        let pars = ["p", "li", "div", "ol", "ul"];

        if (child.nodeType == child.ELEMENT_NODE) {
            let el = <HTMLElement>child;
            if (el.className.search("frontmatter") == -1) {
                let childText = FindRawText(child);
                if (childText) {
                    if (ignore.contains(child.nodeName.toLowerCase())) {
                        rawText += " ".repeat(childText.length);
                    } else {
                        rawText += childText;
                    }
                }
                if (pars.contains(child.nodeName.toLowerCase())) {
                    rawText += " "; // otherwise there is no separation between divs, paragraphs, etc. and text runs together
                }
            } else {
                //console.log ("Skipping frontmatter.");
            }
        } else if (child.nodeType == child.TEXT_NODE) {
            rawText += child.nodeValue;
        } else {
            //console.log ("Skipping node of type '%s': [%s]", type, child);
        }
    }
    return rawText;
};