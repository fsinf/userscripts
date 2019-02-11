// ==UserScript==
// @name     TISS: Add VoWi LVA link
// @include  https://tiss.tuwien.ac.at/*
// @version  1
// @grant    none
// ==/UserScript==


header = document.getElementById("subHeader");

if (header != null) {
  header = header.innerText;
  lvaTyp = /[0-9WS]{5}, ([^,]+),/gm.exec(header)[1];

  heading = document.getElementById("contentInner").getElementsByTagName("h1")[0].innerText;
  lvaTitle = /^\s*[A-Z0-9\.]{7} (.*)$/gm.exec(heading)[1] + " " + lvaTyp;

  ul = document.getElementById("contentInner").getElementsByClassName("bulletList")[0];
  li = document.createElement("li");
  li.innerHTML = '<a href="' + encodeURI("https://vowi.fsinf.at/wiki/Spezial:ÄhnlichBenannteSeiten/" + lvaTitle.replace(/ /g, '_')) + '">Zum VoWi</a>';
  ul.appendChild(li);
}
