const host = 'https://spotify.thefry.dev';

// Outer facing port
// Set to none if using 80 or 443
// Add leading : if using any other port
const port = '';

const navbar = document.querySelector('#top-bar');
const loginRow = document.querySelector('#loginRow');
const startBtn = document.querySelector('#start-btn');
const endBtn = document.querySelector('#end-btn')
const btnContainer = document.querySelector('#button-container')
var isMobile = window.matchMedia('(max-width: 576px)');

addEventListeners();
function addEventListeners(){
  window.addEventListener('load', setSize);
  window.addEventListener('resize', setSize);
  startBtn.addEventListener('click', e => {
    window.location.replace(`${host}${port}`);
  });
}

function setSize(e){
  var navHeight = navbar.getBoundingClientRect().height;
  var winHeight = window.innerHeight;
  endBtn.disabled = true;
  loginRow.setAttribute("style", `height: ${winHeight - navHeight}`);
  if(isMobile.matches){
    btnContainer.classList = 'container rounded-3'
  }
}
