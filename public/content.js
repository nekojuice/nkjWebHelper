// ## 分頁全域變數
let _enable = {};

let domLocatorEnable = false;
let domLocatorMode = "xPath";

let referenceElementXPath;
let targetElementXPath;

// ## 事件監聽
document.addEventListener("DOMContentLoaded", async () => {});

window.addEventListener("load", async () => {
  console.log("nkjWebHelper 擴充功能已啟用");

  _enable = (await getStorage("cache")) || _enable;

  if (_enable.domLocatorHotkey) {
    document.addEventListener("keydown", handleHotKeyEvent);
  }
  if (_enable.nkjythelper) {
    await delay(1000);
    initNkjythelper();
  }
  if (_enable.drawUrl) {
    initDrawUrlEventListener(250);
  }
});

function handleHotKeyEvent(event) {
  if (event.ctrlKey && event.key === "q") {
    updateDomLocatorStatus(!domLocatorEnable);
  }
}

// ## 元素定位器
function updateDomLocatorStatus(newEnable = null, newMode = null) {
  // mode
  if (newMode != null && domLocatorMode != newMode) {
    domLocatorMode = newMode;
    console.log(`模式切換: ${domLocatorMode}`);
  }

  // enable
  if (newEnable == null || domLocatorEnable == newEnable) {
    return;
  }
  domLocatorEnable = newEnable;

  if (domLocatorEnable) {
    document.addEventListener("click", domLocatorEvent, { capture: true });
    console.log(`dom定位器已啟用, 模式: ${domLocatorMode}, 點選目標將自動複製到剪貼簿`);
  } else {
    document.removeEventListener("click", domLocatorEvent, { capture: true });
    console.log(`dom定位器已停用`);
  }
}

function domLocatorEvent(event) {
  event.stopPropagation();
  event.preventDefault();

  if (domLocatorMode == "css") {
    const cssSelector = getCSS(event.target);
    console.log(cssSelector);
    navigator.clipboard.writeText(cssSelector);
  }
  if (domLocatorMode == "xPath") {
    const xpath = getXPath(event.target).toLowerCase();
    console.log("//" + xpath);
    navigator.clipboard.writeText("//" + xpath);
  }

  if (domLocatorMode == "relativexPath") {
    if (event.shiftKey && event.button === 0) {
      referenceElementXPath = getXPath(event.target).toLowerCase();
      console.log("參考元素:", `//${referenceElementXPath}`);
    } else if (event.button === 0) {
      targetElementXPath = getXPath(event.target).toLowerCase();
      console.log("目標元素:", `//${targetElementXPath}`);
    }

    if (referenceElementXPath && targetElementXPath) {
      const relativeTargetXPath = getRelativeXPath("//" + referenceElementXPath, "//" + targetElementXPath);
      console.log("已查詢相對元素", getElementByXPath(relativeTargetXPath));
      navigator.clipboard.writeText(relativeTargetXPath);
    }
  }

  //   const root = document.compatMode === "CSS1Compat" ? document.documentElement : document.body;
  //   const mxy = [event.clientX + root.scrollLeft, event.clientY + root.scrollTop];
  //   const txy = getPageXY(event.target);
  //   console.log("offset", mxy[0] - txy[0], mxy[1] - txy[1]);
}

// reference: https://stackoverflow.com/questions/2631820/how-do-i-ensure-saved-click-coordinates-can-be-reload-to-the-same-place-even-if/2631931#2631931

function getXPath(element) {
  //   if (element.id !== "") return 'id("' + element.id + '")';
  if (element === document.body) return element.tagName;

  var ix = 0;
  var siblings = element.parentNode.childNodes;
  for (var i = 0; i < siblings.length; i++) {
    var sibling = siblings[i];
    if (sibling === element) return getXPath(element.parentNode) + "/" + element.tagName + "[" + (ix + 1) + "]";
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
  }
}

