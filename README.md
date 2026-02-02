# TubeTimer - Chrome拡張機能

YouTubeの1日の使用時間を制限するChrome拡張機能

**Created by noranekob**

## 機能

- 1日の使用時間上限を設定可能（デフォルト: 2時間/日）
- 使用時間をリアルタイムで計測・表示
- 上限に達したらYouTubeをブロック
- 毎日0時に使用時間をリセット
- ポップアップで簡易設定・残り時間確認
- オプションページで詳細設定・統計表示
- 日本語/英語の言語切り替え対応（デフォルト: 英語）
- Ko-fi寄付リンク

## ファイル構成

```
time-block/
├── manifest.json          # 拡張機能の設定（Manifest V3）
├── background.js          # Service Worker（時間管理、アラーム）
├── content.js             # YouTubeページでの時間計測
├── popup/
│   ├── popup.html         # ポップアップUI
│   ├── popup.js           # ポップアップロジック
│   └── popup.css          # ポップアップスタイル
├── options/
│   ├── options.html       # オプションページUI
│   ├── options.js         # オプションページロジック（言語切り替え）
│   └── options.css        # オプションページスタイル
├── blocked/
│   ├── blocked.html       # ブロック時に表示するページ
│   └── blocked.css        # ブロックページスタイル
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── generate-icons.html # アイコン生成ツール
└── README.md              # このファイル
```

## 技術設計

### manifest.json
- Manifest V3形式
- permissions: `storage`, `alarms`, `tabs`
- host_permissions: `*://*.youtube.com/*`
- content_scripts: YouTubeで自動実行
- service_worker: background.js

### background.js (Service Worker)
- 時間計測の中央管理
- 日次リセット用アラーム（毎日0時）
- タブ監視（YouTubeタブのアクティブ状態）
- ブロック判定とリダイレクト

### content.js
- YouTubeページがアクティブな間、1秒ごとに経過時間を送信
- ページ離脱時に計測停止
- ブロック状態のチェックとリダイレクト

### ストレージ構造
```javascript
{
  settings: {
    dailyLimitMinutes: 120,    // 1日の上限（分）
    enabled: true              // 有効/無効
  },
  usage: {
    todayUsedSeconds: 0,       // 今日の使用秒数
    lastResetDate: "2026-02-02" // 最終リセット日
  },
  language: "en"               // 言語設定（en/ja）デフォルト: en
}
```

## UI設計

### ポップアップ
- ヘッダー: タイトル「TubeTimer by noranekob」+ 有効/無効トグル
- 残り時間の表示（プログレスバー付き）
- 使用時間/上限時間の表示
- 上限時間のクイック変更（+/- ボタン）
  - 無効時はボタンもグレーアウト
- Ko-fi寄付ボタン + メッセージ
- 詳細設定ボタン

### オプションページ（詳細設定）
- 基本設定
  - 言語切り替え（セグメントコントロール: JP/EN）
- 今日の統計（使用時間、残り時間、上限時間、使用率）
- データ管理（今日のリセット、全設定初期化）
- 開発サポート（Ko-fi寄付ボタン）
- フッター: バージョン + Created by noranekob

### 多言語対応
- 英語（デフォルト）
- 日本語
- オプションページのセグメントコントロールで切り替え
- 設定はストレージに保存され、全ページで共有

## インストール方法

1. `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `time-block` フォルダを選択

## 検証方法

1. YouTubeを開き、時間計測が動作することを確認
2. ポップアップで残り時間が表示されることを確認
3. トグルをオフにすると設定ボタンが無効になることを確認
4. 上限時間を短く設定し、ブロックが機能することを確認
5. ブラウザを再起動しても設定と使用時間が保持されることを確認
6. 詳細設定ページで言語切り替え（JP/EN）が動作することを確認
7. 言語設定がポップアップにも反映されることを確認

## 収益化

### Ko-fi寄付リンク
- ポップアップとオプションページにKo-fi公式ボタンを設置
- URL: https://ko-fi.com/noranekob

## 今後の拡張案

- 週間/月間の統計表示
- 複数サイト対応（Twitter, Redditなど）
- カスタムブロックページ
- 通知機能（残り10分で警告など）
- エクスポート/インポート機能

## バージョン履歴

### v1.0.0
- 初回リリース
- 基本的な時間制限機能
- 日本語/英語対応（デフォルト: 英語）
- Ko-fi寄付リンク
- Created by noranekob クレジット追加
