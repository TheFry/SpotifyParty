const path = require('path');
var fs = require('fs');
const crypto=require('crypto');
const express = require('express');
const spotifyApi = require('spotify-web-api-node');
const credentials = require('./credentials.js')

const app = express();
const PORT = 8888;
const URI="http://localhost:" + PORT;
const CALLBACK_URI = URI + "/callback"
const SHARE_URI = URI + "/share.html?id="
const TOKEN_DIR = "./tokens"


function getAccess(res){
  var spotify = new spotifyApi({
    clientId: credentials.CLIENT_ID,
    clientSecret: credentials.CLIENT_SECRET,
    redirectUri: CALLBACK_URI,
  });

  const scopes = ['user-read-private', 'user-read-email'];
  const state = crypto.randomInt(64);
  let authorizeURL = spotify.createAuthorizeURL(scopes, state);
  spotify = null;
  console.log(authorizeURL);
  res.redirect(authorizeURL);
}


function getTokens(res, req, next){
  var spotify = new spotifyApi({
    clientId: credentials.CLIENT_ID,
    clientSecret: credentials.CLIENT_SECRET,
    redirectUri: CALLBACK_URI,
  });

  accessCode = req.query.code;
  spotify.authorizationCodeGrant(accessCode).then(
    function(data)
    {
      spotify.setAccessToken(data.body['access_token']);
      spotify.setRefreshToken(data.body['refresh_token']);
      res.locals.spotify = spotify;
      next();
    },
    function(err)
    {
      console.log(err);
      res.send("err");
    }   
  )
};


function writeTokens(req, res, next){
  spotify = res.locals.spotify;
  var accTok = spotify.getAccessToken();
  var refTok = spotify.getRefreshToken();
  var hash = crypto.createHash('sha256');
  var returnURL = SHARE_URI;

  console.log(refTok);
  hash.update(refTok);
  hash = hash.digest("hex");
  returnURL += hash;
  var tokData = {
    "acc": accTok,
    "ref": refTok
  }

  var tokStr = JSON.stringify(tokData);
  fs.writeFile(`${TOKEN_DIR}/${hash}`, tokStr, (err) =>{
    if(err){
      console.log("Could not write token");
      console.log(err);
      res.send("err");
    }
    res.redirect(returnURL);
  });
}


// Express Server

app.use("/join", (req, res, next) => 
{
  res.send("Workin on it");
});


// Recieves tokens from spotify
app.use("/callback",
  (req, res, next) => {
    console.log("Get tokens");
    getTokens(res, req, next);
  },

  (req, res, next) => {
    console.log("Write tokens");
    writeTokens(req, res, next);
  }
);


app.use("/start",
  (req, res, next) => {
    console.log("Get access")
    getAccess(res);
  }
);


app.use("/", express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));