function getPageXY(element) {
  var x = 0,
    y = 0;
  while (element) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  }
  return [x, y];
}

function getCSS(element, root = document.body) {
  if (element === root) return element.tagName.toLowerCase();

  const dynamicClasses = ["p-focus", "p-inputwrapper-filled", "p-inputwrapper-focus", "p-overlay-open", "p-highlight"];

  const filterClasses = (classList) => {
    return Array.from(classList).filter((className) => !dynamicClasses.some((dc) => className.startsWith(dc) || className === dc));
  };

  const escapeClassName = (className) => {
    return className.replace(/[:]/g, "\\$&");
  };

  const classes = filterClasses(element.classList);

  if (classes.length > 0) {
    const classSelector = "." + classes.map(escapeClassName).join(".");
    try {
      if (root.querySelectorAll(classSelector).length === 1) {
        return classSelector;
      }
    } catch (e) {
      console.warn("Invalid selector:", classSelector);
    }
  }

  const tagWithClass = element.tagName.toLowerCase() + (classes.length ? "." + classes.map(escapeClassName).join(".") : "");

  try {
    if (root.querySelectorAll(tagWithClass).length === 1) {
      return tagWithClass;
    }
  } catch (e) {
    console.warn("Invalid selector:", tagWithClass);
  }

  const siblings = Array.from(element.parentNode.children);
  const index = siblings.indexOf(element) + 1;
  const nthSelector = `${tagWithClass}:nth-child(${index})`;

  try {
    if (root.querySelectorAll(nthSelector).length === 1) {
      return nthSelector;
    }
  } catch (e) {
    console.warn("Invalid selector:", nthSelector);
  }

  return getCSS(element.parentNode, root) + " > " + nthSelector;
}

function getElementByXPath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

/**
 * 從參考點找到最近的符合目標的 XPath
 * @param {string} referenceXpath - 參考點的 XPath
 * @param {string} targetXpath - 目標的 XPath
 * @returns {string} - 相對於參考點的 XPath，或直接返回目標 XPath
 */
function getRelativeXPath(referenceXpath, targetXpath) {
  const referenceElement = getElementByXPath(referenceXpath);
  const targetElement = getElementByXPath(targetXpath);

  if (!referenceElement || !targetElement) {
    console.warn("無法找到參考點或目標元素");
    return targetXpath;
  }

  if (targetElement.tagName === "INPUT") {
    return `${referenceXpath}/following::input[1]`;
  } else if (targetElement.tagName === "TEXTAREA") {
    return `${referenceXpath}/following::textarea[1]`;
  }

  return targetXpath;
}

// ## nkjythelper
async function initNkjythelper() {
  if (window.location.href == "https://www.youtube.com/") {
    await monitorElementChanges("#contents", await getTargetElements(), labelstyle, 2000);
  }

  async function monitorElementChanges(parentSelector, childElements, callback, bufferTime = 2000) {
    const parentElement = document.querySelector(parentSelector);
    if (!parentElement) return;

    let timeoutId;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const handleChanges = async () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        await delay(bufferTime);

        for (const child of childElements) await callback(await child);
      }, 0);
    };

    new MutationObserver(handleChanges).observe(parentElement, { childList: true, subtree: true });
  }

  async function getTargetElements() {
    //const targetsByClassName = Array.from(
    //  document.querySelectorAll('.style-scope.ytd-video-display-full-buttoned-and-button-group-renderer.yt-simple-endpoint')
    //).map((el) => getParentAtLevel(el, 9));

    const targetsByTagName = Array.from(document.querySelectorAll("ytd-ad-slot-renderer")).map((el) => getParentAtLevel(el, 2));

    //return [...new Set([...targetsByClassName, ...targetsByTagName])].filter(Boolean);
    return [...new Set([...targetsByTagName])].filter(Boolean);
  }

  async function getParentAtLevel(element, level) {
    let current = element;
    let count = 0;
    while (current && count < level) {
      current = current.parentElement;
      count++;
    }
    return current;
  }

  async function labelstyle(element) {
    element.style.backgroundColor = "red";
    element.style.display = "none";
  }
}

