// ==UserScript==
// @name        TUWEL+
// @namespace   https://fsinf.at/
// @match       https://tuwel.tuwien.ac.at/*
// @grant       none
// @version     1.4
// @icon        https://i.imgur.com/gJ9tqWL.png
// @description Various small improvements to TUWEL including LVA-abbreviations and "Select All" for Kreuzerl
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.slim.min.js
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

const DictLVA = { // keyword : abbreviation
  "Algebra und Diskrete Mathematik":    "ADM",
  "Grundzüge digitaler Systeme":        "GDS",
  "Angleichungskurs Mathematik":        "AKMath",
  "Einführung in die Programmierung 1": "EP1",
  "Einführung in die Programmierung 2": "EP2",
  "Denkweisen der Informatik":          "Denki",
  "Mathematisches Arbeiten":            "MathArb",
  "Orientierung Informatik":            "Ori",
  "Algorithmen und Datenstrukturen":    "AlgoDat",
}

const seperator = "<b> » </b>"


const courseTileSelector = 'a.coursename[href*="https://tuwel.tuwien.ac.at/course/view.php?id="] > span.multiline > span[aria-hidden="true"]';
const courseListSelector = 'a.coursename[href*="https://tuwel.tuwien.ac.at/course/view.php?id="]'
const mobileDrawerSelector = 'div.drawer a.list-group-item[href*="https://tuwel.tuwien.ac.at/course/view.php?id="]'
const courseTitleSelector = 'h1.h2.mb-0'
const courseDropdownMenuItemSelector = 'div.carousel-inner > a.dropdown-item[role="menuitem"][href*="https://tuwel.tuwien.ac.at/course/view.php?id="]';
const breadcrumbSelector = 'li.breadcrumb-item:first > a';


// prepend the LVA abbreviation for a selected element
function editGeneric (selector) {
  $(selector).each(function() {

    //get text of selected element, excluding it's decendents
    const fullName = $(this).clone().children().remove().end().text();

    if (fullName) {
      // if the LVA-name has a specified abbreviation in DictLVA, use it
      for (LVA in DictLVA) {
        if (fullName.includes(LVA)) {
          shortName = DictLVA[LVA];

          // set the new text in the menu item
          var newName = "<b class='shortLvaName'>"  + shortName + "</b>" + seperator + fullName;
          $(this).html(newName);
        }
      }
    }
  });
}



// edit the breadcrumb to contain a readable abbreviation of the LVA name
function editBreadcrumb(selector) {
  const fullName = $(selector).attr("title");

  if (fullName) {

    const match = fullName.match(/^([a-zA-Z]).{8}/);

    // set the shortName to a truncated version (…) of fullName for now
    if (match) {
      var shortName = match[0] + "…";
    }

    // if the LVA-name has a specified abbreviation in DictLVA, use it
    for (LVA in DictLVA) {
      if (fullName.includes(LVA)) {
          shortName = DictLVA[LVA];
      }
    }

    // set the new text in the breadcrumb (shortName + semester)
    var newName = "<b class='shortLvaName'>" + shortName + "</b>" + seperator + fullName.match(/.{5}$/)[0];
    $("li.breadcrumb-item:first > a").html(newName);
  }
}


// highlight quiz result

function highlightQuizResult() {
  gradeCell = "table.quizreviewsummary tr:includes('Bewertung') > td"

  if ($(gradeCell).text().includes("100%")) {
    $(gradeCell).css("background-color", "lightgreen");
  } else {
    $(gradeCell).css("background-color", "pink");
  }

}

function addtickAllKreuzerlButton() {
  $("#fgroup_id_buttonar > div > div > div").append('<input class="btn btn-secondary mr-1" id="select-all-button" type="button" value="Alle auswählen"">')
  document.querySelector("#select-all-button").addEventListener("click", tickAllKreuzerl);
  checkboxes = $("div.checkboxgroup1 input.checkboxgroup1");
}



function tickAllKreuzerl() {
  checkboxes.each(function() {
    (this).checked = true;
  })

  document.querySelector("#select-all-button").removeEventListener("click", tickAllKreuzerl);
  document.querySelector("#select-all-button").value = "Keine auswählen";
  document.querySelector("#select-all-button").addEventListener("click", untickAllKreuzerl);

}
function untickAllKreuzerl() {
  checkboxes.each(function() {
    (this).checked = false;
  })

  document.querySelector("#select-all-button").removeEventListener("click", untickAllKreuzerl);
  document.querySelector("#select-all-button").value = "Alle auswählen";
  document.querySelector("#select-all-button").addEventListener("click", tickAllKreuzerl);

}


function tickSubmissionStatement() {
  $("input#id_submissionstatement").prop('checked', true);
}

function smallerEditButton() {
  $("label[for$='-editingswitch']").replaceWith("<i class='icon fa fa-edit fa-fw'></i>");
}


function init() {
  const href = window.location.href;


  editGeneric(mobileDrawerSelector);

  editGeneric(courseDropdownMenuItemSelector);
  //set dropdown text to blue color to stand out more (OG TUWEL blue: #006699, no contrast on hover)
  $(courseDropdownMenuItemSelector + " b.shortLvaName").css("color", "#013d5b");

  editBreadcrumb(breadcrumbSelector);

  //if "my courses" page is open
  if (href.includes("/my")) {
    smallerEditButton();
    // wait for content to load on "my courses"
    setTimeout(() => { editGeneric(courseTileSelector) }, 1600);
    setTimeout(() => { editGeneric(courseListSelector) }, 1600);
  }

  //if course main page is open
  if (href.includes("/course/view.php?id=")) {
    editGeneric(courseTitleSelector);
  }

  if (href.includes("/mod/quiz/review.php")) {
    highlightQuizResult();
  }

  if (href.includes("/mod/checkmark")) {
    addtickAllKreuzerlButton();
  }

  if (href.includes("/mod/assign/view.php")) {
    tickSubmissionStatement();
  }

}



$(document).ready(function() {
  init();
});




