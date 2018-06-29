const express = require('express');
const server = express();
const request = require('request');

server.set('view engine', 'ejs');

server.get('/', (req, res) =>
  Promise.all([
    getContents('http://header.microfrontends.local:8080/'),
    getContents('http://footer.microfrontends.local:8080/')
  ]).then(responses =>
    res.render('index', { header: responses[0], footer: responses[1] })
  ).catch(error =>
    res.send(error.message)
  )
);

const getContents = (url) => new Promise((resolve, reject) => {
  request.get(url, (error, response, body) => {
    if (error) return resolve("Error loading " + url + ": " + error.message);

    return resolve(body);
  });
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Layout listening on port ${port}`);
});