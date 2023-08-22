'use strict'
require('crypto');
const path = require('path');
const express = require('express');
const spotifyApi = require('./spotify.js');
const globals = require('./globals.js');
const { randomBytes } = require('crypto');

const salt = randomBytes(8);
const app = express();
const PORT = globals.port;
const URI = `${globals.host}${PORT}`;


app.use("/logout", (req, res, next) => {
  spotifyApi.logout(salt, req, res, next);
});


app.use("/end", (req, res, next) => {
  res.redirect(`${URI}/end.html`);
});



app.use("/play", (req, res, next) => {
  res.redirect(`${URI}/play.html?id=${req.query.id}`);
});


app.get("/search",
  (req, res, next) => {
    spotifyApi.loadTokens(salt, req, res, next);
  },
  (req, res, next) => {
    spotifyApi.refreshTokens(req, res, next);
  },
  (req, res, next) => {
    spotifyApi.searchTrack(req, res, next);
  }
);


app.get("/addTrack",
  (req, res, next) => {
    spotifyApi.loadTokens(salt, req, res, next);
  },
  (req, res, next) => {
    spotifyApi.refreshTokens(req, res, next);
  },
  (req, res, next) => {
    spotifyApi.addTrack(req, res, next);
  }
);


// Recieves tokens from spotify
app.use("/callback",
  (req, res, next) => {
    spotifyApi.getTokens(res, req, next);
  },

  (req, res, next) => {
    var spotify = res.locals.spotify;
    spotify.getMe().then(
      (data) =>
      {
        res.locals.email = data.body.email;
        next();
      },
      (err) => 
      {
        console.log(`Error spotify.getMe() ${err}`);
        res.send("Error");
      }
    );
  },

  (req, res, next) => {
    spotifyApi.writeTokens(salt, req, res, next);
  }
);


app.use("/start",
  (req, res, next) => {
    console.log("Get access")
    spotifyApi.getAccess(res);
  }
);


app.use("/", express.static(path.join(__dirname, 'public')));
app.listen(globals.bindPort, () => console.log(`Server started on ${globals.host} with port ${globals.bindPort}`));