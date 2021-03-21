// import {getMetadata} from 'page-metadata-parser'
import { browser } from "webextension-polyfill-ts";

/***
MOZILLA CODE: https://github.com/mozilla/page-metadata-parser/blob/master/parser.js
*/
function makeUrlAbsolute(base, relative) {
    return new URL(relative, base).href;
}
function parseUrl(url) {
    return new URL(url).host;
}

function getProvider(host) {
  return host
    .replace(/www[a-zA-Z0-9]*\./, '')
    .replace('.co.', '.')
    .split('.')
    .slice(0, -1)
    .join(' ');
}

function buildRuleSet(ruleSet) {
  return (doc, context) => {
    let maxScore = 0;
    let maxValue;

    for (let currRule = 0; currRule < ruleSet.rules.length; currRule++) {
      const [query, handler] = ruleSet.rules[currRule];

      const elements = Array.from(doc.querySelectorAll(query));

      if(elements.length) {
        for (const element of elements) {
          let score = ruleSet.rules.length - currRule;

          if (ruleSet.scorers) {
            for (const scorer of ruleSet.scorers) {
              const newScore = scorer(element, score);

              if (newScore) {
                score = newScore;
              }
            }
          }

          if (score > maxScore) {
            maxScore = score;
            maxValue = handler(element);
          }
        }
      }
    }

    if (!maxValue && ruleSet.defaultValue) {
      maxValue = ruleSet.defaultValue(context);
    }

    if (maxValue) {
      if (ruleSet.processors) {
        for (const processor of ruleSet.processors) {
          maxValue = processor(maxValue, context);
        }
      }

      if (maxValue.trim) {
        maxValue = maxValue.trim();
      }

      return maxValue;
    }
  };
}

const metadataRuleSets = {
  description: {
    rules: [
      ['meta[property="og:description"]', element => element.getAttribute('content')],
      ['meta[name="description" i]', element => element.getAttribute('content')],
    ],
  },

  icon: {
    rules: [
      ['link[rel="apple-touch-icon"]', element => element.getAttribute('href')],
      ['link[rel="apple-touch-icon-precomposed"]', element => element.getAttribute('href')],
      ['link[rel="icon" i]', element => element.getAttribute('href')],
      ['link[rel="fluid-icon"]', element => element.getAttribute('href')],
      ['link[rel="shortcut icon"]', element => element.getAttribute('href')],
      ['link[rel="Shortcut Icon"]', element => element.getAttribute('href')],
      ['link[rel="mask-icon"]', element => element.getAttribute('href')],
    ],
    scorers: [
      // Handles the case where multiple icons are listed with specific sizes ie
      // <link rel="icon" href="small.png" sizes="16x16">
      // <link rel="icon" href="large.png" sizes="32x32">
      (element, score) => {
        const sizes = element.getAttribute('sizes');

        if (sizes) {
          const sizeMatches = sizes.match(/\d+/g);
          if (sizeMatches) {
            return sizeMatches[0];
          }
        }
      }
    ],
    defaultValue: (context) => 'favicon.ico',
    processors: [
      (icon_url, context) => makeUrlAbsolute(context.url, icon_url)
    ]
  },

  image: {
    rules: [
      ['meta[property="og:image:secure_url"]', element => element.getAttribute('content')],
      ['meta[property="og:image:url"]', element => element.getAttribute('content')],
      ['meta[property="og:image"]', element => element.getAttribute('content')],
      ['meta[name="twitter:image"]', element => element.getAttribute('content')],
      ['meta[property="twitter:image"]', element => element.getAttribute('content')],
      ['meta[name="thumbnail"]', element => element.getAttribute('content')],
    ],
    processors: [
      (image_url, context) => makeUrlAbsolute(context.url, image_url)
    ],
  },

  keywords: {
    rules: [
      ['meta[name="keywords" i]', element => element.getAttribute('content')],
    ],
    processors: [
      (keywords, context) => keywords.split(',').map((keyword) => keyword.trim())
    ]
  },

  title: {
    rules: [
      ['meta[property="og:title"]', element => element.getAttribute('content')],
      ['meta[name="twitter:title"]', element => element.getAttribute('content')],
      ['meta[property="twitter:title"]', element => element.getAttribute('content')],
      ['meta[name="hdl"]', element => element.getAttribute('content')],
      ['title', element => element.text],
    ],
  },

  language: {
    rules: [
      ['html[lang]', element => element.getAttribute('lang')],
      ['meta[name="language" i]', element => element.getAttribute('content')],
    ],
    processors: [
      (language, context) => language.split('-')[0]
    ]
  },

  type: {
    rules: [
      ['meta[property="og:type"]', element => element.getAttribute('content')],
    ],
  },

  url: {
    rules: [
      ['a.amp-canurl', element => element.getAttribute('href')],
      ['link[rel="canonical"]', element => element.getAttribute('href')],
      ['meta[property="og:url"]', element => element.getAttribute('content')],
    ],
    defaultValue: (context) => context.url,
    processors: [
      (url, context) => makeUrlAbsolute(context.url, url)
    ]
  },

  provider: {
    rules: [
      ['meta[property="og:site_name"]', element => element.getAttribute('content')]
    ],
    defaultValue: (context) => getProvider(parseUrl(context.url))
  },
};

