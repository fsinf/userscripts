// ==UserScript==
// @name        TUWEL: Show group members
// @namespace   https://fsinf.at/
// @downloadURL https://fsinf.at/userscripts/tuwel-group-member-list.user.js
// @updateURL   https://fsinf.at/userscripts/tuwel-group-member-list.user.js
// @version     1
// @grant       none
// @include     https://tuwel.tuwien.ac.at/mod/grouptool/view.php*
// ==/UserScript==

var textBreadcrumb = document.getElementsByClassName('breadcrumb')[0].innerHTML;
var courseId = textBreadcrumb.match('id\=([0-9]+)')[1]

var groupContainers = document.body.getElementsByClassName('showmembers');

for (var i = 0; i < groupContainers.length; i++) {
	var groupContainer = groupContainers[i];
	var showMemberLink = groupContainer.firstElementChild
	var groupData = showMemberLink.getAttribute('data-absregs');
	var groupObj = JSON.parse(groupData);

	var listNode = document.createElement('ul');
	for (var y = 0; y < groupObj.length; y++) {
		var listItemNode = document.createElement('li');
		var memberObj = groupObj[y];
		const a = document.createElement('a');
		a.href = 'https://tuwel.tuwien.ac.at/user/view.php?course=' +  courseId + '&id=' + memberObj.id;
		a.target = '_blank';
		a.textContent = memberObj.fullname;
		listItemNode.appendChild(a);
		listNode.appendChild(listItemNode);
	}

	groupContainer.appendChild(listNode);
}
