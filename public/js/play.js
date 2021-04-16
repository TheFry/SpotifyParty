var Spotify = require('spotify-web-api-js');
const searchBtn = document.querySelector('#search');
const CLIENT_ID = '2d23afdddd914be784ec0f3565768e07';


addEventListeners();
login();
function login(){

}
function addEventListeners(){
  searchBtn.addEventListener('click', searchNow);
}


function searchNow(e){
  
}

// spotifyApi.searchTracks('Love')
//   .then(function(data) {
//     console.log('Search by "Love"', data.body);
//   }, function(err) {
//     console.error(err);
//   });