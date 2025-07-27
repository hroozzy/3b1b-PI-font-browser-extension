// popup.js

const toggleSwitch = document.getElementById('toggle-switch');
const sizeInput = document.getElementById('size-input');

// 當 popup 打開時，讀取已儲存的設定並更新介面
document.addEventListener('DOMContentLoaded', () => {
  // chrome.storage.sync 會在所有登入同一個 Google 帳號的 Chrome 之間同步設定
  // 我們讀取 'piIsEnabled' 和 'piSize' 這兩個值
  // 如果是第一次使用，就給定預設值 (true 和 1.5)
  chrome.storage.sync.get({ piIsEnabled: true, piSize: 1.5 }, (settings) => {
    toggleSwitch.checked = settings.piIsEnabled;
    sizeInput.value = settings.piSize;
  });
});

// 當使用者點擊開關時，儲存新的狀態
toggleSwitch.addEventListener('change', () => {
  chrome.storage.sync.set({ piIsEnabled: toggleSwitch.checked });
});

// 當使用者更改數字時，儲存新的大小
sizeInput.addEventListener('input', () => {
  // parseFloat 將輸入框的文字轉為數字
  chrome.storage.sync.set({ piSize: parseFloat(sizeInput.value) || 1.5 });
});