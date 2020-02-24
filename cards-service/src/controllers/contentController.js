const axios = require('axios');
const cheerio = require('cheerio');

const WIKIPEDIA_API_URL = 'https://en.wikipedia.org/w/api.php';

const removeLatex = (str) => {
    const regex = /\{[^\}]* (.*)(?=\})\}/g; // regex for catching all inline latex
    const matches = regex.exec(str);
    if (!matches) {
        return str;
    }

    // Remove all text that was to be formatted by latex
    const index = matches.index
    var left = index;
    while (left >= 0) {
        if (str[left] === ' ') {
            break;
        }
        --left;
    }
    var cleanedStr = str.slice(0, left + 1) + str.slice(index, str.length); // removes text-to-be-formatted
    cleanedStr = cleanedStr.replace(matches[0], matches[1]);    // replaces inline latex with latex description
    return cleanedStr;
};

module.exports.scrapeWebpage = async (url) => {
    const response = {};
    try {
        // Fetch webpage and load the html for parsing
        const html = await axios.get(url);
        const $ = cheerio.load(html.data);
        
        // Go into body tag and retrieve content
        const pTags = $('body').find('p');

        var tagLimit = 2; // limits how many p tags we see (how much content is returned)
        const contentQuota = 5; // should have atleast 5 characters to be considered
        var content = '';
        var currContentCount = 0;
        // iteratively increase number of p tags
        do {
            content = pTags.slice(0, tagLimit).text().trim();
            currContentCount = content.length;
            ++tagLimit;
        } while (currContentCount < contentQuota && tagLimit < 10);

        // No content
        if (content.length < 1) {
            return null;
        }

        content = content.replace(/\r?\n|\r|[ ]{2,}|[\[0-9\]]/g, '');   // removes all extra whitespace characters and annotation subscripts
        response.blurb = removeLatex(content);
    } catch (err) {
        console.log('Error occurred while fetching and scraping webpages: ', err.message);
        response.error = err.message;
    }
    return response;
};

module.exports.autoPop = async (req, res, next) => {
    const { query } = req.body;
    const params = {
        action: 'opensearch',
        search: query,
        limit: 1,
        namespace: 0,
        format: 'json',
    };

    var searchUrl = `${WIKIPEDIA_API_URL}?origin=*`;
    Object.keys(params).forEach((key) => {
        searchUrl = searchUrl.concat(`&${key}=${params[key]}`);
    });

    var response = {};
    try {
        const searchRes = await axios.get(encodeURI(searchUrl));
        const { data } = searchRes;

        const snippet = data[2][0];
        if (snippet.length > 0) {
            response.blurb = snippet;
        } else {
            const url = data[3][0]
            response = await module.exports.scrapeWebpage(url);
        }
    } catch (err) {
        console.log('Error occurred while in communicating with web search api: ', err.message);
        response = { 'err': err.message };
    }
    res.json(response);
};