// ## drawUrl
async function initDrawUrlEventListener(longPressDelay = 1000) {
  let mouseDownTimer = null;
  let isLongPress = false;
  let overlay = null;

  // 儲存事件處理函數的參考
  const eventHandlers = {
    mousedown: null,
    mouseup: null,
    contextmenu: null,
    mouseout: null
  };

  // 滑鼠右鍵按下事件
  eventHandlers.mousedown = async (e) => {
    if (e.button === 2) {
      isLongPress = false;
      mouseDownTimer = setTimeout(async () => {
        isLongPress = true;
        await showOverlay();
      }, longPressDelay);
    }
  };

  // 顯示遮罩動畫
  async function showOverlay() {
    if (!overlay) {
      createOverlay();
    }
    await delay(50);
    requestAnimationFrame(() => {
      overlay.style.backgroundColor = "rgba(128, 128, 128, 0.5)";
    });
  }

  // 建立遮罩元素
  function createOverlay() {
    overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(128, 128, 128, 0)";
    overlay.style.transition = "all 500ms ease";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "9999";
    document.body.appendChild(overlay);
    overlay.getBoundingClientRect();
  }

  // 滑鼠右鍵放開事件
  eventHandlers.mouseup = (e) => {
    if (e.button === 2) {
      clearTimeout(mouseDownTimer);
      if (isLongPress) {
        removeOverlay();
      }
    }
  };

  // 移除遮罩
  function removeOverlay() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  // 滑鼠移出視窗時清除計時器和遮罩
  eventHandlers.mouseout = (e) => {
    if (e.relatedTarget === null) {
      clearTimeout(mouseDownTimer);
      if (isLongPress) {
        removeOverlay();
        isLongPress = false;
      }
    }
  };

  // 防止顯示預設的右鍵選單
  eventHandlers.contextmenu = (e) => {
    if (isLongPress) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // 綁定所有事件
  document.addEventListener("mousedown", eventHandlers.mousedown);
  document.addEventListener("mouseup", eventHandlers.mouseup);
  document.addEventListener("contextmenu", eventHandlers.contextmenu);
  document.addEventListener("mouseout", eventHandlers.mouseout);

  // 回傳移除事件的方法
  return function removeDrawUrlEventListener() {
    // 清除所有相關狀態
    clearTimeout(mouseDownTimer);
    removeOverlay();
    isLongPress = false;

    // 移除所有事件監聽器
    document.removeEventListener("mousedown", eventHandlers.mousedown);
    document.removeEventListener("mouseup", eventHandlers.mouseup);
    document.removeEventListener("contextmenu", eventHandlers.contextmenu);
    document.removeEventListener("mouseout", eventHandlers.mouseout);

    // 清空事件處理函數
    Object.keys(eventHandlers).forEach((key) => {
      eventHandlers[key] = null;
    });
  };
}

// ## 公用方法
async function getStorage(key) {
  const response = await chrome.runtime.sendMessage({ action: "getStorage", key: key });
  return response.message;
}

async function delay(ms) {
  new Promise((resolve) => setTimeout(resolve, ms));
}

// ## tab message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // DOM locator
  if (request.action === "updateDomLocatorStatus") {
    updateDomLocatorStatus(request.data.domLocatorEnable, request.data.domLocatorMode);
    sendResponse({ status: "success" });
  }

  if (request.action == "getDomLocatorStatus") {
    sendResponse({ status: "success", message: { domLocatorEnable: domLocatorEnable, domLocatorMode: domLocatorMode } });
  }

  // init nkjythelper
  if (request.action === "initNkjythelper") {
    initNkjythelper();
    sendResponse({ status: "success" });
  }
});
