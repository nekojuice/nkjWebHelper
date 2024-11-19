// 分頁全域變數
let domLocatorEnable = false;
let domLocatorMode = "xPath";

let referenceElementXPath;
let targetElementXPath;

// 事件監聽
document.addEventListener("DOMContentLoaded", () => {});

window.addEventListener("load", function () {
  console.log("nkjWebHelper 擴充功能已啟用");
  document.addEventListener("keydown", handleHotKeyEvent);
});

function handleHotKeyEvent(event) {
  if (event.ctrlKey && event.key === "q") {
    updateDomLocatorStatus(!domLocatorEnable);
  }
}

const updateDomLocatorStatus = (newEnable = null, newMode = null) => {
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
};

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

// tab message
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // DOM locator
  if (request.action === "updateDomLocatorStatus") {
    updateDomLocatorStatus(request.data.domLocatorEnable, request.data.domLocatorMode);
    sendResponse({ status: "success" });
  }

  if (request.action == "getDomLocatorStatus") {
    sendResponse({ status: "success", message: { domLocatorEnable: domLocatorEnable, domLocatorMode: domLocatorMode } });
  }
});
