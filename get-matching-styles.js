/**
 * Matching Styles parses component and resolves all css rules
 */
window.debug = false;

/**
 * initialize rendering of css rules into CSS-Tab
 */
var initStyleRendering = function () {
	"use strict";

	var viewList = document.querySelectorAll('.component-view');
	for (var i = 0; viewList !== null && i < viewList.length; ++i) {
		var el = viewList[i], example = el.querySelector('.styleguide-example > *'), cssBlock = el.querySelector('code.css'),
			iframe = el.querySelector('iframe');

		var domNode = iframe ? iframe.contentDocument : el.querySelector('.styleguide-example');
		var styleSheets = iframe ? iframe.contentDocument.styleSheets : document.styleSheets;

		if (domNode !== null && cssBlock !== null) {
			MatchingStyles(domNode, cssBlock, styleSheets)
				.then(function (result) {
					result.css.innerText = result.rules.join("\n");
					hljs.highlightBlock(result.css);
				})
				.catch(function (css) {
					window.debug && console.debug('Error loading stylesheets');
					css.innerText = '// CSS processing failed, please reload page';
				});
		}
	}
};

/**
 * get used styles from document
 * @return {Promise}
 */
var MatchingStyles = function (domNode, cssCodeElement, stylesheets) {
    var cssRules = [];
	stylesheets = stylesheets || domNode.styleSheets || null;

    return new Promise(function (resolve, reject) {
        /**
         * walk through all cssrules and push matching rules to list
         */
        var currentSheet;

        cssRules = [];
        if (stylesheets === null || typeof stylesheets === "undefined") {
            reject(cssCodeElement);
            return;
        }
        if (stylesheets.length === 0) {
            reject(cssCodeElement);
            return;
        }
        for (var i = 0; i < stylesheets.length; ++i) {
            if (stylesheets[i].cssRules !== null) {
                currentSheet = stylesheets[i];
                for (var j = 0; j < currentSheet.cssRules.length; ++j) {
                    if (matchesSelector(domNode, currentSheet.cssRules[j].selectorText)) {
                        cssRules.push(replaceUnicodeCssChars(currentSheet.cssRules[j].cssText));
                        window.debug && console.debug('Rule:', currentSheet.cssRules[j].selectorText, currentSheet.cssRules[j].style.cssText);
                    }
                }
            }
        }
        resolve({rules: cssRules, css: cssCodeElement});
    });

    /**
     * Replace unicode chars with their css-unicode definitions
     * replaces \e000 until \efff (used in some icon fonts)
     */
    function replaceUnicodeCssChars(string) {
        return string.replace(/[\uE000-\uEFFF]/g, function (char) {
            return '\\' + char.charCodeAt(0).toString(16);
        });
    }

    /**
     * Check if document contains matching elements
     * @param domNode
     * @param selector
     * @returns {boolean}
     */
    function matchesSelector(domNode, selector) {
	    var isMatching = false;
	    var rejectPattern = /(\.visualize\-example|\.styleguide|\.ignore\-styleguide\-rule)/;
	    if (typeof selector === "undefined") {
		    return isMatching;
	    }

	    if (selector.match(rejectPattern)) {
		    isMatching = false;
		    window.debug && console.debug('ignoring rule by pattern:', selector);
		    return isMatching;
	    }

	    if (domNode.querySelector(selector) !== null) {
		    isMatching = true;
		    return isMatching;
	    }

	    try {
		    selector = selector.replace(/::?(after|before|hover|active|focus|invalid|required|valid|visited|checked)/g, '');
		    selector = selector.replace(/:not\(\)/g, '');
		    isMatching = (domNode.querySelector(selector) !== null);
	    } catch (e) {
		    window.debug && console.debug(e, selector);
	    }

	    return isMatching;
    }
};

document.addEventListener("readystatechange", function () {
    if (document.readyState === 'complete') {
	    initStyleRendering();
    }
});
