# enquir's API
The backend for a mobile app to help with studying

Users will be able to create notecards with its content automatically populated by typing in a topic or speaking the topic name to the app. The app will then generate questions given the information and send them to the user via push notifications.

# Details
The api consists of two microservices:

## Information Retrieval
The Information Retrieval API uses axios, Google's Custom Search Engine, and cheerio to fetch the top webpages on a given topic, scrape the pages, and return their content.

Hosted with AWS Lambda.

## Question Generation
The Question Generation API uses spaCy's API to map the syntax tree, tag the part-of-speech, and perform named entity recognition. With these, the API parses a given blurb of information for its nominal subject, root verb, auxillary verb (if necessary), and object, and then creates WH-type questions.

Hosted with Heroku

4/30/2020: Question generator works best with simple Subject-Verb-Object sentence structures.
