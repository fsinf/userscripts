// ==UserScript==
// @name        Autologin for TU Wien SSO, TISS, TUWEL and OpenCast
// @namespace   https://vowi.fsinf.at/
// @include     https://tiss.tuwien.ac.at/*
// @include     https://tuwel.tuwien.ac.at/*
// @include     https://oc-presentation.ltcc.tuwien.ac.at/*
// @match       https://oase.it.tuwien.ac.at/AuthServ.authenticate
// @match       https://toss.fsinf.at/
// @grant       none
// @version     1.6
// @downloadURL https://fsinf.at/userscripts/tuwien-autologin.user.js
// @updateURL   https://fsinf.at/userscripts/tuwien-autologin.user.js
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
	case 'oase.it.tuwien.ac.at':
		if (document.querySelector('input[name="pw"]').value)
			document.querySelector('form[action="AuthServ.portal"]').submit()
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
		if (location.pathname == "/theme/university_boost/login/index.php") {
			document.querySelector("a[title='TU Wien Login']").click();
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
}
