const host = 'https://spotify.thefry.dev';

// Outer facing port
// Set to none if using 80 or 443
// Add leading : if using any other port
const port = '';
const navbar = document.querySelector('#top-bar');
const linkElm = document.querySelector('#share-link');
const bodyContainer = document.querySelector('#body-container');
addEventListeners();
function addEventListeners(){
  window.addEventListener('load', setLink);
  window.addEventListener('load', setLength);
  window.addEventListener('resize', setLength);
}

function setLink(e){
  console.log('set')
  var myUrl = `${host}${[port/play]}` + window.location.search;

  linkElm.setAttribute('href', myUrl);
  linkElm.innerHTML = myUrl;
}


function setLength(e){
  var navHeight = navbar.getBoundingClientRect().height;
  var winHeight = window.innerHeight;
  bodyContainer.setAttribute("style", `height: ${winHeight - navHeight}`);
}