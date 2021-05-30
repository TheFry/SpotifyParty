
const navbar = document.querySelector('#top-bar');
const loginRow = document.querySelector('#logoutRow');
const startBtn = document.querySelector('#end-btn');
const emailInput = document.querySelector('#email-input')
const btnContainer = document.querySelector('#button-container')
var isMobile = window.matchMedia('(max-width: 576px)');

addEventListeners();
function addEventListeners(){
  window.addEventListener('load', setSize);
  window.addEventListener('resize', setSize);
  document.addEventListener('keydown', checkKey);
}

function checkKey(e){
  if(e.key === 'Enter'){
    endParty();
  }
}


function setSize(e){
  var navHeight = navbar.getBoundingClientRect().height;
  var winHeight = window.innerHeight;
  loginRow.setAttribute("style", `height: ${winHeight - navHeight}`);
  if(isMobile.matches){
    btnContainer.classList = 'container'
  }
}

function endParty(){
  if(emailInput.value === ''){
    console.log("No input")
    return;
  }
  const digest = crypto.subtle.digest('SHA-256', new ArrayBuffer(emailInput.value));
  digest.then(data => {
    console.log('testing');
    console.log(data.toString());
  });
}

