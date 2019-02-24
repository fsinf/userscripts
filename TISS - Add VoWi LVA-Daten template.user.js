// ==UserScript==
// @name TISS: Add VoWi "LVA-Daten" template to course page
// @namespace https://vowi.fsinf.at/
// @match https://tiss.tuwien.ac.at/course/educationDetails.xhtml
// @grant none
// ==/UserScript==

// Extract title and TISS ID
title = $('#contentInner h1').text()
matches = /^\s*([A-Z0-9\.]{7})\s+(.*)$/gm.exec(title)
tiss = matches[1]
lvaTitle = matches[2]

// Extract ECTS
matches = /ECTS: ([\d\.]+)/.exec($('h2:contains("Merkmale") + ul > li').text())
ects = matches[1].replace('.', ',').replace(",0", "")

// Extract Typ
matches = /Typ: ([A-Z]+)/.exec($('h2:contains("Merkmale") + ul > li').text())
lvaTyp = matches[1]

// Extract Vortragende
vortragende = []
$.each($('h2:contains("Vortragende") + ul > li'), function (key, value) {
  var a = $(value).find('a')
  var vortragender = a.text().split(", ")
  if (key == 0) {
    leiter = vortragender[0]
  }
  vortragender.reverse()
  vortragender = vortragender.join(" ") 
  var personId = /(\d+)/.exec(a.attr('href'))[1]
  vortragende.push(`[[tiss.person:${personId}|${vortragender}]]`)
})

// Extract Abteilung
abteilung = $('h2:contains("Institut") + ul > li').text().replace(/E\d+/, "").replace(/Institut für /, "").trim()

// Extract Sprache
sprache = $('h2:contains("Sprache")')[0].nextSibling.textContent

// Extract Semester
currentSemester = $('#semesterForm option')[0].innerText
lastSemester = $('#semesterForm option')[1].innerText
if (currentSemester[currentSemester.length - 1] == lastSemester[lastSemester.length - 1]) {
  semester = currentSemester[currentSemester.length - 1] + "S"
} else {
  semester = "beide"
}

// Extract Homepage
homepage = $('h2:contains("Weitere Informationen") + ul > li:contains("Homepage") a').attr("href")

// Extract Module
module = []
$.each($('h2:contains("Curricula") + .ui-datatable tr.ui-widget-content'), function (key, tr) {
  var columns = $.find('td', tr)
  if (columns.length <= 3) {
    return
  }
  var matches = /\s*([A-Z0-9 ]{3,7})\s+(.*)/.exec(columns[0].textContent)
  var studienkennzahl = matches[1].replace(' ', '')
  if (studienkennzahl[0] == "0") {
    studienkennzahl = "E" + studienkennzahl
  }
  var studium = matches[2].trim()
  var semester = columns[1].textContent.trim()
  module.push(`{{Zuordnung|${studienkennzahl}${semester == "" ? "|wahl=1" : ""}}}`)
})

// Build final template
lvaDaten = `
{{LVA-Daten
| ects = ${ects}
| vortragende = ${vortragende.join(", ")}
| abteilung = ${abteilung}${homepage != undefined ? "\n| homepage = " + homepage : ""}
| tiss = ${tiss}
| wann = ${semester}
| sprache = ${sprache}
| zuordnungen =
    ${module.join("\n    ")}
}}
`

$('#contentInner > form').append(`
<h2>VoWi LVA-Daten</h2>
<ul class="bulletList">
<li><a href="https://vowi.fsinf.at/wiki/Spezial:ÄhnlichBenannteSeiten/${lvaTitle} ${lvaTyp}" target="_blank">${lvaTitle} ${lvaTyp}</a></li>
<li><a href="https://vowi.fsinf.at/wiki/TU_Wien:${lvaTitle} ${lvaTyp} (${leiter})?action=edit" target="_blank">${lvaTitle} ${lvaTyp} (${leiter}) erstellen</a></li>
</ul>
<pre style="white-space: pre-wrap; font-size:11pt">${lvaDaten}</pre>
`)
