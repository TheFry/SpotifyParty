
const navbar = document.querySelector('#top-bar');
const loginRow = document.querySelector('#loginRow');
const startBtn = document.querySelector('#start-btn')
addEventListeners();
function addEventListeners(){
  window.addEventListener('load', setLength);
  window.addEventListener('resize', setLength);
}

function setLength(e){
  var navHeight = navbar.getBoundingClientRect().height;
  var winHeight = window.innerHeight;
  loginRow.setAttribute("style", `height: ${winHeight - navHeight}`);
}
