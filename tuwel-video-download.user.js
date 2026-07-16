// ==UserScript==
// @name        Tuwel Video Download
// @namespace   https://fsinf.at
// @match       https://tuwel.tuwien.ac.at/mod/opencast/view.php*
// @grant       GM_xmlhttpRequest
// @connect     tuwien.ac.at
// @connect     raw.githubusercontent.com
// @version     1.3
// @author      FSINF
// @description 3/14/2026, 5:18:42 PM
// @downloadURL https://fsinf.at/userscripts/tuwel-video-download.user.js
// @updateURL   https://fsinf.at/userscripts/tuwel-video-download.user.js
// ==/UserScript==

function parseEpisodeStreams() {
  const episode = unsafeWindow.episode;
  const streams =
    episode && Array.isArray(episode.streams) ? episode.streams : [];
  const parsed = [];

  // extract mp4 sources from streams
  streams.forEach((stream, streamIndex) => {
    const sources = stream && stream.sources ? stream.sources : {};
    const streamName =
      stream && stream.content ? stream.content : `stream ${streamIndex + 1}`;

    const mp4 = Array.isArray(sources.mp4) ? sources.mp4 : [];
    mp4.forEach((entry, entryIndex) => {
      if (entry && entry.src) {
        const w = entry.res && entry.res.w ? entry.res.w : "?";
        const h = entry.res && entry.res.h ? entry.res.h : "?";
        parsed.push({
          label: `${streamName} (${w}x${h})`,
          src: entry.src,
        });
      }
    });
  });

  // remove duplicates
  return parsed.filter(function (item, index) {
    return (
      parsed.findIndex(function (other) {
        return other.src === item.src;
      }) === index
    );
  });
}

function parseSubtitles() {
  const episode = unsafeWindow.episode;
  const captions = episode.captions;

  const parsed = [];

  captions.forEach((caption, captionIndex) => {
    parsed.push({
      label: `${caption.text} (${caption.lang})`,
      src: caption.url,
      lang: caption.lang,
    });
  });

  return parsed;
}

function filenameFromUrl(url, fallback) {
  const name = url.split("/").pop().split("?")[0];
  return name ? decodeURIComponent(name) : fallback;
}

function startBlobDownload(url, fallbackName, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "downloading...";
  const restoreButton = function () {
    button.disabled = false;
    button.textContent = originalText;
  };

  GM_xmlhttpRequest({
    method: "GET",
    url: url,
    responseType: "blob",
    onprogress: function (event) {
      if (event.lengthComputable && event.total > 0) {
        const percent = Math.round((event.loaded / event.total) * 100);
        button.textContent = `downloading... ${percent}%`;
      } else {
        const mb = (event.loaded / (1024 * 1024)).toFixed(1);
        button.textContent = `downloading... ${mb} MB`;
      }
    },
    onload: function (response) {
      saveBlob(response.response, filenameFromUrl(url, fallbackName));
      restoreButton();
    },
    onerror: function () {
      restoreButton();
      alert("Download failed");
    },
  });
}

function saveBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

function gmFetchBlob(url, onprogress) {
  return new Promise(function (resolve, reject) {
    GM_xmlhttpRequest({
      method: "GET",
      url: url,
      responseType: "blob",
      onprogress: onprogress,
      onload: function (response) {
        if (response.status >= 200 && response.status < 300) {
          resolve(response.response);
        } else {
          reject(new Error(`HTTP ${response.status} for ${url}`));
        }
      },
      onerror: function () {
        reject(new Error(`network error for ${url}`));
      },
    });
  });
}

const FFMPEG_BASE =
  "https://raw.githubusercontent.com/fsinf/userscripts/master/assets/ffmpeg";
const FFMPEG_URLS = {
  ffmpeg: `${FFMPEG_BASE}/ffmpeg.js`,
  classWorker: `${FFMPEG_BASE}/814.ffmpeg.js`,
  core: `${FFMPEG_BASE}/ffmpeg-core.js`,
  wasm: `${FFMPEG_BASE}/ffmpeg-core.wasm`,
};

let ffmpegInstance = null;

