URL="http://localhost:8888"

const linkElm = document.querySelector('#share-link');

addEventListeners();
function addEventListeners(){
  window.addEventListener('load', setLink);
}

function setLink(e){
  console.log('set')
  var myUrl = URL + "/play" + window.location.search;

  linkElm.setAttribute('href', myUrl);
  linkElm.innerHTML = myUrl;
}