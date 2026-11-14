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
      if(c.closest && (c.closest(".static") || c.closest(".order"))) continue;
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

/* "Choose your three": each statement list right after a .key becomes interactive.
   Tap a level on a statement (each level can be used once), then write a sentence to explain.
   Answers stay on this device and can be copied into the journal. */
(function(){
  try{
    var LV = [
      {n:1, label:"strongly agree", start:"I strongly agree because "},
      {n:2, label:"partly agree", start:"I partly agree because "},
      {n:3, label:"totally disagree", start:"I totally disagree because "}
    ];
    var keys = document.querySelectorAll(".key");
    for(var k=0;k<keys.length;k++) (function(keyEl, idx){
      var list = keyEl.nextElementSibling;
      if(!list || !list.classList.contains("statements")) return;
      list.classList.add("agree");
      var store = "psn-agree-" + location.pathname.split("/").pop() + "-" + idx;
      var state = {};
      try{ state = JSON.parse(localStorage.getItem(store) || "{}") || {}; }catch(e){ state = {}; }
      function save(){ try{ localStorage.setItem(store, JSON.stringify(state)); }catch(e){} }
      var items = list.querySelectorAll(".st");
      var rows = [];
      for(var i=0;i<items.length;i++) (function(st, i){
        var text = st.textContent.trim();
        var lv = document.createElement("div"); lv.className = "lv";
        var btns = LV.map(function(L){
          var b = document.createElement("button");
          b.type = "button"; b.className = "b" + L.n; b.textContent = L.label;
          b.setAttribute("aria-pressed","false");
          b.addEventListener("click", function(){ pick(i, L.n); });
          lv.appendChild(b); return b;
        });
        var ta = document.createElement("textarea");
        ta.setAttribute("aria-label", "Explain your choice: " + text);
        ta.style.display = "none";
        ta.addEventListener("input", function(){ var s = state[i]; if(s){ s.why = ta.value; save(); } });
        st.appendChild(lv); st.appendChild(ta);
        rows.push({st:st, text:text, btns:btns, ta:ta});
      })(items[i], i);
      var bar = document.createElement("div"); bar.className = "agree-bar";
      var done = document.createElement("span"); done.className = "done";
      var copy = document.createElement("button"); copy.type = "button"; copy.className = "btn"; copy.textContent = "Copy my answers";
      bar.appendChild(copy); bar.appendChild(done);
      list.parentNode.insertBefore(bar, list.nextSibling);
      function pick(i, n){
        var cur = state[i];
        if(cur && cur.lv === n){ delete state[i]; }
        else{
          for(var j in state){ if(state[j].lv === n && +j !== i) delete state[j]; }
          var why = cur && cur.why ? cur.why : "";
          if(cur && cur.lv !== n){
            var oldStart = LV[cur.lv-1].start;
            if(why.indexOf(oldStart) === 0) why = LV[n-1].start + why.slice(oldStart.length);
          }
          state[i] = {lv:n, why: why || LV[n-1].start};
        }
        save(); render();
        var s = state[i];
        if(s){ var ta = rows[i].ta; ta.focus(); try{ ta.setSelectionRange(ta.value.length, ta.value.length); }catch(e){} }
      }
      function render(){
        var count = 0;
        rows.forEach(function(r, i){
          var s = state[i];
          r.st.classList.remove("s1","s2","s3");
          r.btns.forEach(function(b, bi){ b.setAttribute("aria-pressed", s && s.lv === bi+1 ? "true" : "false"); });
          if(s){
            count++;
            r.st.classList.add("s" + s.lv);
            r.ta.style.display = "block";
            if(r.ta.value !== s.why) r.ta.value = s.why;
            r.ta.placeholder = LV[s.lv-1].start + "…";
          } else {
            r.ta.style.display = "none";
          }
        });
        done.textContent = count + " of 3 chosen";
      }
      copy.addEventListener("click", function(){
        var lines = [];
        LV.forEach(function(L){
          rows.forEach(function(r, i){
            var s = state[i];
            if(s && s.lv === L.n) lines.push(L.label.toUpperCase() + ": " + r.text + "\n" + (s.why || ""));
          });
        });
        var out = lines.join("\n\n");
        if(!out){ done.textContent = "Choose a statement first."; return; }
        function ok(){ done.textContent = "Copied. Paste it into your journal."; }
        function fallback(){
          var t = document.createElement("textarea"); t.value = out; t.setAttribute("readonly","");
          t.style.position = "fixed"; t.style.top = "-1000px"; document.body.appendChild(t);
          t.select(); try{ document.execCommand("copy"); ok(); }catch(e){ done.textContent = "Select your answers and copy them."; }
          document.body.removeChild(t);
        }
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(out).then(ok, fallback); }
        else fallback();
      });
      render();
    })(keys[k], k);
  }catch(e){}
})();

