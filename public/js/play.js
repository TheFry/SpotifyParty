const searchBtn = document.querySelector('#search-btn');
const searchInput = document.querySelector('#search-input');
addEventListeners();

function addEventListeners(){
  searchBtn.addEventListener('click', searchNow);
}


function searchNow(e){
  var urlParams = new URLSearchParams(window.location.search);
  var id;
  var uri = 'search'
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
    .then((res) => console.log(res))
    .catch((err) => console.log(err))
  

}