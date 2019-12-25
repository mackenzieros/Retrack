"use strict";

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.regexp.replace");

const axios = require('axios');

const cheerio = require('cheerio');

const GOOGLE_API_KEY = 'AIzaSyBxoKQ2Zw2O8BcKAcnDXJPoTs4tMxKjkL8';
const CSE_INDENTIFIER = '015113414327467658234:sahhtyomkt9';
const GOOGLE_API_URL = "https://www.googleapis.com/customsearch/v1?key=".concat(GOOGLE_API_KEY, "&cx=").concat(CSE_INDENTIFIER);

const removeLatex = str => {
  const regex = /\{[^\}]* (.*)(?=\})\}/g;
  const matches = regex.exec(str);

  if (!matches) {
    return str;
  }

  const index = matches.index;
  var left = index;

  while (left >= 0) {
    if (str[left] === ' ') {
      break;
    }

    --left;
  }

  var cleanedStr = str.slice(0, left + 1) + str.slice(index, str.length);
  cleanedStr = cleanedStr.replace(matches[0], matches[1]);
  return cleanedStr;
};

module.exports.scrapeWebpage = async url => {
  const response = {};

  try {
    const tagLimit = 2;
    const html = await axios.get(url);
    const $ = cheerio.load(html.data);
    $('body').each((i, elem) => {
      const pTags = $(elem).find('p').slice(0, tagLimit);
      var content = pTags.text().trim();
      content = content.replace(/\r?\n|\r|[ ]{2,}|[\[0-9\]]/g, '');
      response.blurb = removeLatex(content);
    });
  } catch (err) {
    console.log('Error occurred while fetching webpages: ', err.message);
    response.error = err.message;
  }

  return response;
};

module.exports.autoPop = async (req, res, next) => {
  const {
    query
  } = req.body;
  const retrievalLimit = 3; // Populate query params for google search

  var queryStr = '&q=';

  for (const token of query) {
    queryStr = queryStr.length == 3 ? queryStr.concat(token) : queryStr.concat("+".concat(token));
  } // TODO: scrape PDFs


  queryStr = queryStr.concat('+-inurl%3Apdf');
  const response = {};

  try {
    // Make the google search and retrieve all webpages for scraping
    // const searchUrl = `${GOOGLE_API_URL}${queryStr}`
    // const searchRes = await axios.get(searchUrl);
    // var webPagesToParse = [];
    // for (var i = 0; i < retrievalLimit; ++i ) {
    //     webPagesToParse.push(searchRes.data.items[i].link);
    // };
    var webPagesToParse = ['https://en.wikipedia.org/wiki/A*_search_algorithm', 'https://www.geeksforgeeks.org/a-search-algorithm/', 'https://stackabuse.com/basic-ai-concepts-a-search-algorithm/'];
    const promises = [];

    for (var i = 0; i < webPagesToParse.length; ++i) {
      promises.push(module.exports.scrapeWebpage(webPagesToParse[i])); // response[`choice${i+1}`] = module.exports.scrapeWebpage(webPagesToParse[i]);
    }

    ; // await Object.values(response).forEach(async (element) => {
    //     await element;
    // });
    // await Promise.all(Object.values(response));

    response.res = await Promise.all(promises);
  } catch (err) {
    console.log('Error occurred while communicating with Google CSE: ', err.message);
    response.error = err.message;
  }

  res.json(response);
};