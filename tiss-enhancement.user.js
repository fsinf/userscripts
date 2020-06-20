// ==UserScript==
// @name        VoWi and Mattermost links in TISS
// @description Add links to VoWi pages and Mattermost channels to TISS courses.
// @namespace   https://fsinf.at/
// @match       https://tiss.tuwien.ac.at/course/educationDetails.xhtml*
// @match       https://tiss.tuwien.ac.at/course/courseDetails.xhtml*
// @match       https://tiss.tuwien.ac.at/education/favorites.xhtml*
// @grant       none
// @version     1.12
// @downloadURL https://fsinf.at/userscripts/tiss-enhancement.user.js
// @updateURL   https://fsinf.at/userscripts/tiss-enhancement.user.js
// ==/UserScript==

// Inspired by https://greasyfork.org/de/scripts/9914-tiss-enhancer/

if (document.getElementsByClassName("loading").length > 0) {
  // Don't run the script on sites which only contain the loading animation.
  return;
}

function vowi_link(tissID) {
  return "https://vowi.fsinf.at/wiki/Spezial:CourseById?ns=TU_Wien&id=" + tissID;
}

function mm_link(lvaTitle) {
    var channame = lvaTitle.toLowerCase().replace('ä','ae').replace('ö','oe').replace('ü','ue');
    channame = channame.replace(/[^a-zA-Z0-9_]/g,'-');
    channame = channame.replace(/-+/g,'-');
    channame = channame.substring(0,63);
    channame = channame.replace(/-$/, '');

    return "https://mattermost.fsinf.at/w-inf-tuwien/channels/" + encodeURIComponent(channame);
}

var page = window.location.href.match(/tiss.tuwien.ac.at\/([\w\/]+)\.xhtml/i)[1];
var locale = document.cookie.match(/TISS_LANG=([\w-]+)/);
locale = locale ? locale[1] : "de";


// course overview: add VoWi link
if (page == "course/educationDetails" || page == "course/courseDetails") {
  var header = document.getElementById("subHeader").innerText;

  var heading = document.getElementById("contentInner").getElementsByTagName("h1")[0].innerText;
  var lvaTitle = /^\s*[A-Z0-9\.]{7} (.*)$/gm.exec(heading)[1];
  var tissID = /^\s*([A-Z0-9.]{7})\s+(.*)$/gm.exec(heading)[1].replace(".", "");

  var ul = document.getElementById("contentInner").getElementsByClassName("bulletList")[0];
  var li = document.createElement("li");
  li.innerHTML = '<a href="' + vowi_link(tissID) + '" target="_blank">' + (locale == "de" ? "Zum" : "To") + ' VoWi</a>';
  ul.appendChild(li);

  li = document.createElement("li");
  li.innerHTML = '<a href="' + mm_link(lvaTitle) + '" target="_blank">' + (locale == "de" ? "Zum" : "To") + ' Mattermost-Channel</a>';
  ul.appendChild(li);
}

// favorites page: add VoWi link icon
if (page == "education/favorites") {

  // Creating the node once and cloning it is noticeably faster than modifying the original
  // image element in place and overwriting the src attribute with the base64 string.
  var tuwelTemplate = document.createElement("img");
  tuwelTemplate.src = `
    data:image/png;base64,
    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
  `;
  tuwelTemplate.alt = "TUWEL";
  tuwelTemplate.title = "TUWEL";
  tuwelTemplate.style = "margin-right: 5px";

  Array.from(document.querySelectorAll("tr.ui-widget-content")).forEach(function(row, index) {
    var titleCol = row.getElementsByClassName("favoritesTitleCol")[0];
    var lvaTitle = titleCol.getElementsByTagName("a")[0].text.trim();
    var tissID = titleCol.querySelector("span[title='LVA Nr.'],span[title='Course Nr.']").textContent.replace(".", "");

    var a = document.createElement("a");
    a.href = mm_link(lvaTitle);
    a.target = "_blank";

    var img = document.createElement("img");
    img.src = "https://mattermost.fsinf.at/static/images/favicon/favicon-32x32.png";
    img.title = "Mattermost";
    img.alt = "Mattermost";
    img.width = 16;
    img.height = 16;
    img.style = "margin-right: 5px";

    a.appendChild(img);

    var favoritesLinks = row.getElementsByClassName("favoritesLinks")[0];
    favoritesLinks.insertBefore(a, favoritesLinks.childNodes[0]);

    a = document.createElement("a");
    a.href = vowi_link(tissID);
    a.target = "_blank";

    img = document.createElement("img");
    img.src = "https://vowi.fsinf.at/favicon.ico";
    img.title = "VoWi";
    img.alt = "VoWi";
    img.width = 16;
    img.height = 16;
    img.style = "margin-right: 5px";

    a.appendChild(img);

    favoritesLinks = row.getElementsByClassName("favoritesLinks")[0];
    favoritesLinks.insertBefore(a, favoritesLinks.childNodes[0]);
    favoritesLinks.style = "width: 120px !important";

    var tuwel = row.querySelector("img[title='TUWEL']");
    if (tuwel !== null) {
      tuwel.parentElement.target = "_blank";
      tuwel.replaceWith(tuwelTemplate.cloneNode(false));
    }
  });
}
