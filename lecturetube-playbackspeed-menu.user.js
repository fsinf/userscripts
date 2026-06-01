// ==UserScript==
// @name         TUWEL LectureTube Speed Controls
// @match        https://tuwel.tuwien.ac.at/mod/opencast/view.php*
// @namespace    https://fsinf.at/
// @version      2.3
// @description  add custom replay speed controls, replacing the default ones, adds screenshot buttons
// @author       Blacklist
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  function run() {
    function getCurrentFrameBlob() {
      return new Promise((resolve, reject) => {
        try {
          const video = iframeDoc.querySelector("video");

          if (!video) {
            reject(new Error("No video found"));
            return;
          }

          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0);

          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error("Failed to create image"));
              return;
            }
            resolve(blob);
          }, "image/png");
        }
        catch (err) {
          reject(err);
        }
      });
    }

    async function saveScreenshot() {
      try {
        const blob = await getCurrentFrameBlob();

        const a = document.createElement("a");
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-");

        a.href = URL.createObjectURL(blob);
        a.download = `lecture-screenshot-${timestamp}.png`;
        a.click();

        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
      catch (err) {
        console.error(err);
        alert("Screenshot failed (possibly CORS protected).");
      }
    }

    async function copyScreenshot() {
      try {
        const blob = await getCurrentFrameBlob();

        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob
          })
        ]);

        console.log("Screenshot copied to clipboard");
      }
      catch (err) {
        console.error(err);
        alert("Copy failed (clipboard or CORS restriction).");
      }
    }
    function addScreenshotButtons() {
      if (iframeDoc.getElementById("blacklist-screenshot-save")) {
        return;
      }

      const speedButton =
        iframeDoc.querySelector(
          'button[name="es.upv.paella.playbackRateButton"]'
        );

      if (!speedButton) {
        return;
      }

      const speedContainer =
        speedButton.closest(".button-plugin-container");

      if (!speedContainer) {
        return;
      }

      function createButton(id, text, title, handler) {
        const container = iframeDoc.createElement("div");
        container.className = "button-plugin-container";

        container.innerHTML = `
      <div class="button-plugin-side-area left-side"></div>
      <button
        type="button"
        id="${id}"
        class="button-plugin dynamic-width no-icon"
        title="${title}">
        <div class="interactive-button-content">
          <span class="button-title button-title-large">${text}</span>
        </div>
      </button>
      <div class="button-plugin-side-area right-side"></div>
    `;

        container
          .querySelector("button")
          .addEventListener("click", handler);

        return container;
      }

      const copyBtn = createButton(
        "blacklist-screenshot-copy",
        "📋",
        "Copy frame to clipboard",
        copyScreenshot
      );

      const saveBtn = createButton(
        "blacklist-screenshot-save",
        "💾",
        "Save frame as PNG",
        saveScreenshot
      );

      speedContainer.after(saveBtn);
      speedContainer.after(copyBtn);
    }

    function showAutoAlert() {
      const div = document.createElement("div");
      div.style.cssText = "position:fixed;top:40px;right:40px;z-index:999999;background:rgba(0,0,0,0.85);color:#fff;padding:14px 18px;border-radius:10px;font-size:14px;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.35);transition:opacity 0.3s;min-width:180px;";
      const title = document.createElement("div");
      title.innerText = "TUWEL Speed Menu v2.3";
      title.style.cssText = "font-weight:600;margin-bottom:4px;";
      const sub = document.createElement("div");
      sub.innerText = "by Blacklist";
      sub.style.cssText = "font-size:11px;opacity:0.7;text-align:right;";
      div.appendChild(title);
      div.appendChild(sub);
      document.body.appendChild(div);
      setTimeout(() => {
        div.style.opacity = "0";
        setTimeout(() => div.remove(), 300);
      }, 5000);
    }

    function updateCookieSpeed(speedValue) {
      const cookieName = "preferences|{}";
      const match = document.cookie.match(new RegExp("(^| )" + cookieName.replace(/[|{} ]/g, "\\$&") + "=([^;]+)"));
      if (match) {
        try {
          const data = JSON.parse(decodeURIComponent(match[2]));
          if (data.global) data.global.playbackRate = speedValue;
          document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=31536000; Secure; SameSite=Lax`;
        } catch (e) {
          console.error(e);
        }
      }
    }

    const playerIframe =
      document.getElementById("player-iframe") ||
      document.querySelector(".mod-opencast-paella-player") ||
      window.parent?.document?.getElementById("player-iframe") ||
      window.parent?.document?.querySelector(".mod-opencast-paella-player");

    if (!playerIframe) return false;

    const iframeDoc = playerIframe.contentDocument || playerIframe.contentWindow?.document;
    if (!iframeDoc || !iframeDoc.body) return false;

    const speedOptions = ["0.75x", "1x", "1.5x", "2x", "2.5x", "3x", "5x"];
    let lastClickedButton = null;

    iframeDoc.addEventListener("click", (e) => {
      const btn = e.target.closest("button[name]");
      if (btn) lastClickedButton = btn;
    }, true);

    function customizeMenu(popupContent) {
      if (!lastClickedButton || lastClickedButton.getAttribute("name") !== "es.upv.paella.playbackRateButton") return;
      const menuButtonContent = popupContent.querySelector(".menu-button-content");
      if (!menuButtonContent || menuButtonContent.dataset.customized === "true") return;
      const menuItems = menuButtonContent.querySelectorAll(".menu-button-item");
      if (menuItems.length === 0) return;

      menuButtonContent.dataset.customized = "true";

      const templateItem = menuItems[0];
      const currentSpeed = iframeDoc.querySelector("video")?.playbackRate || 1;
      const fragment = iframeDoc.createDocumentFragment();

      speedOptions.forEach(speedText => {
        const newItem = templateItem.cloneNode(true);
        const itemButton = newItem.querySelector(".menu-item-type-button");
        const itemTitle = newItem.querySelector(".menu-title");
        const speedValue = parseFloat(speedText);
        if (itemTitle) itemTitle.innerText = speedText;
        if (itemButton) {
          itemButton.setAttribute("aria-label", speedText);
          itemButton.setAttribute("title", speedText);
          itemButton.dataset.speed = speedValue;
          itemButton.classList.toggle("selected", speedValue === currentSpeed);
        }
        fragment.appendChild(newItem);
      });

      menuButtonContent.addEventListener("click", (e) => {
        const btn = e.target.closest(".menu-item-type-button[data-speed]");
        if (!btn) return;
        e.preventDefault();

        const speedValue = parseFloat(btn.dataset.speed);

        iframeDoc.querySelectorAll("video").forEach(v => { v.playbackRate = speedValue });
        updateCookieSpeed(speedValue);

        const buttonTitle = lastClickedButton.querySelector(".button-title");
        if (buttonTitle) buttonTitle.innerText = speedValue + "x";

        // close menu after selecting preset speed
        setTimeout(() => lastClickedButton.click(), 0);
      });

      const customLi = iframeDoc.createElement("li");
      customLi.className = "menu-button-item";
      customLi.style.cssText = "padding:10px 14px;border-top:1px solid rgba(255,255,255,0.15);display:flex;justify-content:center;";

      const customInput = iframeDoc.createElement("input");
      customInput.type = "number";
      customInput.placeholder = "custom speed";
      customInput.step = "0.1";
      customInput.min = "0.1";
      customInput.max = "16";
      customInput.style.cssText = "width:90%;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:13px;font-family:inherit;border-radius:6px;padding:6px 10px;text-align:center;outline:none;";

      customInput.addEventListener("click", e => e.stopPropagation());

      customInput.addEventListener("input", () => {
        if (parseFloat(customInput.value) > 16) customInput.value = "16";
      });

      customInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          let speedValue = parseFloat(customInput.value);
          if (!isNaN(speedValue) && speedValue > 0) {
            speedValue = Math.min(speedValue, 16);

            iframeDoc.querySelectorAll("video").forEach(v => { v.playbackRate = speedValue });
            updateCookieSpeed(speedValue);

            const buttonTitle = lastClickedButton.querySelector(".button-title");
            if (buttonTitle) buttonTitle.innerText = speedValue + "x";

            menuButtonContent.querySelectorAll(".menu-item-type-button").forEach(b => b.classList.remove("selected"));

            // already closes menu
            setTimeout(() => lastClickedButton.click(), 0);
          }
        }
      });

      customLi.appendChild(customInput);
      fragment.appendChild(customLi);

      menuButtonContent.innerHTML = "";
      menuButtonContent.appendChild(fragment);

      setTimeout(() => customInput.focus(), 50);
    }

    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            const popup = node.matches(".popup-content.fixed") ? node : node.querySelector(".popup-content.fixed");
            if (popup) {
              setTimeout(() => customizeMenu(popup), 20);
              return;
            }
          }
        }
      }
    });

    observer.observe(iframeDoc.body, { childList: true, subtree: true });

    addScreenshotButtons();

    const controlBarObserver = new MutationObserver(() => {
      addScreenshotButtons();
    });

    controlBarObserver.observe(iframeDoc.body, {
      childList: true,
      subtree: true
    });

    showAutoAlert();
    return true;
  }

  const interval = setInterval(() => {
    if (run()) clearInterval(interval);
  }, 500);

})();