// ==UserScript==
// @name        TISS/TUWEL: Auto Login
// @namespace   https://vowi.fsinf.at/
// @include     https://tiss.tuwien.ac.at/*
// @include     https://tuwel.tuwien.ac.at/theme/university_boost/login/index.php
// @grant       none
// @version     1.3
// @downloadURL https://github.com/fsinf/userscripts/raw/master/tiss_auto_login.user.js
// @updateURL   https://github.com/fsinf/userscripts/raw/master/tiss_auto_login.user.js
// ==/UserScript==

if (location.host == "tiss.tuwien.ac.at") {
  if (document.getElementsByClassName("loading").length > 0) {
    // Don't run the script on sites which only contain the loading animation.
    return;
  }

  login = document.querySelector(".toolLogin");
  if (login != null) {
    login.click();
  }
} else if (location.host == "tuwel.tuwien.ac.at") { // TUWEL
  document.querySelector("a[title='TU Wien Login'] button").click();
}
