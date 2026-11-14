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

/* Makes the choice chips in lessons clickable: tap to select, tap again to unselect. */
(function(){
  try{
    var chips = document.querySelectorAll(".chips .chip, .choices .chip");
    for(var i=0;i<chips.length;i++){
      var c = chips[i];
      if(c.closest && c.closest(".static")) continue;
      c.setAttribute("role","button");
      c.setAttribute("tabindex","0");
      c.setAttribute("aria-pressed","false");
      c.classList.add("pickable");
      var toggle = function(el){
        var on = el.getAttribute("aria-pressed") !== "true";
        el.setAttribute("aria-pressed", on ? "true" : "false");
      };
      c.addEventListener("click", function(){ toggle(this); });
      c.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); toggle(this); }
      });
    }
  }catch(e){}
})();
