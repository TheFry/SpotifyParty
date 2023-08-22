
const navbar = document.querySelector('#top-bar');
const loginRow = document.querySelector('#logoutRow');
const endBtn = document.querySelector('#end-btn');
const emailInput = document.querySelector('#email-input')
const btnContainer = document.querySelector('#button-container')

var isMobile = window.matchMedia('(max-width: 576px)');
const crypto = Crypto.subtle;
const host = 'https://spotify.thefry.dev/';
const port = '';

addEventListeners();
function addEventListeners(){
  window.addEventListener('load', setSize);
  window.addEventListener('resize', setSize);
  document.addEventListener('keydown', checkKey);
  endBtn.addEventListener('click', (e) => {
    endParty();
  });
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


async function digestMessage(message) {
  try{
    const msgUint8 = new TextEncoder().encode(message);                           
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);           
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
    return(hashHex);
  }catch(err){
    console.log(err);
    return null;
  }
}


async function endParty(){
  if(!emailInput.value){
    console.log("No input");
    return(1);
  }

  const digest = await digestMessage(emailInput.value);

  if(digest === null){ return 1 };
  fetch(`${host}${port}/logout?id=${digest}`).then(data => {
    console.log(data.status);
    if(data.status === 200){
      console.log('success');
      window.location.replace(`${host}${port}`);
    }else if(data.status === 404){
      window.alert('Couldn\'t find a session with that email');
      return(1);
    }
  }, err => {
    console.log(err);
    window.alert('internal error. message sent to ops');
    return(1);
  });
}

