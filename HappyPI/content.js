// content.js (v5 - SPA 兼容版)

// --- 輔助函式與核心替換邏輯 (保持不變) ---
function isInsideEditableElement(node) {
  let element = node.parentElement;
  while (element) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable) {
      return true;
    }
    element = element.parentElement;
  }
  return false;
}

function performReplacement(rootNode, size) {
  const targetChar = 'π';
  const imageUrl = chrome.runtime.getURL('images/happy.svg');
  const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);
  const nodesToProcess = [];
  let node;
  while (node = walker.nextNode()) {
    if (isInsideEditableElement(node)) continue;
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
        img.alt = 'π';
        img.style.height = `${size}em`;
        img.style.width = `${size}em`;
        img.style.verticalAlign = `-${size * 0.2}em`;
        img.style.margin = '0 0.1em';
        fragment.appendChild(img);
      }
    });
    textNode.parentElement.replaceChild(fragment, textNode);
  }
  const allElements = rootNode.querySelectorAll ? rootNode.querySelectorAll('*') : [];
  for (const element of allElements) {
    if (element.shadowRoot) {
      performReplacement(element.shadowRoot, size);
    }
  }
}

// --- 效能優化的觀察者 (核心修正點) ---
let debounceTimer;

const observerCallback = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    observer.disconnect();

    chrome.storage.sync.get({ piIsEnabled: true, piSize: 1.5 }, (settings) => {
      if (settings.piIsEnabled) {
        // ================== 【核心修正】 ==================
        // 不再使用有風險的「針對性更新」，而是回歸到掃描整個 body。
        // 因為有 Debouncing，這在效能上仍然是可接受的，且可靠性大大提高。
        performReplacement(document.body, settings.piSize);
        // ===============================================
      }
      startObserver();
    });
  }, 200);
};

const observer = new MutationObserver(observerCallback);

function startObserver() {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// --- 程式啟動點 (保持不變) ---
chrome.storage.sync.get({ piIsEnabled: true, piSize: 1.5 }, (settings) => {
  if (settings.piIsEnabled) {
    const initialRun = () => performReplacement(document.body, settings.piSize);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialRun);
    } else {
      initialRun();
    }
  }
  startObserver();
});

chrome.storage.onChanged.addListener(() => {
  window.location.reload();
});