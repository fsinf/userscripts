// ==UserScript==
// @name        TISS/TUWEL: Auto Login
// @namespace   https://vowi.fsinf.at/
// @include     https://tiss.tuwien.ac.at/*
// @include     https://tuwel.tuwien.ac.at/*
// @grant       none
// @version     1.4
// @downloadURL https://github.com/fsinf/userscripts/raw/master/tiss_auto_login.user.js
// @updateURL   https://github.com/fsinf/userscripts/raw/master/tiss_auto_login.user.js
// ==/UserScript==

function tuwelRefreshSession() {
  setTimeout(function() {
    fetch("https://tuwel.tuwien.ac.at/my/", {method: "HEAD"});
    tuwelRefreshSession();
  }, 15*60*1000);
}

if (location.host == "tiss.tuwien.ac.at") {
  // TISS

  if (document.getElementsByClassName("loading").length > 0) {
    // Don't run the script on sites which only contain the loading animation.
    return;
  }

  login = document.querySelector(".toolLogin");
  if (login != null) {
    login.click();
  }
} else if (location.host == "tuwel.tuwien.ac.at") {
  // TUWEL

  if (location.pathname == "/theme/university_boost/login/index.php") {
    document.querySelector("a[title='TU Wien Login'] button").click();
  } else {
    tuwelRefreshSession();
  }
}
