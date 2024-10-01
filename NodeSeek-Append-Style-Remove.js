// ==UserScript==
// @name         NodeSeek 附加样式移除
// @namespace    https://www.nodeseek.com/
// @version      0.0.1
// @description  去除 NodeSeek 的附加样式
// @author       TomyJan
// @match        *://www.nodeseek.com/*
// @icon         https://www.nodeseek.com/static/image/favicon/android-chrome-192x192.png
// @grant        none
// @run-at       document-start
// @license      MPL-2.0 License
// @supportURL   https://www.nodeseek.com/post-unk-1
// @homepageURL  https://www.nodeseek.com/post-unk-1
// @downloadURL https://update.greasyfork.org/scripts/unk.user.js
// @updateURL https://update.greasyfork.org/scripts/unk.meta.js
// ==/UserScript==

(function() {
    'use strict';

    var links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(function(link) {
        if (link.href.includes('/systemstyle/append.css')) {
            link.parentNode.removeChild(link);
        }
    });
})();
