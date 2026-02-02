// YouTube Time Limit - Popup Script

const elements = {
  container: null,
  enableToggle: null,
  remainingTime: null,
  progressBar: null,
  usedTime: null,
  limitTime: null,
  limitValue: null,
  decreaseLimit: null,
  increaseLimit: null,
  openOptions: null
};

let currentSettings = null;
let updateInterval = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  loadStatus();
  setupEventListeners();

  // 1秒ごとに更新
  updateInterval = setInterval(loadStatus, 1000);
});

// 要素の取得
function initElements() {
  elements.container = document.querySelector('.container');
  elements.enableToggle = document.getElementById('enableToggle');
  elements.remainingTime = document.getElementById('remainingTime');
  elements.progressBar = document.getElementById('progressBar');
  elements.usedTime = document.getElementById('usedTime');
  elements.limitTime = document.getElementById('limitTime');
  elements.limitValue = document.getElementById('limitValue');
  elements.decreaseLimit = document.getElementById('decreaseLimit');
  elements.increaseLimit = document.getElementById('increaseLimit');
  elements.openOptions = document.getElementById('openOptions');
}

// ステータスを読み込み
async function loadStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'getStatus' });

    if (response) {
      currentSettings = response;
      updateUI(response);
    }
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

// UIを更新
function updateUI(status) {
  // 有効/無効トグル
  elements.enableToggle.checked = status.enabled;
  elements.container.classList.toggle('disabled', !status.enabled);

  // 上限時間
  elements.limitValue.textContent = status.dailyLimitMinutes;
  elements.limitTime.textContent = `上限: ${formatMinutes(status.dailyLimitMinutes)}`;

  // 使用時間
  const usedMinutes = Math.floor(status.todayUsedSeconds / 60);
  elements.usedTime.textContent = `使用: ${formatMinutes(usedMinutes)}`;

  // 残り時間
  if (status.enabled) {
    elements.remainingTime.textContent = formatSeconds(status.remaining);

    // 残り時間に応じたスタイル
    const percentage = (status.todayUsedSeconds / (status.dailyLimitMinutes * 60)) * 100;
    elements.progressBar.style.width = `${Math.min(100, percentage)}%`;

    elements.remainingTime.classList.remove('warning', 'danger');
    elements.progressBar.classList.remove('warning', 'safe');

    if (status.remaining <= 0) {
      elements.remainingTime.classList.add('danger');
    } else if (status.remaining <= 600) { // 10分以下
      elements.remainingTime.classList.add('warning');
      elements.progressBar.classList.add('warning');
    } else {
      elements.progressBar.classList.add('safe');
    }
  } else {
    elements.remainingTime.textContent = '--:--:--';
    elements.progressBar.style.width = '0%';
  }
}

// 秒をHH:MM:SS形式に変換
function formatSeconds(seconds) {
  if (seconds <= 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

// 分をHH:MM形式に変換
function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}時間${mins}分`;
  }
  return `${mins}分`;
}

// ゼロ埋め
function pad(num) {
  return num.toString().padStart(2, '0');
}

// イベントリスナーの設定
function setupEventListeners() {
  // 有効/無効トグル
  elements.enableToggle.addEventListener('change', async () => {
    await updateSettings({ enabled: elements.enableToggle.checked });
  });

  // 上限時間の減少
  elements.decreaseLimit.addEventListener('click', async () => {
    if (currentSettings && currentSettings.dailyLimitMinutes > 10) {
      const newLimit = currentSettings.dailyLimitMinutes - 10;
      await updateSettings({ dailyLimitMinutes: newLimit });
    }
  });

  // 上限時間の増加
  elements.increaseLimit.addEventListener('click', async () => {
    if (currentSettings && currentSettings.dailyLimitMinutes < 480) {
      const newLimit = currentSettings.dailyLimitMinutes + 10;
      await updateSettings({ dailyLimitMinutes: newLimit });
    }
  });

  // オプションページを開く
  elements.openOptions.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

// 設定を更新
async function updateSettings(changes) {
  const data = await chrome.storage.local.get(['settings']);
  const settings = data.settings || {};

  const newSettings = { ...settings, ...changes };
  await chrome.storage.local.set({ settings: newSettings });

  loadStatus();
}

// ポップアップを閉じる時にインターバルをクリア
window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