/* On-screen answers: every textarea.ans saves on this device as he types.
   A .copy-ans button copies the answers in its section, with the questions, for the journal. */
(function(){
  try{
    var page = location.pathname.split("/").pop() || "page";
    var boxes = document.querySelectorAll("textarea.ans");
    for(var i=0;i<boxes.length;i++) (function(ta, i){
      var id = ta.getAttribute("data-id") ? "psn-ans-" + ta.getAttribute("data-id") : "psn-ans-" + page + "-" + i;
      try{ var v = localStorage.getItem(id); if(v) ta.value = v; }catch(e){}
      ta.addEventListener("input", function(){ try{ localStorage.setItem(id, ta.value); }catch(e){} });
    })(boxes[i], i);
    var btns = document.querySelectorAll(".copy-ans");
    for(var b=0;b<btns.length;b++) (function(btn){
      btn.addEventListener("click", function(){
        var sec = btn.closest ? btn.closest("section") : null;
        var msg = btn.parentNode.querySelector(".done");
        var h = sec && sec.querySelector("h2") ? sec.querySelector("h2").textContent.trim() : "";
        var tas = sec ? sec.querySelectorAll("textarea.ans") : [];
        var lines = [];
        for(var k=0;k<tas.length;k++){ if(tas[k].value.trim()) lines.push(tas[k].getAttribute("data-q") + ":\n" + tas[k].value.trim()); }
        if(!lines.length){ if(msg) msg.textContent = "Write an answer first."; return; }
        var out = (h ? h.toUpperCase() + "\n\n" : "") + lines.join("\n\n");
        function ok(){ if(msg) msg.textContent = "Copied. Paste it into your journal."; }
        function fallback(){
          var t = document.createElement("textarea"); t.value = out; t.setAttribute("readonly","");
          t.style.position = "fixed"; t.style.top = "-1000px"; document.body.appendChild(t);
          t.select(); try{ document.execCommand("copy"); ok(); }catch(e){ if(msg) msg.textContent = "Select your answers and copy them."; }
          document.body.removeChild(t);
        }
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(out).then(ok, fallback); } else fallback();
      });
    })(btns[b]);
  }catch(e){}
})();


/* Ordering: tap chips in order to number them 1, 2, 3…; tap a numbered chip to take it out.
   The order is shown underneath and saved on this device. */
(function(){
  try{
    var lists = document.querySelectorAll(".chips.order");
    for(var L=0; L<lists.length; L++) (function(box, L){
      var key = "psn-order-" + (box.getAttribute("data-id") || (location.pathname.split("/").pop() + "-" + L));
      var chips = box.querySelectorAll(".chip");
      var order = [];
      try{ order = JSON.parse(localStorage.getItem(key) || "[]") || []; }catch(e){ order = []; }
      order = order.filter(function(i){ return i >= 0 && i < chips.length; });
      var out = document.createElement("div"); out.className = "orderout";
      box.parentNode.insertBefore(out, box.nextSibling);
      for(var i=0;i<chips.length;i++) (function(c, i){
        c.setAttribute("role","button"); c.setAttribute("tabindex","0"); c.classList.add("pickable");
        var badge = document.createElement("span"); badge.className = "onum"; badge.setAttribute("aria-hidden","true");
        c.insertBefore(badge, c.firstChild);
        var tap = function(){
          var at = order.indexOf(i);
          if(at >= 0) order.splice(at, 1); else order.push(i);
          save(); render();
        };
        c.addEventListener("click", tap);
        c.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); tap(); } });
      })(chips[i], i);
      function text(c){ var t = c.cloneNode(true); var b = t.querySelector(".onum"); if(b) b.parentNode.removeChild(b); return t.textContent.trim(); }
      function save(){ try{ localStorage.setItem(key, JSON.stringify(order)); }catch(e){} }
      function render(){
        for(var i=0;i<chips.length;i++){
          var at = order.indexOf(i), b = chips[i].querySelector(".onum");
          chips[i].setAttribute("aria-pressed", at >= 0 ? "true" : "false");
          b.textContent = at >= 0 ? String(at + 1) : "";
        }
        if(!order.length){ out.innerHTML = '<span class="small">Tap the chips in order.</span>'; return; }
        var h = '<ol>';
        order.forEach(function(i){ h += '<li>' + text(chips[i]).replace(/[&<>]/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[m]; }) + '</li>'; });
        h += '</ol>';
        h += (order.length === chips.length ? '<span class="small">Done! Tap a chip to take it out and change your order.</span> ' : '') + '<button type="button" class="oreset">Start again</button>';
        out.innerHTML = h;
        var r = out.querySelector(".oreset");
        if(r) r.addEventListener("click", function(){ order = []; save(); render(); });
      }
      render();
    })(lists[L], L);
  }catch(e){}
})();

