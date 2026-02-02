// YouTube Time Limit - Options Script

// 翻訳データ
const i18n = {
  ja: {
    title: 'YouTube Time Limit 設定',
    basicSettings: '基本設定',
    enableLimit: '時間制限を有効にする',
    enableLimitDesc: 'オフにするとYouTubeの使用時間を制限しません',
    dailyLimit: '1日の上限時間',
    dailyLimitDesc: 'YouTubeを使用できる1日あたりの最大時間',
    hours: '時間',
    minutes: '分',
    todayStats: '今日の統計',
    usedTime: '使用時間',
    remainingTime: '残り時間',
    limitTime: '上限時間',
    usageRate: '使用率',
    dataManagement: 'データ管理',
    resetToday: '今日の使用時間をリセット',
    resetTodayDesc: '今日の使用時間を0にリセットします',
    resetBtn: 'リセット',
    resetAll: 'すべての設定を初期化',
    resetAllDesc: '設定と使用データをすべて削除します',
    initBtn: '初期化',
    support: '開発をサポート',
    supportText: 'この拡張機能が役に立ったら、開発者にコーヒーをおごってください',
    confirmResetToday: '今日の使用時間をリセットしますか？',
    confirmResetAll: 'すべての設定を初期化しますか？この操作は取り消せません。'
  },
  en: {
    title: 'YouTube Time Limit Settings',
    basicSettings: 'Basic Settings',
    enableLimit: 'Enable time limit',
    enableLimitDesc: 'Turn off to disable YouTube time restriction',
    dailyLimit: 'Daily time limit',
    dailyLimitDesc: 'Maximum time you can use YouTube per day',
    hours: 'hours',
    minutes: 'min',
    todayStats: "Today's Statistics",
    usedTime: 'Used',
    remainingTime: 'Remaining',
    limitTime: 'Limit',
    usageRate: 'Usage',
    dataManagement: 'Data Management',
    resetToday: "Reset today's usage",
    resetTodayDesc: "Reset today's usage time to 0",
    resetBtn: 'Reset',
    resetAll: 'Reset all settings',
    resetAllDesc: 'Delete all settings and usage data',
    initBtn: 'Initialize',
    support: 'Support Development',
    supportText: 'If you like this extension, buy the developer a coffee!',
    confirmResetToday: "Reset today's usage time?",
    confirmResetAll: 'Reset all settings? This cannot be undone.'
  }
};

let currentLang = 'ja';

const DEFAULT_SETTINGS = {
  dailyLimitMinutes: 120,
  enabled: true
};

let updateInterval = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadLanguage();
  loadSettings();
  loadStats();
  setupEventListeners();

  // 1秒ごとに統計を更新
  updateInterval = setInterval(loadStats, 1000);
});

// 言語設定を読み込み
async function loadLanguage() {
  const data = await chrome.storage.local.get(['language']);
  currentLang = data.language || 'ja';
  applyTranslations();
}

// 翻訳を適用
function applyTranslations() {
  const t = i18n[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });
}

// 設定を読み込み
async function loadSettings() {
  const data = await chrome.storage.local.get(['settings']);
  const settings = data.settings || DEFAULT_SETTINGS;

  document.getElementById('enableToggle').checked = settings.enabled;

  const hours = Math.floor(settings.dailyLimitMinutes / 60);
  const minutes = settings.dailyLimitMinutes % 60;

  document.getElementById('limitHours').value = hours;
  document.getElementById('limitMinutes').value = minutes;
}

// 統計を読み込み
async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'getStatus' });

    if (response) {
      updateStats(response);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// 統計UIを更新
function updateStats(status) {
  const limitSeconds = status.dailyLimitMinutes * 60;
  const usedSeconds = status.todayUsedSeconds;
  const remainingSeconds = Math.max(0, limitSeconds - usedSeconds);
  const percentage = Math.min(100, (usedSeconds / limitSeconds) * 100);

  document.getElementById('todayUsed').textContent = formatTime(usedSeconds);
  document.getElementById('todayRemaining').textContent = formatTime(remainingSeconds);
  document.getElementById('todayLimit').textContent = formatTime(limitSeconds);
  document.getElementById('todayPercentage').textContent = `${Math.round(percentage)}%`;

  const progressBar = document.getElementById('statsProgressBar');
  progressBar.style.width = `${percentage}%`;

  progressBar.classList.remove('warning', 'danger');
  if (percentage >= 100) {
    progressBar.classList.add('danger');
  } else if (percentage >= 75) {
    progressBar.classList.add('warning');
  }
}

// 秒をH:MM:SS形式に変換
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${hours}:${pad(minutes)}:${pad(secs)}`;
}

// ゼロ埋め
function pad(num) {
  return num.toString().padStart(2, '0');
}

// イベントリスナーの設定
function setupEventListeners() {
  // 有効/無効トグル
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    await saveSettings({ enabled: e.target.checked });
  });

  // 時間設定
  document.getElementById('limitHours').addEventListener('change', saveTimeLimit);
  document.getElementById('limitMinutes').addEventListener('change', saveTimeLimit);

  // 今日の使用時間をリセット
  document.getElementById('resetToday').addEventListener('click', async () => {
    const t = i18n[currentLang];
    if (confirm(t.confirmResetToday)) {
      const today = new Date().toISOString().split('T')[0];
      await chrome.storage.local.set({
        usage: {
          todayUsedSeconds: 0,
          lastResetDate: today
        }
      });
      loadStats();
    }
  });

  // すべての設定を初期化
  document.getElementById('resetAllBtn').addEventListener('click', async () => {
    const t = i18n[currentLang];
    if (confirm(t.confirmResetAll)) {
      const currentLanguage = currentLang;
      await chrome.storage.local.clear();
      await chrome.storage.local.set({
        settings: DEFAULT_SETTINGS,
        language: currentLanguage,
        usage: {
          todayUsedSeconds: 0,
          lastResetDate: new Date().toISOString().split('T')[0]
        }
      });
      loadSettings();
      loadStats();
    }
  });
}

// 時間制限を保存
async function saveTimeLimit() {
  const hours = parseInt(document.getElementById('limitHours').value) || 0;
  const minutes = parseInt(document.getElementById('limitMinutes').value) || 0;

  const totalMinutes = Math.max(1, Math.min(720, hours * 60 + minutes)); // 1分〜12時間

  await saveSettings({ dailyLimitMinutes: totalMinutes });
}

// 設定を保存
async function saveSettings(changes) {
  const data = await chrome.storage.local.get(['settings']);
  const settings = data.settings || DEFAULT_SETTINGS;

  const newSettings = { ...settings, ...changes };
  await chrome.storage.local.set({ settings: newSettings });

  loadStats();
}

// ページを閉じる時にインターバルをクリア
window.addEventListener('unload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
