// ==UserScript==
// @name     TISS: Add VoWi LVA link
// @include  https://tiss.tuwien.ac.at/*
// @version  1
// @grant    none
// ==/UserScript==

// Inspired by https://greasyfork.org/de/scripts/9914-tiss-enhancer/

function vowi_link(lvaTitle) {
  return "https://vowi.fsinf.at/wiki/Spezial:ÄhnlichBenannteSeiten/" + encodeURIComponent(lvaTitle.replace(/ /g, '_'));
}

page = window.location.href.match(/tiss.tuwien.ac.at\/([\w\/]+)\.xhtml/i)[1];
locale = document.cookie.match(/TISS_LANG=([\w-]+)/);
locale = locale ? locale[1] : "de";


// course overview: add VoWi link
if (page == "course/educationDetails") {
  header = document.getElementById("subHeader").innerText;
  lvaTyp = /[0-9WS]{5}, ([^,]+),/gm.exec(header)[1];

  heading = document.getElementById("contentInner").getElementsByTagName("h1")[0].innerText;
  lvaTitle = /^\s*[A-Z0-9\.]{7} (.*)$/gm.exec(heading)[1] + " " + lvaTyp;

  ul = document.getElementById("contentInner").getElementsByClassName("bulletList")[0];
  li = document.createElement("li");
  li.innerHTML = '<a href="' + vowi_link(lvaTitle) + '" target="_blank">' + (locale == "de" ? "Zum" : "To") + ' VoWi</a>';
  ul.appendChild(li);
}

// favorites page: add VoWi link icon
if (page == "education/favorites") {
  Array.from(document.querySelectorAll("tr.ui-widget-content")).forEach(function(row, index) {
    var titleCol = row.getElementsByClassName("favoritesTitleCol")[0];
    var lvaTitle = titleCol.getElementsByTagName("a")[0].text.trim();
    var lvaTyp = titleCol.querySelector("span[title='Typ']").textContent.match(/, ([^,]+),/)[1];
    lvaTitle = lvaTitle + " " + lvaTyp;

    var a = document.createElement("a");
    a.href = vowi_link(lvaTitle);
    a.target = "_blank";

    var img = document.createElement("img");
    img.src = "https://vowi.fsinf.at/favicon.ico";
    img.title = "VoWi";
    img.width = 16;
    img.height = 16;
    img.style = "margin-right: 5px";

    a.appendChild(img);

    var favoritesLinks = row.getElementsByClassName("favoritesLinks")[0];
    favoritesLinks.insertBefore(a, favoritesLinks.childNodes[0]);
    favoritesLinks.style = "width: 75px !important";
  });
}
