// YouTube Time Limit - Content Script

let tickInterval = null;
let isPageVisible = true;

// ページ読み込み時にブロック状態をチェック
checkBlockStatus();

// 可視性の変更を監視
document.addEventListener('visibilitychange', () => {
  isPageVisible = !document.hidden;

  if (isPageVisible) {
    startTicking();
  } else {
    stopTicking();
  }
});

// 初期状態でページが可視なら計測開始
if (!document.hidden) {
  startTicking();
}

// 動画が再生中かどうかをチェック
function isVideoPlaying() {
  const video = document.querySelector('video');
  if (!video) return false;
  return !video.paused && !video.ended && video.readyState > 2;
}

// ブロック状態をチェック
function checkBlockStatus() {
  chrome.runtime.sendMessage({ type: 'checkBlock' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error checking block status:', chrome.runtime.lastError);
      return;
    }

    if (response && response.blocked) {
      redirectToBlocked();
    }
  });
}

// 計測開始
function startTicking() {
  if (tickInterval) return;

  tickInterval = setInterval(() => {
    if (!isPageVisible) return;
    if (!isVideoPlaying()) return; // 動画再生中のみカウント

    chrome.runtime.sendMessage({ type: 'tick' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending tick:', chrome.runtime.lastError);
        return;
      }

      if (response && response.blocked) {
        stopTicking();
        redirectToBlocked();
      }
    });
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
  const blockedUrl = chrome.runtime.getURL('blocked/blocked.html');
  window.location.href = blockedUrl;
}

// ページアンロード時に計測停止
window.addEventListener('beforeunload', () => {
  stopTicking();
});
