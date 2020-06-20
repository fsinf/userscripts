// ==UserScript==
// @name        TUWEL: Make profile links relative to course
// @namespace   https://fsinf.at/
// @match       https://tuwel.tuwien.ac.at/mod/forum/discuss.php
// @grant       none
// @version     1.1
// ==/UserScript==

var courseId = document.querySelector(".forumsearch form > input").value
var profileLinks = document.querySelectorAll("address a").forEach(function(profileLink) {
    profileLink.href += "&course=" + courseId;
});
