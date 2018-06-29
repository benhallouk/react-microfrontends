# Building Microfrontend Architecture using React

If you ever find that your Microservices consumed by single monolithic front end UI, and you really wish that you can break it to Microservices as well, than this is what you was looking for

In this repo I will show you how to create a Microfrontend Architecture from scratch, on where you will have containers running, with apps communicating with each other in an architecture that allows scalability and fast development for front end UIs

Before you start you will need this prerequisites

- Node and npm
- Docker
- React and its environment
- NodeJS and Express

## Create the header Microfrontend

Lets start by creating our first Microfrontend that will hold the header UI

First we start by creating a react app

```
npm install -g create-react-app
create-react-app header
cd header/
npm start
```

Then we change the default `App.js` so that it contains only the header UI something like

```jsx
import React from 'react';

export default () =>
  <header>
    <h1>Header</h1>
    <nav>
      <ul>
        <li>About</li>
        <li>Contact</li>
      </ul>
    </nav>
  </header>;
```

We will also need to turn on server side rendering which is going to be used to join Microfrontends together and also useful for SEO reasons.

So we do that by creating a `server.js` on your root that turns the header into plain html `server.js` code may look like that

```js
const path = require('path');
const fs = require('fs');
const express = require('express');
const React = require('react');
const App = require('./transpiled/App.js').default;
const { renderToString } = require('react-dom/server');

const server = express();

server.get('/', (req, res) => {
  const htmlPath = path.resolve(__dirname, 'build', 'index.html');

  fs.readFile(htmlPath, 'utf8', (err, html) => {
    const rootElem = '<div id="root">';
    const renderedApp = renderToString(React.createElement(App, null));

    res.send(html.replace(rootElem, rootElem + renderedApp));
  });
});

server.use(express.static('build'));

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
```

Last thing we need to do is to make nodejs understand JSX using babel

```
yarn add --dev babel-cli babel-preset-es2015
```

and add the scripts to build transpile and run the header microfrontend

```
"transpile": "NODE_ENV=production babel src --out-dir transpiled --presets es2015,react-app",
"start:prod": "NODE_ENV=production node server.js
```

If you are on windows you also need to install `win-node-env` so that setting the node environment will work across Other operating systems like linux or mac

```
npm install -g win-node-env
```

so now running your header UI can be done using this commands:

```
npm run build
npm run transpile
npm run start:prod
```

Next is to add docker file to your root

```
FROM node

COPY package.json .
RUN npm install
COPY . .

RUN npm run build
RUN npm run transpile

CMD PORT=$PORT npm run start:prod
```

Now we can run locally the header microfrontend using this docker command

```
docker build . -t header
docker run -t -e PORT=8080 -p 8080:8080 header
```

## Create the footer Microfrontend

To ensure that we have the same anatomy of our Microfrontends we need to follow the same process of creating the header the only key difference will be the `App.js` as we need different markup and also we may want to run the docker container on different port everything else should really remain the same

## Joining the Microfrontends together

Now that we have the apps that are developed by different teams and has their own life cycle, we need to join them in away that they are like a single page to do that we create a another Microfrontend and lets call it layout that will hold both header and footer

This can be done by creating express server that fetch the other apps and aggregate them into a layout page

So let create the layout Microfrontend

```
mkdir layout
cd layout
npm init
```

Lets install all the needed dependencies

```
npm install --save express ejs request
```

The layout view may look like that

```ejs
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Microfrontends Layout</title>
  </head>
  <body>
    <%- header %>
    some content goes here
    <%- footer %>
  </body>
</html>
```

Now to bundle all together we just need `docker-compose.yml` file that looks like that

```
version: '3'

services:
  header.microfrontends.local:
    build: "./header"
    ports:
      - "8000:8080"
    volumes:
      - .:/header
  footer.microfrontends.local:
    build: "./footer"
    ports:
      - "8001:8080"
    volumes:
      - .:/footer
  layout.microfrontends.local:
      build: "./layout"
      ports:
        - "8003:8080"
      volumes:
        - .:/layout
      depends_on:
        - header.microfrontends.local
        - footer.microfrontends.local
```