// ==UserScript==
// @name To VoWi
// @namespace Violentmonkey Scripts
// @match https://ufind.univie.ac.at/de/course.html
// @match https://ufind.univie.ac.at/en/course.html
// @description Does not work with Greasemonkey because of https://github.com/greasemonkey/greasemonkey/issues/2700
// @grant none
// ==/UserScript==

function vowiLink(ns, id) {
  return 'https://vowi.fsinf.at/wiki/Spezial:CourseById?ns=' + ns + '&id=' + id;
}

document.addEventListener('ufind:finished', function (e) {
  var id = document.getElementsByClassName('number')[0].textContent + '/' + document.getElementsByClassName('when')[0].textContent;
  var a = document.createElement("a");
  a.href = vowiLink('Uni_Wien', id);
  a.innerHTML = 'zum VoWi';
  document.getElementsByClassName('details')[0].insertAdjacentElement('afterend', a);

  var ects = parseFloat(document.getElementsByClassName('ects')[0].textContent);
  var lecturers = [];
  $('.lecturers a').each(function(){
    lecturers.push('[[ufind.person:'+this.href.split('=')[1] +'|'+this.textContent+']]');
  });
  var block = document.createElement("pre");
  block.textContent = `{{LVA-Daten
| ects = `+ects+`;
| vortragende = `+lecturers.join(', ')+`
| abteilung =
| homepage =
| id = `+id+`
| wann =
| sprache =
| zuordnungen =
<!--
    {{Zuordnung|A033667|Modulname1}}
    {{Zuordnung|A066867|Modulname2|wahl=1}}
-->
}}`;
  a.insertAdjacentElement('afterend', block);
}, false);
