// ==UserScript==
// @name TISS: Add VoWi "LVA-Daten" template to course page
// @namespace https://vowi.fsinf.at/
// @match https://tiss.tuwien.ac.at/course/educationDetails.xhtml
// @match https://tiss.tuwien.ac.at/course/courseDetails.xhtml
// @grant none
// @version 2
// ==/UserScript==

if (document.getElementsByClassName("loading").length > 0) {
  // Don't run the script on sites which only contain the loading animation.
  return;
}

STUDIENKENNZAHL_BLACKLIST = [
  "E066011", // Erasmus
  "E033531", // Data Engineering & Statistics
  "E066933", // Information & Knowledge Management
  "860GW",   // Gebundene Wahlfächer - Technische Mathematik
  "884UF",   // Informatik und Informatikmanagement
  "175FW",   // Freie Wahlfächer - Wirtschaftsinformatik
  "880FW",   // Freie Wahlfächer - Informatik
];

function getLvaTitel() {
  let title = $("#contentInner h1").text();
  let matches = /^\s*([A-Z0-9.]{7})\s+(.*)$/gm.exec(title);
  return matches[2];
}

function getTissID() {
  let title = $("#contentInner h1").text();
  let matches = /^\s*([A-Z0-9.]{7})\s+(.*)$/gm.exec(title);
  return matches[1];
}

function getECTS() {
  let matches = /ECTS:\s([\d.]+)/.exec($("h2:contains('Merkmale') + ul > li").text());
  return matches[1].replace(".", ",").replace(",0", "");
}

function getLvaTyp() {
  let matches = /Typ:\s([A-Z]+)/.exec($("h2:contains('Merkmale') + ul > li").text());
  return matches[1];
}

function getVortragende() {
  let vortragende = [];
  $.each($("h2:contains('Vortragende') + ul > li"), (key, value) => {
    let a = $(value).find("a");
    let vortragender = a.text().split(", ");
    vortragender.reverse();
    vortragender = vortragender.join(" ");
    let personId = /(\d+)/.exec(a.attr("href"))[1];
    vortragende.push({
      wikiLink: `[[tiss.person:${personId}|${vortragender}]]`,
      name: vortragender,
      id: personId,
    });
  });
  return vortragende;
}

async function getLeiter(vortragende) {
  let leiter = [];
  let fallbackLeiter;
  let promises = vortragende.map((vortragender) => {
    return $.ajax({
      url: `https://tiss.tuwien.ac.at/adressbuch/adressbuch/person/${vortragender["id"]}`,
      dataType: "html",
    });
  });
  let adressbuchEntries = await Promise.all(promises);
  $.each(adressbuchEntries, (key, value) => {
    let titel = $(".vorangestellte-titel", value).text();
    let nachname = $(".nachname", value).text();
    if (titel.match(/Prof/) || titel.match(/PD/)) {
      leiter.push(nachname);
    } else if (key == 0) {
      fallbackLeiter = nachname;
    }
  });
  if (leiter.length == 0) {
    leiter.push(fallbackLeiter)
  }
  return leiter;
}

function getAbteilung() {
  return $("h2:contains('Institut') + ul > li").text().replace(/E\d+/, "").replace(/Institut für\s*/, "").trim();
}

function getSprache() {
  let sprache = $("h2:contains('Sprache')")[0].nextSibling.textContent;
  if (sprache.match(/Bei Bedarf/)) {
    return null;
  } else if (sprache == "Deutsch") {
    return "de";
  } else if (sprache == "Englisch") {
    return "en";
  }
}

function getSemester() {
  let semester = "";

  let semesters = $("#semesterForm option");
  if (semesters.length > 0) {
    // educationDetails
    let currentSemester = semesters[0].innerText;
    if (semesters.length > 1) {
      // course has been offered in more than one Semester already
      let lastSemester = $("#semesterForm option")[1].innerText;
      if (currentSemester[currentSemester.length - 1] == lastSemester[lastSemester.length - 1]) {
        semester = currentSemester[currentSemester.length - 1] + "S";
      } else {
        semester = "beide";
      }
    } else {
      // first time the course is held
      semester = currentSemester[currentSemester.length - 1] + "S";
    }
  } else {
    // courseDetails
    semester = "";
  }

  return semester;
}

function getHomepage() {
  return $("h2:contains('Weitere Informationen') + ul > li:contains('Homepage') a").attr("href");
}

function getWindowIdRequestTokenUrl(url) {
  // Thanks to Gittenburg for the hints.
  let windowId = dswh.utils.getWindowIdFromWindowName();
  let requestToken = dswh.utils.generateNewRequestToken();
  url = dswh.utils.setUrlParam(url, "dsrid", requestToken);
  url = dswh.utils.setUrlParam(url, "dswid", windowId);
  dswh.utils.storeCookie("dsrwid-" + requestToken, windowId, 3);
  return url;
}