/* Gap-fill sentences: each blank becomes a box he can type in (saved on this device).
   "Check" marks blanks that have an answer key; "See an example" shows a model sentence. */
(function(){
  try{
    var page = location.pathname.split("/").pop() || "page";
    var frames = document.querySelectorAll(".frame[data-model]");
    function norm(t){ return String(t || "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim(); }
    for(var f=0; f<frames.length; f++) (function(fr, f){
      var blanks = fr.querySelectorAll(".blank");
      var inputs = [];
      for(var b=0; b<blanks.length; b++) (function(sp, b){
        var inp = document.createElement("input");
        inp.type = "text"; inp.className = "gap"; inp.setAttribute("autocomplete","off"); inp.setAttribute("autocapitalize","off");
        inp.setAttribute("aria-label", "Blank " + (b + 1));
        if(sp.getAttribute("data-ans")) inp.setAttribute("data-ans", sp.getAttribute("data-ans"));
        var key = "psn-gap-" + page + "-" + f + "-" + b;
        try{ var v = localStorage.getItem(key); if(v) inp.value = v; }catch(e){}
        var fit = function(){ inp.size = Math.max(10, Math.min(60, inp.value.length + 2)); };
        fit();
        inp.addEventListener("input", function(){ fit(); inp.classList.remove("ok","no"); try{ localStorage.setItem(key, inp.value); }catch(e){} });
        sp.parentNode.replaceChild(inp, sp);
        inputs.push(inp);
      })(blanks[b], b);
      var hasKey = inputs.some(function(i){ return i.getAttribute("data-ans"); });
      var bar = document.createElement("div"); bar.className = "gapbar";
      var msg = document.createElement("span"); msg.className = "gapmsg";
      if(hasKey){
        var chk = document.createElement("button"); chk.type = "button"; chk.className = "gapbtn"; chk.textContent = "Check";
        chk.addEventListener("click", function(){
          var empty = 0, wrong = 0;
          inputs.forEach(function(i){
            var v = norm(i.value);
            i.classList.remove("ok","no");
            if(!v){ empty++; return; }
            var ans = i.getAttribute("data-ans");
            if(!ans){ i.classList.add("ok"); return; }
            var good = ans.split("|").some(function(a){ return v.indexOf(norm(a)) >= 0; });
            i.classList.add(good ? "ok" : "no"); if(!good) wrong++;
          });
          if(empty){ msg.textContent = "Fill in every blank first."; return; }
          msg.textContent = wrong ? "Not quite. Look back at the source and try again, or see an example." : "Good! That matches the source.";
        });
        bar.appendChild(chk);
      }
      var ex = document.createElement("button"); ex.type = "button"; ex.className = "gapbtn ghost"; ex.textContent = "See an example";
      var model = document.createElement("div"); model.className = "gapmodel"; model.textContent = "Example: " + fr.getAttribute("data-model"); model.style.display = "none";
      ex.addEventListener("click", function(){
        var show = model.style.display === "none";
        model.style.display = show ? "block" : "none";
        ex.textContent = show ? "Hide the example" : "See an example";
      });
      bar.appendChild(ex); bar.appendChild(msg);
      fr.parentNode.insertBefore(bar, fr.nextSibling);
      bar.parentNode.insertBefore(model, bar.nextSibling);
    })(frames[f], f);
  }catch(e){}
})();
