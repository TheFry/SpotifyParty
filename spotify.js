'use strict'
const path = require('path');
var fs = require('fs');
const fetch = require('node-fetch');
const spotifyApi = require('spotify-web-api-node');
const credentials = require('./credentials.js');
const globals = require('./globals.js');
const { randomInt, createHash } = require('crypto');


const URI = `${globals.host}${globals.port}`;
const CALLBACK_URI = URI + "/callback";
const SHARE_URI = URI + "/share.html?id=";
const TOKEN_DIR = "./tokens";
const ADD_SUCCESS = 204;


function getAccess(res){
  var spotify = new spotifyApi({
    clientId: credentials.CLIENT_ID,
    clientSecret: credentials.CLIENT_SECRET,
    redirectUri: CALLBACK_URI,
  });

  const scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
  const state = randomInt(64);
  var authorizeURL = spotify.createAuthorizeURL(scopes, state);
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

  var accessCode = req.query.code;
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


function writeTokens(salt, req, res, next){
  var spotify = res.locals.spotify;
  var accTok = spotify.getAccessToken();
  var refTok = spotify.getRefreshToken();
  var returnURL = SHARE_URI;

  let digest = createHash('sha256').update(res.locals.email).digest('hex');
  digest = createHash('sha256').update(digest).update(salt).digest('hex');
  returnURL += digest;

  var tokData = {
    "acc": accTok,
    "ref": refTok
  }
  console.log(accTok);
  console.log(tokData);
  var tokStr = JSON.stringify(tokData);
  fs.writeFile(`${TOKEN_DIR}/${digest}`, tokStr, (err) =>{
    if(err){
      console.log("Could not write token");
      console.log(err);
      res.send("err");
    }
    res.redirect(returnURL);
  });
}


function refreshTokens(req, res, next){
  var spotify = res.locals.spotify;
  var replyJSON = {
    status: 'null',
    reason: 'null'
  }
  spotify.refreshAccessToken()
  .then((data) => {
    spotify.setAccessToken(data.body['access_token']);
    next();
  },
  (err) => {
    console.log('err test')
    console.log('Could not refresh access token', err);
    res.status(418);
    replyJSON.status = 418;
    replyJSON.reason = 'bad refresh';
    res.send(replyJSON);
  });
}


function loadTokens(req, res, next){
  var spotify = new spotifyApi({
    clientId: credentials.CLIENT_ID,
    clientSecret: credentials.CLIENT_SECRET,
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
  var spotify = res.locals.spotify;
  var replyJSON = {
    status: 'null',
    reason: 'null'
  }

  if(req.query.q === null || res.locals.spotify === null){
    console.log('ERROR: id and or search query not provided');
    res.status(418);
    replyJSON.status = 418
    replyJSON.reason = 'id and or search query not provided'
    res.send(replyJSON);
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


// For some reason spotify node library doesnt include adding to queue
// so we must use the generic spotify web api
function addTrack(req, expressRes, next){
  const spotify = expressRes.locals.spotify;
  const track = req.query.q;
  var uri = ""
  var successCode = 204;

  var replyJSON = {
    status: 'null',
    reason: 'null'
  };

  // Check that query params actually exist
  if(track === null || spotify === null){
    console.log('ERROR: track and or id not provided');
    expressRes.status(418);
    expressRes.send('search error');
  }

  uri = encodeURI(`https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${track}`);
  fetch(uri, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${spotify.getAccessToken()}`
    }
  }).then((res) => { 
    replyJSON.status = res.status;
    if(res.status != successCode){ return(res.json()); }
    else{ return null };
    
  }).then(data => {
    if(replyJSON.status != successCode){
      expressRes.status(418)
      replyJSON.reason = data.error.reason;
      expressRes.send(replyJSON);
    }else{
      expressRes.status(200)
      replyJSON.reason = 'SUCCESS';
      expressRes.send(replyJSON);
    }

    
  }).catch(e => {
    console.log(`Error adding to queue: ${e}`);
    expressRes.send(e.toString());
  });
}

module.exports = { searchTrack, loadTokens, writeTokens, refreshTokens, getTokens, getAccess, addTrack };
