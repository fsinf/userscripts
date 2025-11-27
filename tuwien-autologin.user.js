// ==UserScript==
// @name        Autologin for TU Wien SSO, TISS, TUWEL and OpenCast
// @namespace   https://vowi.fsinf.at/
// @include     https://tiss.tuwien.ac.at/*
// @include     https://tuwel.tuwien.ac.at/*
// @include     https://oc-presentation.ltcc.tuwien.ac.at/*
// @match       https://idp.zid.tuwien.ac.at/simplesaml/module.php/core/loginuserpass*
// @match       https://toss.fsinf.at/
// @match       https://memory.iguw.tuwien.ac.at/login
// @grant       none
// @version     1.8
// @downloadURL https://fsinf.at/userscripts/tuwien-autologin.user.js
// @updateURL   https://fsinf.at/userscripts/tuwien-autologin.user.js
// @description Note: you need to have password auto fill-in enabled in your browser
// ==/UserScript==

function tuwelRefreshSession() {
  setTimeout(function() {
    fetch("https://tuwel.tuwien.ac.at/my/", {method: "HEAD"});
    tuwelRefreshSession();
  }, 15*60*1000);
}

async function openCastAutoLogin(){
	let response = await fetch('/info/me.json');
	if (response.ok){
		let info = await response.json();
		if (info.user.username == 'anonymous'){
			localStorage.returnURL = location.toString();
			window.location = 'https://tuwel.tuwien.ac.at/mod/lti/launch.php?id=385097';
		}
	}
}

switch(location.host){
	case 'idp.zid.tuwien.ac.at':
    setTimeout(function() {
      if (document.querySelector('input[name="password"]').value) {
   			document.querySelector('input[name="password"]').form.submit()
      } else {
        console.warn("Autologin-Script: PW field is empty. Is auto-fill enabled in browser?");
      }
    }, 500);

    break;


	case 'tiss.tuwien.ac.at':
		if (document.getElementsByClassName("loading").length > 0) {
			// Don't run the script on sites which only contain the loading animation.
			return;
		}

		login = document.querySelector(".toolLogin");
		if (login != null) {
			login.click();
		}
		break;

	case 'tuwel.tuwien.ac.at':
		if (location.pathname == "/login/index.php") {
      document.querySelectorAll('a').forEach(a => {
        if (a.textContent.trim() === 'TU Wien Login') {
          a.click();
        }
      });

		} else {
			tuwelRefreshSession();
		}
		break;

	case 'oc-presentation.ltcc.tuwien.ac.at':
		if (location.search == '?epFrom=d264f820-6d51-4cb1-a4f2-bb74e2094149&e=1&p=1' && localStorage.returnURL){
			let returnURL = localStorage.returnURL;
			localStorage.removeItem('returnURL');
			window.location	= returnURL;
		} else {
			openCastAutoLogin();
		}
		break;

	case 'toss.fsinf.at':
		hasTES = true;
		break;

	// Denki Schlüsselbegriff-Quiz
	case 'memory.iguw.tuwien.ac.at':
	if (location.pathname == "/login") {
		setTimeout(function() {
			document.querySelectorAll('button').forEach(button => {
				if (button.textContent.trim() === 'Mit TU Wien SSO anmelden') {
					button.click();
				}
			});
		}, 1000);
	}
	break;
  }
