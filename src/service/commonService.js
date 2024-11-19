class CommonService {
  /**
   * 檢查當前tab為不可插件互動的頁面
   * @param {string} tabsUrl 當前路由
   * @returns
   */
  isValidPage = (tabsUrl) => {
    const urlFilter = ["chrome://", "chrome-extension://", "edge://", "about:blank"];
    if (!tabsUrl || urlFilter.some((x) => tabsUrl.startsWith(x))) {
      return false;
    }

    return true;
  };

  /**
   * 深拷貝
   * @param {*} targetObject
   * @returns
   */
  deepCopy(targetObject) {
    return JSON.parse(JSON.stringify(targetObject));
  }

  /**
   * 與當前tab (content.js) 通訊
   * @param {string} action 通訊名稱
   * @param {*} data 傳遞的資料
   * @returns
   */
  sendTabMessage = async (action, data = null) => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!isValidPage(tabs[0].url)) {
      return null;
    }

    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: action,
      data: data
    });

    return response;
  };

  /**
   * 儲存物件至localStorage
   * @param {object} obj 物件的根屬性將會是查詢、刪除的key
   */
  setStorage = async (obj) => {
    const response = await chrome.runtime.sendMessage({ action: "setStorage", obj: obj });
    console.log(response.message);
  };

  /**
   * 查詢物件
   * @param {string} key 物件key
   * @returns {*} 字串或物件
   */
  getStorage = async (key) => {
    const response = await chrome.runtime.sendMessage({ action: "getStorage", key: key });
    return response.message;
  };

  /**
   * 刪除物件
   * @param {string[]} keys 物件key陣列
   */
  deleteStorage = async (keys) => {
    const response = await chrome.runtime.sendMessage({ action: "deleteStorage", keys: keys });
    console.log(response.message);
  };

  /**
   *
   * @param {number} ms setTimeout延遲毫秒, 整數
   * @returns
   */
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
}

const commonService = new CommonService();
const isValidPage = commonService.isValidPage;
const deepCopy = commonService.deepCopy;
const sendTabMessage = commonService.sendTabMessage;
const setStorage = commonService.setStorage;
const getStorage = commonService.getStorage;
const deleteStorage = commonService.deleteStorage;
const delay = commonService.delay;

export default new CommonService();

export { isValidPage, deepCopy, sendTabMessage, setStorage, getStorage, deleteStorage, delay };
