'use strict'
const path = require('path');
var fs = require('fs');
const fetch = require('node-fetch');
const spotifyApi = require('spotify-web-api-node');
const credentials = require('./credentials.js');
const globals = require('./globals.js');
const { randomInt, createHash, Hash } = require('crypto');
const { ENOENT } = require('constants');


const URI = `${globals.host}${globals.port}`;
const CALLBACK_URI = URI + "/callback";
const SHARE_URI = URI + "/share.html?id=";
const TOKEN_DIR = "./tokens";
const ADD_SUCCESS = 204;


async function logError(err, severity) {
  severity = severity || 'ERROR';
  console.error(`\n[${severity}] ${new Date().toString()}\n${err.stack}\n`);
}


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


async function getTokens(res, req, next){
  var spotify = new spotifyApi({
    clientId: credentials.CLIENT_ID,
    clientSecret: credentials.CLIENT_SECRET,
    redirectUri: CALLBACK_URI,
  });

  var accessCode = req.query.code;
  try{
    var data = await(spotify.authorizationCodeGrant(accessCode));
    if(!data.body.access_token || !data.body.refresh_token) { throw new ReferenceError('Property not found') };
    spotify.setAccessToken(data.body.access_token);
    spotify.setRefreshToken(data.body.refresh_token);
    res.locals.spotify = spotify;
    next();
  } catch(err) {
    logError(err).catch('error logging error lol');
    res.status(500).end('internal server error');
  }
};


function writeTokens(salt, req, res, next){
  var spotify = res.locals.spotify;
  var accTok = spotify.getAccessToken();
  var refTok = spotify.getRefreshToken();
  var returnURL = SHARE_URI;
  var digest;
  try {
    // Return the hashed email as the id
    digest = createHash('sha256').update(res.locals.email || '0').digest('hex');
    returnURL += digest;
    // Hash one more time with salt and store it
    digest = createHash('sha256').update(digest).update(salt).digest('hex');
  } catch(err) {
    logError(err);
    res.status(500).end('internal server error');
  }

  var tokData = {
    "acc": accTok,
    "ref": refTok,
  }

  var tokStr = JSON.stringify(tokData);
  fs.writeFile(`${TOKEN_DIR}/${digest}`, tokStr, (err) =>{
    if(err){
      logError(err);
      res.status(500).end('internal server error');
    }
    res.redirect(returnURL);
  });
}


async function refreshTokens(req, res, next){
  var spotify = res.locals.spotify;
  var data;
  var replyJSON = {
    status: 'null',
    reason: 'null',
  }

  try {
    data = await(spotify.refreshAccessToken());
    if(!data.body.access_token) { throw new ReferenceError('Property not found') };
    spotify.setAccessToken(data.body.access_token);
    next();
  } catch(err) {
    logError(err);
    res.status(418);
    replyJSON.status = 418;
    replyJSON.reason = 'bad refresh';
    res.end(replyJSON);
  }
}


function loadTokens(salt, req, res, next){
  var spotify = new spotifyApi({
    clientId: credentials.CLIENT_ID,
    clientSecret: credentials.CLIENT_SECRET,
    redirectUri: CALLBACK_URI
  });
  const userHash = req.query.id;
  const tokenId = createHash('sha256').update(userHash).update(salt).digest('hex');
  var search = req.query.q;
  if(userHash === null || search === null){
    res.status(400);
    res.type('html');
    res.send('Missing one or both parameters');
    return(1);
  }
  let fileStr = `${TOKEN_DIR}/${tokenId}`;
  if(!fs.existsSync(fileStr)){
    res.status(418);
    res.type('html');
    res.end('Cannot find token');
    return(1);
  }
  let tokenData = JSON.parse(fs.readFileSync(fileStr));
  try {
    if(!tokenData.acc || !tokenData.ref){ throw new ReferenceError('Property not found') };
    spotify.setAccessToken(tokenData.acc);
    spotify.setRefreshToken(tokenData.ref);
  } catch(err) {
    logError(err);
    res.status(418);
    res.end('token err');
  }
  res.locals.spotify = spotify;
  next();
}


async function searchTrack(req, res, next){
  var spotify = res.locals.spotify;
  var replyJSON = {
    status: 'null',
    reason: 'null',
  }

  if(req.query.q === null || res.locals.spotify === null){
    console.log('ERROR: id and or search query not provided');
    res.status(418);
    replyJSON.status = 418;
    replyJSON.reason = 'id and or search query not provided';
    res.send(replyJSON);
  }

  let data = await(spotify.searchTracks(req.query.q, { limit: 20 }));
  try {
    if(!data.body.tracks.items) { throw new ReferenceError('Property not found') };
    res.status(200);
    res.type('json');
    replyJSON.status = 200;
    replyJSON.reason = 'success';
    res.send(data.body.tracks.items);

  } catch(err) {
    logError(err);
    res.status(418);
    replyJSON.status = 418;
    replyJSON.reason = 'internal error';
    res.end(replyJSON);
  }
}


// For some reason spotify node library doesnt include adding to queue
// so we must use the generic spotify web api
async function addTrack(req, expressRes, next){
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
  let addResponse = await(fetch(uri, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${spotify.getAccessToken()}`
    }
  }));
  replyJSON.status = addResponse.status;
  if(addResponse.status === successCode) {
    expressRes.status(200)
    replyJSON.reason = 'SUCCESS';
    expressRes.end(replyJSON);
  }
  try{
    let data = await(addResponse.json());
    if(!data.error.reason) { throw new ReferenceError('Property not found') };
    expressRes.status(418)
    replyJSON.reason = data.error.reason;
    expressRes.send(replyJSON);
  } catch(err) {
    logError(err);
    replyJSON.reason = 'internal server error';
    expressRes.send(replyJSON);
  }
}


function logout(salt, req, res, next){
  var id = req.query.id;
   var replyJSON = {
    status: 'null',
    reason: 'null'
  };

  // Check that query params actually exist
  if(id === null){
    console.log('no logout id provided');
    res.status(418);
    res.send('search error');
  }

  id = createHash('sha256').update(id).update(salt).digest('hex');
  try {
    fs.unlinkSync(`${TOKEN_DIR}/${id}`);
  } catch (err) {
    if(err.code === ENOENT){
      res.status(404);
      replyJSON.status = 404;
      replyJSON.reason = 'Entry not found';
      res.send(replyJSON);
      return(0)
    }else{
      console.log(`Could not remove token ${err.code}`);
      res.status(418);
      replyJSON.status = 418;
      replyJSON.reason = err;
      res.send(replyJSON);
      return(1);
    }
  }
  res.redirect(`${globals.host}${globals.port}`);
}

module.exports = { logout, searchTrack, loadTokens, writeTokens, refreshTokens, getTokens, getAccess, addTrack };
