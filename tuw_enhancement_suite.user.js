// ==UserScript==
// @name        TUW Enhancement Suite
// @description Autologin for TISS and OpenCast.
// @namespace   https://fsinf.at/
// @match       https://tiss.tuwien.ac.at/*
// @match       https://oc-presentation.ltcc.tuwien.ac.at/*
// @grant       none
// @version     1.00
// @downloadURL https://fsinf.at/tes
// @updateURL   https://fsinf.at/tes
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
} else if (location.host == 'tiss.tuwien.ac.at'){
	if (document.title != 'Loading...'){
		let login = document.querySelector('.toolLogin');
		if (login)
			login.click();
	}
}