function getModulNameFromTissID(data, tissID) {
  return $(`.courseKey:contains('${tissID}')`, data).parents("tr").prevAll("tr:has(.nodeTable-level-2)").first().find(".bold").text();
}

async function getModule(tissID) {
  let promises = [];

  $.each($("h2:contains('Curricula') + .ui-datatable tr.ui-widget-content"), (key, tr) => {
    let columns = $.find("td", tr);
    if (columns.length <= 3) {
      return;
    }
    let studienplanUrl = $(columns[0]).find("a").attr("href");
    let matches = /\s*([A-Z0-9 ]{3,7})\s+(.*)/.exec(columns[0].textContent);
    let studienkennzahl = matches[1].replace(" ", "");
    if (studienkennzahl[0] == "0") {
      studienkennzahl = "E" + studienkennzahl;
    }
    if ($.inArray(studienkennzahl, STUDIENKENNZAHL_BLACKLIST) != -1 || /^\d{3}$/.exec(studienkennzahl)) {
      return;
    }
    let studium = matches[2].trim();
    let semester = columns[1].textContent.trim();

    promises.push(
      $.ajax({
        url: getWindowIdRequestTokenUrl(studienplanUrl),
        dataType: "html",
      }).then((data) => {
        return {
          studienkennzahl: studienkennzahl,
          wahl: semester == "",
          name: getModulNameFromTissID(data, tissID),
        };
      })
    );
  });

  return Promise.all(promises);
}

function filterModule(module) {
  let trs = module.find((modul) => modul["studienkennzahl"] == "TRS") != null;
  if (!trs) {
    return module;
  } else {
    return module.filter((modul) => !(modul["name"].includes("Transferable Skills") || modul["name"].includes("Fachübergreifende Qualifikation")));
  }
}

async function showLvaDaten() {
  $("#vowi-lva-daten").html(`
    <link href="/course/javax.faces.resource/css/loading-animation.css.xhtml" rel="stylesheet" type="text/css" media="all"/>
    <div class="loading" style="width: 100px">
      <svg class="loadingImage css-animated" x="0px" y="0px" viewBox="0 0 313.3 321.4">
        <ellipse fill="#4e2085" class="layer3" cx="156.1768" cy="233.68542" rx="154.11563" ry="85.503227" ></ellipse>
        <ellipse fill="#ffffff" cx="155.7388" cy="187.82585" rx="154.11563" ry="85.503227" ></ellipse>
        <ellipse fill="#5d8d02" class="layer2" cx="154.61943" cy="162.44199" rx="154.11563" ry="85.503227" ></ellipse>
        <ellipse fill="#ffffff" cx="154.18143" cy="116.5824" rx="154.11563" ry="85.503227" ></ellipse>
        <ellipse fill="#d27200" class="layer1" cx="153.95023" cy="87.492676" rx="154.11563" ry="85.503227" ></ellipse>
      </svg>
    </div>
`);

  let lvaTitel = getLvaTitel();
  let tissID = getTissID();
  let ects = getECTS();
  let lvaTyp = getLvaTyp();
  let vortragende = getVortragende();
  let leiter = await getLeiter(vortragende);
  let abteilung = getAbteilung();
  let sprache = getSprache();
  let semester = getSemester();
  let homepage = getHomepage();
  let module = filterModule(await getModule(tissID));

  // Build final template
  let lvaDaten = `
{{LVA-Daten
| ects = ${ects}
| vortragende = ${vortragende.map((vortragender) => vortragender["wikiLink"]).join(", ")}
| abteilung = ${abteilung}${homepage != undefined ? "\n| homepage = " + homepage : ""}
| tiss = ${tissID.replace(".", "")}
| wann = ${semester}${sprache != null ? "\n| sprache = " + sprache : ""}
| zuordnungen =
    ${module.map((modul) => `{{Zuordnung|${modul["studienkennzahl"]}|${modul["name"]}${modul["wahl"] ? "|wahl=1" : ""}}}`).join("\n    ")}
}}
`;
  $("#vowi-lva-daten").html(`
<ul class="bulletList">
<li><a href="https://vowi.fsinf.at/wiki/Spezial:ÄhnlichBenannteSeiten/${lvaTitel} ${lvaTyp}" target="_blank">${lvaTitel} ${lvaTyp}</a></li>
<li><a href="https://vowi.fsinf.at/wiki/TU_Wien:${lvaTitel} ${lvaTyp} (${leiter[0]})?action=edit" target="_blank">${lvaTitel} ${lvaTyp} (${leiter[0]}) erstellen</a></li>
</ul>
<pre style="white-space: pre-wrap; font-size:11px">${lvaDaten}</pre>
`);
}

$("#contentInner > form").append(`
<h2>VoWi LVA-Daten</h2>
<div id="vowi-lva-daten"><button id="vowi-lva-daten-btn">Anzeigen</button></div>
`);
$("#vowi-lva-daten-btn").on("click", (event) => {
  event.preventDefault();
  showLvaDaten();
});
