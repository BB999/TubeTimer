// YouTube Time Limit - Background Service Worker

const DEFAULT_SETTINGS = {
  dailyLimitMinutes: 120,
  enabled: true
};

const DEFAULT_USAGE = {
  todayUsedSeconds: 0,
  lastResetDate: new Date().toISOString().split('T')[0]
};

// 初期化
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['settings', 'usage']);

  if (!data.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }

  if (!data.usage) {
    await chrome.storage.local.set({ usage: DEFAULT_USAGE });
  }

  // 日次リセット用アラームを設定
  setupDailyResetAlarm();
});

// Service Worker起動時にもアラームを確認
chrome.runtime.onStartup.addListener(() => {
  setupDailyResetAlarm();
  checkAndResetIfNewDay();
});

// 日次リセットアラームの設定
function setupDailyResetAlarm() {
  chrome.alarms.get('dailyReset', (alarm) => {
    if (!alarm) {
      // 次の0時を計算
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      chrome.alarms.create('dailyReset', {
        when: midnight.getTime(),
        periodInMinutes: 24 * 60 // 24時間ごと
      });
    }
  });
}

// アラームリスナー
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') {
    resetDailyUsage();
  }
});

// 日次使用量のリセット
async function resetDailyUsage() {
  const today = new Date().toISOString().split('T')[0];
  await chrome.storage.local.set({
    usage: {
      todayUsedSeconds: 0,
      lastResetDate: today
    }
  });
  console.log('Daily usage reset for', today);
}

// 新しい日かどうかをチェックしてリセット
async function checkAndResetIfNewDay() {
  const data = await chrome.storage.local.get(['usage']);
  const today = new Date().toISOString().split('T')[0];

  if (data.usage && data.usage.lastResetDate !== today) {
    await resetDailyUsage();
  }
}

// content.jsからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'tick') {
    handleTick(sendResponse);
    return true; // 非同期レスポンスを示す
  }

  if (message.type === 'getStatus') {
    getStatus(sendResponse);
    return true;
  }

  if (message.type === 'checkBlock') {
    checkIfBlocked(sendResponse);
    return true;
  }
});

// 1秒ごとのtickを処理
async function handleTick(sendResponse) {
  await checkAndResetIfNewDay();

  const data = await chrome.storage.local.get(['settings', 'usage']);
  const settings = data.settings || DEFAULT_SETTINGS;
  const usage = data.usage || DEFAULT_USAGE;

  if (!settings.enabled) {
    sendResponse({ blocked: false, remaining: Infinity });
    return;
  }

  // 使用時間を1秒追加
  usage.todayUsedSeconds += 1;
  await chrome.storage.local.set({ usage });

  const limitSeconds = settings.dailyLimitMinutes * 60;
  const remaining = limitSeconds - usage.todayUsedSeconds;

  if (remaining <= 0) {
    sendResponse({ blocked: true, remaining: 0 });
  } else {
    sendResponse({ blocked: false, remaining });
  }
}

// 現在のステータスを取得
async function getStatus(sendResponse) {
  await checkAndResetIfNewDay();

  const data = await chrome.storage.local.get(['settings', 'usage']);
  const settings = data.settings || DEFAULT_SETTINGS;
  const usage = data.usage || DEFAULT_USAGE;

  const limitSeconds = settings.dailyLimitMinutes * 60;
  const remaining = limitSeconds - usage.todayUsedSeconds;

  sendResponse({
    enabled: settings.enabled,
    dailyLimitMinutes: settings.dailyLimitMinutes,
    todayUsedSeconds: usage.todayUsedSeconds,
    remaining: Math.max(0, remaining),
    blocked: settings.enabled && remaining <= 0
  });
}

// ブロック状態をチェック
async function checkIfBlocked(sendResponse) {
  await checkAndResetIfNewDay();

  const data = await chrome.storage.local.get(['settings', 'usage']);
  const settings = data.settings || DEFAULT_SETTINGS;
  const usage = data.usage || DEFAULT_USAGE;

  if (!settings.enabled) {
    sendResponse({ blocked: false });
    return;
  }

  const limitSeconds = settings.dailyLimitMinutes * 60;
  const blocked = usage.todayUsedSeconds >= limitSeconds;

  sendResponse({ blocked });
}
