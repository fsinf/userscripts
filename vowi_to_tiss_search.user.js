// ==UserScript==
// @name TISS Search in VoWi
// @namespace https://vowi.fsinf.at/
// @match https://vowi.fsinf.at/wiki/*
// @match https://tiss.tuwien.ac.at/course/courseList.xhtml*
// @description Does not work with Greasemonkey because of https://github.com/greasemonkey/greasemonkey/issues/2700
// @version 1.0
// ==/UserScript==

if (location.host == 'vowi.fsinf.at') {
	if (document.getElementById('lva-daten') != null) {
		var content = document.getElementById('mw-content-text');
		var a = document.createElement('a');
		a.setAttribute('target', '_blank');
		a.innerHTML = 'TISS Suche';
		content.insertBefore(a, content.firstChild);
		var heading = document.getElementById('firstHeading').innerHTML;
		var title = encodeURIComponent(heading.substring(heading.indexOf(':') + 1, heading.indexOf('(') - 4));
		var type = encodeURIComponent(heading.substr(heading.indexOf('(') - 3, 2));
		a.href = 'https://tiss.tuwien.ac.at/course/courseList.xhtml?title=' + title + '&type=' + type;
	}
} else if (location.host == 'tiss.tuwien.ac.at') {
	var params = new URL(location).searchParams;
	if (params.get('title')) {
		jsf.ajax.addOnEvent(function (data) {
			if (data.status == 'success') {
				document.getElementById('courseList:courseTitleInp').value = params.get('title')
				document.getElementById('courseList:courseType').value = params.get('type')
				document.getElementById('courseList:semFrom').value = '2015W'
				document.getElementById('courseList:cSearchBtn').click()
			}
		})
		document.getElementById('courseList:quickSearchPanel').children[0].lastElementChild.click()
	} else {
		var titleInput = document.getElementById('courseList:courseTitleInp');
		if (titleInput) {
			document.getElementById('courseList:courseLecturer').focus()
			window.find(titleInput.value);
		}
	}
}
