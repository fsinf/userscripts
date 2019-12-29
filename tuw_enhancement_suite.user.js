// ==UserScript==
// @name        TUW Enhancement Suite
// @description Autologin for OpenCast and Single Sign-On.
// @namespace   https://fsinf.at/
// @match       https://oc-presentation.ltcc.tuwien.ac.at/*
// @match       https://oase.it.tuwien.ac.at/AuthServ.authenticate
// @match       https://toss.fsinf.at/
// @grant       none
// @version     1.02
// @downloadURL https://fsinf.at/tes.user.js
// @updateURL   https://fsinf.at/tes.user.js
// ==/UserScript==

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

if (location.host == 'oc-presentation.ltcc.tuwien.ac.at'){
	if (location.search == '?epFrom=d264f820-6d51-4cb1-a4f2-bb74e2094149&e=1&p=1' && localStorage.returnURL){
		let returnURL = localStorage.returnURL;
		localStorage.removeItem('returnURL');
		window.location	= returnURL;
	} else {
		openCastAutoLogin();
	}
} else if (location.host == 'oase.it.tuwien.ac.at'){
	if (document.querySelector('input[name="pw"]').value)
		document.querySelector('form[action="AuthServ.portal"]').submit()
} else if (location.host == 'toss.fsinf.at'){
	hasTES = true;
}
