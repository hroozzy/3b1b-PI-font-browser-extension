// content.js (最終修正版 - 完美處理非同步與回饋循環)

// 這是「工人」函式，只負責單純的替換工作
function performReplacement(size) {
  const targetChar = 'π';
  const imageUrl = chrome.runtime.getURL('images/happy.svg');

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const nodesToProcess = [];
  let node;
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) continue;
    if (node.nodeValue.includes(targetChar)) {
      nodesToProcess.push(node);
    }
  }

  for (const textNode of nodesToProcess) {
    if (!textNode.parentElement) continue;
    const fragment = document.createDocumentFragment();
    const parts = textNode.nodeValue.split(targetChar);

    parts.forEach((part, index) => {
      fragment.appendChild(document.createTextNode(part));
      if (index < parts.length - 1) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.height = `${size}em`;
        img.style.width = `${size}em`;
        img.style.verticalAlign = `-${size * 0.2}em`;
        img.style.margin = '0 0.1em';
        fragment.appendChild(img);
      }
    });
    textNode.parentElement.replaceChild(fragment, textNode);
  }
}


// 這是「管理員」函式，它將被 MutationObserver 呼叫
// 它的職責是管理開關狀態和設定
const observerCallback = () => {
  // --- 最關鍵的修正 ---
  // 1. 立刻停止觀察，這是第一要務，必須是同步操作
  observer.disconnect();

  // 2. 現在可以安全地執行非同步操作了
  chrome.storage.sync.get({ piIsEnabled: true, piSize: 1.5 }, (settings) => {
    // 3. 根據設定決定是否要執行替換
    if (settings.piIsEnabled) {
      performReplacement(settings.piSize);
    }

    // 4. 無論是否執行了替換，工作都完成了，重新開啟觀察
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
};


// 建立我們的觀察者，並告訴它使用「管理員」函式作為回呼
const observer = new MutationObserver(observerCallback);

// 程式的初始啟動點
// 為了確保在網頁一載入、使用者設定改變時都能即時反應，
// 我們在這裡也需要讀取設定
chrome.storage.sync.get({ piIsEnabled: true, piSize: 1.5 }, (settings) => {
    if (settings.piIsEnabled) {
        // 如果功能是開啟的，就先執行一次
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => performReplacement(settings.piSize));
        } else {
            performReplacement(settings.piSize);
        }
    }
    // 不論功能是否開啟，都要開始觀察，以便使用者在 Popup 中打開開關時能立即生效
    observer.observe(document.body, { childList: true, subtree: true });
});

// 增加一個監聽器，當使用者在 popup 中修改設定時，可以立即反應在頁面上
chrome.storage.onChanged.addListener((changes, namespace) => {
    // 重新整理頁面來套用新的設定，這是最簡單可靠的方法
    // (更複雜的方法是寫一個 "undo" 函式，但重新整理更直觀)
    window.location.reload();
});