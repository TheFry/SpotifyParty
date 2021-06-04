const searchBtn = document.querySelector('#search-btn');
const searchInput = document.querySelector('#search-input');
const main = document.querySelector('#body-container');

const ADD_SUCCESS = 204;
const ADD_NODEVICE = 404;
const ADD_NOPREMIUM = 403;

var isMobile = window.matchMedia('(max-width: 576px)');

addEventListeners();
function addEventListeners(){
  searchBtn.addEventListener('click', searchNow);
  document.addEventListener('keydown', checkKey);
}


function checkKey(e){
  if(e.key === 'Enter'){
    searchNow();
  }
}


// Get first ten search results from server
function searchNow(){
  var urlParams = new URLSearchParams(window.location.search);
  
  var id;
  var uri = 'search'

  searchBtn.blur();
  if(urlParams.has('id')){
    id = urlParams.get('id');
  }else{
    console.log("No id parmater");
    return;
  }
  if(searchInput.value === ''){
    console.log("No input")
    return;
  }

  fetch(`${uri}?id=${id}&q=${searchInput.value}`)
    .then((res) => {
      if(res.status !== 200){
        console.log('i am a teapot');
        return;
      }
      return res.json();
    })
    .then((data) => {
      if(data == null){ 
        console.log(`couldnt get json from search`);
        return;
      }
      // Remove any existing search results from DOM
      let existingEntries = document.getElementsByClassName('search-item');
      for(i = 0; i < existingEntries.length; i){
        existingEntries[i].remove();
      }

      data.forEach((track, index) => {   
        // Add track row and name column to DOM
        let row = document.createElement('div');
        let col = document.createElement('div');
        let btn = document.createElement('button');
        btn.innerText = 'Add';
        row.classList = 'row search-item p-3 align-items-center ';
        btn.setAttribute('trackId', track.id);

        if(index % 2 === 0){
          row.classList += 'bg-light';
          btn.classList += 'btn btn-outline-dark';
        }else{
          row.classList += 'bg-dark text-light';
          btn.classList += 'btn btn-outline-light';
        }

        if(isMobile.matches){
          btn.classList += ' w-100'
        }

        col.classList = 'col-sm item-col d-flex ';
        col.innerText = track.name;
        row.appendChild(col);
        // Add artist column to DOM
        col = document.createElement('div');
        col.classList = 'col-sm item-col d-flex'
        let length = track.artists.length;
        // There can be multiple artists so iterate through
        track.artists.forEach((artist, index) => {  
          col.textContent += artist.name;
          if(index + 1 < length){ col.textContent += ' | ' }
        });
        row.appendChild(col);
        // Add album column to DOM
        col = document.createElement('div');
        col.classList = 'col-sm item-col d-flex '
        col.textContent = track.album.name;
        row.appendChild(col);
        // Add button column
        col = document.createElement('div');
        if(isMobile.matches){
          col.classList = 'col mt-3 d-flex justify-content-center'
        }else{
          col.classList = 'col d-flex justify-content-end'
        }
        col.appendChild(btn);
        row.appendChild(col);
        btn.addEventListener('mouseup', addTrack);
        main.appendChild(row);
      });

    })
    .catch((err) => console.log(err));
}


function addTrack(e){
  var urlParams = new URLSearchParams(window.location.search);
  var id = '';
  var track = e.target.attributes.trackid.value;
  var uri = 'addTrack';
  console.log(e);
  if(urlParams.has('id')){
    id = urlParams.get('id');
  }else{
    console.log("No id parmater");
    return;
  }  

  fetch(`${uri}?id=${id}&q=${track}`
  ).then((data) =>{
    return data.json();
  }).then(json => { 
    // Succesful add
    if(json.status == 204){
      e.target.style.visibility = 'hidden';
    // No device
    }else if(json.status == 404){
      alert("I can't find a device to play on. Start playing some music on the host first!");
    // No premium
    }else if(json.status == 403){
      alert("Host doesn't have premium!");
      let url = `http://${location.hostname}:${location.port}`
      window.open(url, '_self');
    }
  });
}