function getMetadata(doc, url, customRuleSets) {
  const metadata = {};
  const context = {
    url,
  };

  const ruleSets = customRuleSets || metadataRuleSets;

  Object.keys(ruleSets).map(ruleSetKey => {
    const ruleSet = ruleSets[ruleSetKey];
    const builtRuleSet = buildRuleSet(ruleSet);

    metadata[ruleSetKey] = builtRuleSet(doc, context);
  });

  return metadata;
}


/* END OF MOZILLA CODE */


var stopwords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "however", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];
function getElementWords(root) {
    let words = root.innerText.toLowerCase().split(/\W/).filter((w) => w.length>1 && stopwords.indexOf(w)<0)
    let counter = {}
    for (let w of words) {
        counter[w] = (counter[w] || 0) + 1
    }
    return counter
}

function getDocumentContentElement() {
    let mains = document.getElementsByTagName('main')
    if (mains.length == 1) {
        return mains[0]
    }

    for (let x in ['main' , 'content']) {
        let elem = document.getElementById(x)
        if (elem) {
            return elem
        }
    }

    // role=main ?
    let classes =  ['content',
                    'article-body',
                    'post-body',
                    'articlebody',
                    'single-container',
                    'thecontent',
                    'blog-content',
                    'storycontent',
                    'single-content',
                    'single-post',
                    'article_post',
                    'post',
                    'content_blocks']
    for (let cls of classes) {
        let elems = document.getElementsByClassName(cls)
        if (elems.length == 1) {
            return elems[0]
        }
    }
}

function getDocumentWords() {
    let content = getDocumentContentElement(document)
    if (content) {
        return getElementWords(content)
    }
}

const LD_TAG_PREFIX = 'Tag:'
function getJsonLd() {
    let elem = document.querySelector('script[type="application/ld+json"]')
    if (!elem) return
    let data = JSON.parse(elem.text)
    let description = data.headline || data.description || data.name
    let type = data['@type']
    let url = data.url
    if (!description || !data.keywords) {
        return
    }
    let tags = []
    for (let k of data.keywords) {
        if (k.slice(0,LD_TAG_PREFIX.length) == LD_TAG_PREFIX) {
            tags.push(k.slice(LD_TAG_PREFIX.length))
        }
    }
    return {url, type, description, tags}
}

async function getPageMetadata(get_content) {
    // TODO: <a rel="tag">?
    let metadata = getJsonLd() || getMetadata(window.document, window.location)
    if (get_content) {
        metadata.words = getDocumentWords()
    }
    return metadata
}


function main () {
    console.log("Running!")

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.command === "getPageKeywords") {
            return getPageMetadata(false)
        } else if (message.command === "getPageContent") {
            return getPageMetadata(true)
        }
    })
}

if (!window.hasRun) main()
window.hasRun = true