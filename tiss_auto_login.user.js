// ==UserScript==
// @name        TISS: Auto Login
// @namespace   https://vowi.fsinf.at/
// @include     https://tiss.tuwien.ac.at/*
// @grant       none
// @version     1.2
// @downloadURL https://github.com/fsinf/userscripts/raw/master/tiss_auto_login.user.js
// @updateURL   https://github.com/fsinf/userscripts/raw/master/tiss_auto_login.user.js
// ==/UserScript==

if (document.getElementsByClassName("loading").length > 0) {
  // Don't run the script on sites which only contain the loading animation.
  return;
}

login = document.querySelector(".toolLogin");
if (login != null) {
  login.click();
}
