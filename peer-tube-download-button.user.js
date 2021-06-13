// ==UserScript==
// @name         TUWpeerTube_DownloadButton
// @namespace    https://vowi.fsinf.at/
// @version      1.0
// @description  Adds a download button for the videos in "https://tube1.it.tuwien.ac.at/videos/watch"
// @author       Fabian Scherer
// @match        https://tube1.it.tuwien.ac.at/videos/watch/*
// @icon         https://tube1.it.tuwien.ac.at/client/assets/images/favicon.png
// @grant        GM_openInTab
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// @downloadURL  https://fsinf.at/userscripts/peer-tube-download-button.user.js
// @updateURL    https://fsinf.at/userscripts/peer-tube-download-button.user.js
// ==/UserScript==





//====================================================
// MIT Licensed
// Author: jwilson8767

/**
 * Waits for an element satisfying selector to exist, then resolves promise with the element.
 * Useful for resolving race conditions.
 *
 * @param selector
 * @returns {Promise}
 */
function elementReady(selector) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) {resolve(el);}
    new MutationObserver((mutationRecords, observer) => {
      // Query for elements matching the specified selector
      Array.from(document.querySelectorAll(selector)).forEach((element) => {
        resolve(element);
        //Once we have resolved we don't need the observer anymore.
        observer.disconnect();
      });
    })
      .observe(document.documentElement, {
        childList: true,
        subtree: true
      });
  });
}
//=====================================================

function fs_download_url(id){return "https://tube1.it.tuwien.ac.at/download/videos/" + id + "-720.mp4"}

function fs_do_the_download(){
    var id = window.location.href.split("/").pop()
    var download_url = fs_download_url(id)
    GM_openInTab(download_url)
}

(function() {
    'use strict';

    $(function() {
        elementReady(".video-actions").then(() => {
            $(".video-actions").append('<div id="fs_download" class="action-button action-button-like" placement="bottom auto" role="button" aria-pressed="false">*download*</div>');
            $("#fs_download").click(fs_do_the_download);
        })
    });
})();