async function loadFFmpeg(onStatus) {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const loaded = {};
  const trackProgress = function (key) {
    return function (event) {
      loaded[key] = event.loaded;
      const totalMb =
        Object.values(loaded).reduce((a, b) => a + b, 0) / (1024 * 1024);
      onStatus(`loading ffmpeg... ${totalMb.toFixed(1)} MB`);
    };
  };

  const [ffmpegJs, classWorkerJs, coreJs, coreWasm] = await Promise.all([
    gmFetchBlob(FFMPEG_URLS.ffmpeg, trackProgress("ffmpeg")),
    gmFetchBlob(FFMPEG_URLS.classWorker, trackProgress("worker")),
    gmFetchBlob(FFMPEG_URLS.core, trackProgress("core")),
    gmFetchBlob(FFMPEG_URLS.wasm, trackProgress("wasm")),
  ]);

  // evaluate the UMD bundle through its CommonJS branch; assignments to the
  // sandbox global are unreliable across userscript managers/browsers
  const moduleShim = { exports: {} };
  new Function("module", "exports", await ffmpegJs.text())(
    moduleShim,
    moduleShim.exports,
  );
  const ffmpeg = new moduleShim.exports.FFmpeg();

  const asObjectUrl = function (blob, type) {
    return URL.createObjectURL(new Blob([blob], { type: type }));
  };
  await ffmpeg.load({
    classWorkerURL: asObjectUrl(classWorkerJs, "text/javascript"),
    coreURL: asObjectUrl(coreJs, "text/javascript"),
    wasmURL: asObjectUrl(coreWasm, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

// mp4 subtitle language tags use ISO 639-2
const ISO_639_2 = { de: "deu", en: "eng" };

async function startMergeDownload(videoUrl, subtitleUrl, subtitleLang, button) {
  const originalText = button.textContent;
  button.disabled = true;
  const setStatus = function (text) {
    button.textContent = text;
  };

  try {
    const ffmpeg = await loadFFmpeg(setStatus);

    setStatus("downloading subtitles...");
    const subtitleBlob = await gmFetchBlob(subtitleUrl);
    const videoBlob = await gmFetchBlob(videoUrl, function (event) {
      const mb = (event.loaded / (1024 * 1024)).toFixed(1);
      setStatus(`downloading video... ${mb} MB`);
    });

    setStatus("merging...");
    await ffmpeg.writeFile(
      "input.mp4",
      new Uint8Array(await videoBlob.arrayBuffer()),
    );
    await ffmpeg.writeFile(
      "subs.vtt",
      new Uint8Array(await subtitleBlob.arrayBuffer()),
    );

    const args = [
      "-i",
      "input.mp4",
      "-i",
      "subs.vtt",
      "-map",
      "0",
      "-map",
      "1",
      "-c",
      "copy",
      "-c:s",
      "mov_text",
      "-disposition:s:0",
      "default",
    ];
    const language = ISO_639_2[subtitleLang] || subtitleLang;
    if (language) {
      args.push("-metadata:s:s:0", `language=${language}`);
    }
    args.push("output.mp4");

    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) {
      throw new Error(`ffmpeg exited with code ${exitCode}`);
    }

    const output = await ffmpeg.readFile("output.mp4");
    for (const file of ["input.mp4", "subs.vtt", "output.mp4"]) {
      try {
        await ffmpeg.deleteFile(file);
      } catch (e) {}
    }

    const videoName = filenameFromUrl(videoUrl, "video.mp4");
    saveBlob(
      new Blob([output.buffer], { type: "video/mp4" }),
      videoName.replace(/\.mp4$/i, "") + "-subs.mp4",
    );
  } catch (e) {
    alert(`Merging failed: ${e && e.message ? e.message : e}`);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

let processingAccepted = false;

function showProcessingBanner(container, onAccept) {
  if (processingAccepted) {
    onAccept();
    return;
  }
  if (container.querySelector(".tuwel-dl-banner")) {
    return;
  }

  const banner = document.createElement("div");
  banner.className = "tuwel-dl-banner";

  const text = document.createElement("span");
  text.textContent =
    "This loads ffmpeg.wasm " +
    "and merges the video locally in your browser's memory. " +
    "Very large videos (around 1 GB and up) may fail.";

  const acceptButton = document.createElement("button");
  acceptButton.className = "tuwel-dl-button";
  acceptButton.type = "button";
  acceptButton.textContent = "Accept";
  acceptButton.addEventListener("click", function () {
    processingAccepted = true;
    banner.remove();
    onAccept();
  });

  const cancelButton = document.createElement("button");
  cancelButton.className = "tuwel-dl-button";
  cancelButton.type = "button";
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", function () {
    banner.remove();
  });

  banner.appendChild(text);
  banner.appendChild(acceptButton);
  banner.appendChild(cancelButton);
  container.appendChild(banner);
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .tuwel-dl-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tuwel-dl-select,
    .tuwel-dl-button {
      padding: 5px 10px;
      font-size: 14px;
      border: 1px solid #c7c7c7;
      border-radius: 6px;
      background: #fff;
    }
    .tuwel-dl-button {
      background: #f5f5f5;
      cursor: pointer;
    }
    .tuwel-dl-button:hover:not(:disabled) {
      background: #e9e9e9;
    }
    .tuwel-dl-button:disabled {
      opacity: 0.65;
      cursor: default;
    }
    .tuwel-dl-banner {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 12px;
      font-size: 14px;
      border: 1px solid #ffe08a;
      border-radius: 6px;
      background: #fff8e1;
      color: #664d03;
    }
  `;
  document.head.appendChild(style);
}

function injectDownloadButton() {
  let playerWrapper = document.querySelector(".player-wrapper");
  if (!playerWrapper) {
    // fallback for insertion of button
    playerWrapper = document.querySelector(".page-context-header");
    if (!playerWrapper) {
      return;
    }
  }

  const streams = parseEpisodeStreams();

  const subtitles = parseSubtitles();

  if (!streams.length && !subtitles.length) {
    return;
  }

  injectStyles();

  const container = document.createElement("div");
  container.style.marginBottom = "12px";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "8px";

  const videoRow = document.createElement("div");
  videoRow.className = "tuwel-dl-row";
  const subtitleRow = document.createElement("div");
  subtitleRow.className = "tuwel-dl-row";

  const videoSelect = document.createElement("select");
  videoSelect.className = "tuwel-dl-select";

  streams.forEach((stream) => {
    const option = document.createElement("option");
    option.value = stream.src;
    option.textContent = stream.label;
    videoSelect.appendChild(option);
  });

  const videoDLbutton = document.createElement("button");
  videoDLbutton.className = "tuwel-dl-button";
  videoDLbutton.textContent = "Download selected stream";
  videoDLbutton.type = "button";
  videoDLbutton.addEventListener("click", function () {
    const selectedOption = videoSelect.options[videoSelect.selectedIndex];
    if (!selectedOption) {
      return;
    }
    startBlobDownload(selectedOption.value, "video.mp4", videoDLbutton);
  });

  const subSelect = document.createElement("select");
  subSelect.className = "tuwel-dl-select";

  subtitles.forEach((caption) => {
    const option = document.createElement("option");
    option.value = caption.src;
    option.textContent = caption.label;
    option.dataset.lang = caption.lang || "";
    subSelect.appendChild(option);
  });

  const subtitleDLbutton = document.createElement("button");
  subtitleDLbutton.className = "tuwel-dl-button";
  subtitleDLbutton.textContent = "Download selected subtitles";
  subtitleDLbutton.type = "button";
  subtitleDLbutton.addEventListener("click", function () {
    const selectedOption = subSelect.options[subSelect.selectedIndex];
    if (!selectedOption) {
      return;
    }
    startBlobDownload(selectedOption.value, "subtitles.vtt", subtitleDLbutton);
  });

  videoRow.appendChild(videoSelect);
  videoRow.appendChild(videoDLbutton);
  subtitleRow.appendChild(subSelect);
  subtitleRow.appendChild(subtitleDLbutton);
  container.appendChild(videoRow);
  container.appendChild(subtitleRow);

  if (streams.length && subtitles.length) {
    const mergeRow = document.createElement("div");
    mergeRow.className = "tuwel-dl-row";

    const mergeButton = document.createElement("button");
    mergeButton.className = "tuwel-dl-button";
    mergeButton.textContent = "Download video with embedded subtitles";
    mergeButton.type = "button";
    mergeButton.addEventListener("click", function () {
      const videoOption = videoSelect.options[videoSelect.selectedIndex];
      const subtitleOption = subSelect.options[subSelect.selectedIndex];
      if (!videoOption || !subtitleOption) {
        return;
      }
      showProcessingBanner(container, function () {
        startMergeDownload(
          videoOption.value,
          subtitleOption.value,
          subtitleOption.dataset.lang,
          mergeButton,
        );
      });
    });

    mergeRow.appendChild(mergeButton);
    container.appendChild(mergeRow);
  }

  playerWrapper.parentNode.insertBefore(container, playerWrapper);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectDownloadButton);
} else {
  injectDownloadButton();
}
