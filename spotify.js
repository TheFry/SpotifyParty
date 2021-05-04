const path = require('path');
var fs = require('fs');
const crypto=require('crypto');
const spotifyApi = require('spotify-web-api-node');
const credentials = require('./credentials.js');

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

  const scopes = ['user-read-private', 'user-read-email', 'user-modify-playback-state'];
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
    (data) =>
    {
      spotify.setAccessToken(data.body['access_token']);
      spotify.setRefreshToken(data.body['refresh_token']);
      res.locals.spotify = spotify;
      next();

    },
    (err) =>
    {
      console.log(err);
      res.send("err");
    }   
  );
};


function writeTokens(req, res, next){
  spotify = res.locals.spotify;
  var accTok = spotify.getAccessToken();
  var refTok = spotify.getRefreshToken();
  var hash = crypto.createHash('sha256');
  var returnURL = SHARE_URI;

  hash.update(res.locals.email);
  hash = hash.digest("hex");
  returnURL += hash;
  var tokData = {
    "acc": accTok,
    "ref": refTok
  }
  console.log(accTok);
  console.log(tokData);
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


function loadTokens(req, res, next){
  var spotify = new spotifyApi({
    clientId: credentials.CLIENT_ID,
    clientSecret: credentials.clientSecret,
    redirectUri: CALLBACK_URI
  });
  var userHash = req.query.id;
  var search = req.query.q;

  if(userHash === null || search === null){
    res.status(400);
    res.type('html');
    res.send('Missing one or both parameters');
  }
  let fileStr = `${TOKEN_DIR}/${userHash}`;
  if(!fs.existsSync(fileStr)){
    res.status(418);
    res.type('html');
    res.send('Cannot find token');
  }
  let tokenData = JSON.parse(fs.readFileSync(fileStr));
  try{
    spotify.setAccessToken(tokenData.acc);
    spotify.setRefreshToken(tokenData.ref);
  }catch(err){
    console.log(err);
    res.status(418);
    res.send('token err');
  }
  res.locals.spotify = spotify;
  next();
}


function searchTrack(req, res, next){
  spotify = res.locals.spotify;
  if(req.query.q === null || res.locals.spotify === null){
    console.log('ERROR: id and or search query not provided');
    res.status(418);
    res.send('search error');
  }

  spotify.searchTracks(req.query.q, { limit: 10 })
  .then((data) => {
    let tracks = data.body.tracks.items;
    if(tracks === null){
      console.log('Cannot get items from response');
      res.status(418);
      res.send('search error');
    }
    res.type('json');
    res.json(tracks);
  })
  .catch((err) => {
    console.log(`Search tracks 130\n${err}`);
    res.status(418);
    res.send('search error');
  })
}


// function addTrack(req, res, next){
//   if(req.query.track === null || res.locals.spotify === null){
//     console.log('ERROR: track and or id not provided');
//     res.status(418);
//     res.send('search error');
//   }
//   spotify.addTrack(`spotify:track:${req.query.track}`)
//   .then(data => {
//     console.log(data);
//   })
//   .catch(err => {
//     console.log(err);
//   })

// }


module.exports = { searchTrack, loadTokens, writeTokens, getTokens, getAccess};
