const host = 'https://spotify.thefry.dev/';
const port = '';

const navbar = document.querySelector('#top-bar');
const loginRow = document.querySelector('#loginRow');
const startBtn = document.querySelector('#start-button');
const endBtn = document.querySelector('#end-btn')
const btnContainer = document.querySelector('#button-container')
var isMobile = window.matchMedia('(max-width: 576px)');


addEventListeners();
function addEventListeners(){
  window.addEventListener('load', setSize);
  window.addEventListener('resize', setSize);
  startBtn.addEventListener('click', e => {
    window.location.replace(`${host}${port}/start`);
  });
  endBtn.addEventListener('click', e => {
    window.location.replace(`${host}${port}/end`);
  });
}

function setSize(e){
  var navHeight = navbar.getBoundingClientRect().height;
  var winHeight = window.innerHeight;
  loginRow.setAttribute("style", `height: ${winHeight - navHeight}`);
  if(isMobile.matches){
    btnContainer.classList = 'container rounded-3'
  }
}
