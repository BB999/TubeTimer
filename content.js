// YouTube Time Limit - Content Script

let tickInterval = null;
let contextInvalidated = false;

// Extension context invalidatedエラーをグローバルで捕捉
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('Extension context invalidated')) {
    event.preventDefault();
    contextInvalidated = true;
    stopTicking();
  }
});

// 拡張機能のコンテキストが有効かチェック
function isContextValid() {
  if (contextInvalidated) return false;
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime) return false;
    const id = chrome.runtime.id;
    return !!id;
  } catch (e) {
    contextInvalidated = true;
    return false;
  }
}

// ページ読み込み時にブロック状態をチェック
if (isContextValid()) {
  checkBlockStatus();
}

// 可視性の変更を監視（コンテキスト無効化チェック用）
document.addEventListener('visibilitychange', () => {
  if (!isContextValid()) {
    stopTicking();
  }
});

// 初期状態で計測開始
startTicking();

// 動画が再生中かどうかをチェック（ショート動画対応）
function isVideoPlaying() {
  const videos = document.querySelectorAll('video');
  if (videos.length === 0) return false;

  // どれか1つでも再生中ならtrue
  for (const video of videos) {
    if (!video.paused && !video.ended && video.readyState > 2) {
      return true;
    }
  }
  return false;
}

// ブロック状態をチェック
function checkBlockStatus() {
  if (!isContextValid()) return;

  try {
    chrome.runtime.sendMessage({ type: 'checkBlock' }, (response) => {
      try {
        if (!response || chrome.runtime.lastError) return;
        if (response.blocked) {
          redirectToBlocked();
        }
      } catch (e) {
        contextInvalidated = true;
      }
    });
  } catch (e) {
    contextInvalidated = true;
  }
}

// 計測開始
function startTicking() {
  if (tickInterval) return;
  if (!isContextValid()) return;

  tickInterval = setInterval(() => {
    try {
      if (!isContextValid()) {
        stopTicking();
        return;
      }
      if (!isVideoPlaying()) return; // 動画再生中のみカウント

      chrome.runtime.sendMessage({ type: 'tick' }, (response) => {
        try {
          if (!response || chrome.runtime.lastError) {
            stopTicking();
            return;
          }
          if (response.blocked) {
            stopTicking();
            redirectToBlocked();
          }
        } catch (e) {
          contextInvalidated = true;
          stopTicking();
        }
      });
    } catch (e) {
      contextInvalidated = true;
      stopTicking();
    }
  }, 1000);
}

// 計測停止
function stopTicking() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

// ブロックページへリダイレクト
function redirectToBlocked() {
  if (!isContextValid()) return;

  try {
    const blockedUrl = chrome.runtime.getURL('blocked/blocked.html');
    window.location.href = blockedUrl;
  } catch (e) {
    contextInvalidated = true;
  }
}

// ページアンロード時に計測停止
window.addEventListener('beforeunload', () => {
  stopTicking();
});
