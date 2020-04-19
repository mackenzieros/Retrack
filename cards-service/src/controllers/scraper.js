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
    var blurb = null;
    try {
        // Fetch webpage and load the html for parsing
        const html = await axios.get(url);
        const $ = cheerio.load(html.data);

        // Go into body tag and retrieve content
        const pTags = $('body').find('p');

        var tagLimit = 1; // limits how many p tags we see (how much content is returned)
        const contentQuota = 5; // should have atleast 5 characters to be considered
        var content = '';
        // iteratively increase number of p tags
        do {
            content = pTags.slice(0, tagLimit).text().trim();
            ++tagLimit;
        } while (content.length < contentQuota && tagLimit < 5);

        // No content
        if (content.length < 1 || /((.* or \(.*\))|(.*)) may refer to:/.exec(content)) {
            return blurb;
        }

        content = content.replace(/\r?\n|\r|[ ]{2,}|[\[0-9\]]/g, '');   // removes all extra whitespace characters and annotation subscripts
        blurb = removeLatex(content);
    } catch (err) {
        console.log('Error occurred while fetching and scraping webpages: ', err.message);
    }
    return blurb;
};

module.exports.autoPop = async (event, context, callback) => {
    const { query } = JSON.parse(event.body);
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

    var response = {
        statusCode: 200,
    };
    var body = {};
    try {
        const searchRes = await axios.get(encodeURI(searchUrl));
        const { data } = searchRes;
        if (data.error) {
            throw data.error;
        }

        const snippets = data[2];
        const urls = data[3];
        if (urls.length < 1) {
            console.log('No urls found for: ', query);
            body.blurb = null;
        } else {
            if (snippets[0].length > 0) {
                body.blurb = snippets[0];
            } else {
                const url = urls[0]
                body.blurb = await module.exports.scrapeWebpage(url);
            }
        }
    } catch (err) {
        console.log('Error occurred while communicating with web search api: ', err);
        body = {
            'err':
            {
                'message': err.message,
                'verbose': err
            }
        };
        response.statusCode = 500;
    }

    response.body = JSON.stringify(body);
    return response;
};