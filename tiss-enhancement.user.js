// ==UserScript==
// @name        VoWi and Mattermost links in TISS
// @description Add links to VoWi pages and Mattermost channels to TISS courses.
// @namespace   https://fsinf.at/
// @match       https://tiss.tuwien.ac.at/course/educationDetails.xhtml*
// @match       https://tiss.tuwien.ac.at/course/courseDetails.xhtml*
// @match       https://tiss.tuwien.ac.at/education/favorites.xhtml*
// @grant       none
// @version     1.13
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

  var dlTemplate = document.createElement("img");
  dlTemplate.src = `
    data:image/png;base64,
    iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QA/wD/AP+gvaeTAAAACXBI
    WXMAAC4jAAAuIwF4pT92AAABXUlEQVQ4y+2Tv0tCURzFP+/1VEoypCHCSAeJECGMpppaJHFpF6Kx
    SWgQ+gcCh4aamiUborEIJCKMIIrAUpFCLLUfDipiIijos0HUTIJKh4bOdO/l8Ll8z7lXwHlQowcS
    6ZH+HkhqLFwmLSpRIJgqYhxWcZosECi1x+cyaVGKMuvhfAdIaISddVvRKCT2jiM4bGYq1QpX4Tgr
    u3eEynVz1m1lUFFGuervmEX6uKlRwhdKU6mFmbOMMTtlxKMSmd6O/DSjKjtPRZZ9ceY3L8gUy1gm
    9SzphN+H/VyqEnvJAX3MGIa6a02W62GLotgdSDeiASCayn+//laPAouj/TjtE4xr1SRTKbaiVRDa
    rzdI9YOCXCMrfwIJqPHa9DhsZgBe01nWPLdtEAE13gVD03N0HsS+n2yB/NcJBiSRUCLP4dk9wccM
    Gzc5cnIL0vQk85xcPgAQiL21P8j/3/+l3gFrvHeTUEQuDAAAAABJRU5ErkJggg==
  `;
  dlTemplate.alt = "Distance Learning";
  dlTemplate.style = "vertical-align: bottom";

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

    a.appendChild(img);

    var favoritesLinksPanel = row.getElementsByClassName("favoritesLinksPanel")[0];
    favoritesLinksPanel.insertBefore(a, favoritesLinksPanel.childNodes[0]);

    a = document.createElement("a");
    a.href = vowi_link(tissID);
    a.target = "_blank";

    img = document.createElement("img");
    img.src = "https://vowi.fsinf.at/favicon.ico";
    img.title = "VoWi";
    img.alt = "VoWi";
    img.width = 16;
    img.height = 16;

    a.appendChild(img);

    favoritesLinksPanel = row.getElementsByClassName("favoritesLinksPanel")[0];
    favoritesLinksPanel.insertBefore(a, favoritesLinksPanel.childNodes[0]);

    var dl = row.querySelector("img[alt='Distance Learning']");
    if (dl !== null) {
      dl.replaceWith(dlTemplate.cloneNode(false));
    }
  });
}
