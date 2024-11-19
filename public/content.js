document.addEventListener('DOMContentLoaded', () => {
  // 監聽網頁事件
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'autologin') {
    // 執行內容
    console.log(request.data.account);
    console.log(request.data.pass);

    sendResponse({ status: 'success' });
  }
});
