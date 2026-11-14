/* Carries the board key (the code after #) to every project link, so the student never loses it. */
(function(){
  try{
    var key = (window.location.hash || "").replace(/^#/, "");
    if(!/^[a-f0-9]{20,}$/i.test(key)) return;
    var links = document.querySelectorAll("a[data-keyed]");
    for(var i=0;i<links.length;i++){
      var h = links[i].getAttribute("href").split("#")[0];
      links[i].setAttribute("href", h + "#" + key);
    }
  }catch(e){}
})();
