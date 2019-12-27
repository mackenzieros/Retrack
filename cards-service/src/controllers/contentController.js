const axios = require('axios');
const cheerio = require('cheerio');

require('dotenv').config();
const GOOGLE_API_URL = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.CSE_IDENTIFIER}`;
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
        }
        while (currContentCount < contentQuota && tagLimit < 10);

        // No content
        if (content.length < 1) {
            return null;
        }

        content = content.replace(/\r?\n|\r|[ ]{2,}|[\[0-9\]]/g, '');   // removes all extra whitespace characters and annotation subscripts
        response.blurb = removeLatex(content);
    } catch (err) {
        console.log('Error occurred while fetching webpages: ', err.message);
        response.error = err.message;
    }
    return response;
};

module.exports.autoPop = async (req, res, next) => {
    const { query } = req.body;
    const retrievalLimit = 2;

    // Populate query params for google search
    var queryStr = '&q='
    for (const token of query) {
        queryStr = queryStr.length == 3 ? queryStr.concat(token) : queryStr.concat(`+${token}`)
    }
    // TODO: scrape PDFs
    queryStr = queryStr.concat('+-inurl%3Apdf');

    var response = {};
    try {
        // Make the google search and retrieve all webpages for scraping
        // const searchUrl = `${GOOGLE_API_URL}${queryStr}`
        // const searchRes = await axios.get(searchUrl);
        // var webPagesToParse = [];
        // for (var i = 0; i < retrievalLimit; ++i ) {
        //     webPagesToParse.push(searchRes.data.items[i].link);
        // };

        // FOR TESTING, GOOGLE CSE API HAS DAILY LIMIT OF 100 QUERIES
        var webPagesToParse = [
            'https://en.wikipedia.org/wiki/A*_search_algorithm',
            'https://www.geeksforgeeks.org/a-search-algorithm/',
        ];

        // Scrape all webpages for blurbs for notecards
        const promises = [];
        for (var i = 0; i < webPagesToParse.length; ++i) {
            promises.push(module.exports.scrapeWebpage(webPagesToParse[i]));
        };

        response.res = await Promise.all(promises);
        response.res = response.res.filter(obj => obj);
        // response.suggestedSpelling = searchRes.data.spelling ? 
        //     searchRes.data.spelling.correctedQuery.replace(' -inurl:pdf', '') : null;
    } catch (err) {
        console.log('Error occurred while communicating with Google CSE: ', err.message);
        response = { 'err': err.message };
    }
    res.json(response);
};