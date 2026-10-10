# Vinsight リプレイス – デモ

Vinsight（モニター／アンケートサイト）のリプレイス・デモです。**データベースなし**・**ダミーデータ**で、モニターサイトと管理画面の全機能が動きます。
要求事項（`③Vinsight_要求事項（案）.xlsx` の全35行）をすべて実装しています。

## 起動

```bash
npm install      # 初回のみ（node_modules は同梱済み）
npm run dev      # http://localhost:3000
```

本番ビルド：`npm run build && npm start`

## デモ用ログイン

| 画面 | URL | ID | パスワード |
|---|---|---|---|
| モニター（マイページ） | `/`（ログイン） | `demo@vinsight.example`（または モニター番号 `1001`） | `monitor123` |
| 管理画面 | `/admin/login` | `admin` | `admin123` |

他のダミーモニター（1002〜）も同じパスワード `monitor123` です（例：`user1002@example.com`）。

## 構成

```
public/images/           クライアント提供のイラスト（トップのメインビジュアルに使用）
src/app/(site)/          モニターサイト：トップ・登録・マイページ・問い合わせ など
src/app/admin/           管理画面（A〜G ＋ 新設メニュー）
src/app/api/[...path]/   REST API（単一ハンドラ → src/server/dispatch.ts）
src/server/store.ts      インメモリのダミーデータ（サーバー再起動で初期化）
src/server/routes-*.ts   API ルート（site / admin）
src/server/validate.ts   入力規制（半角・全角など）
src/styles/site.css      モニターサイトのデザイン（ビザビ公式サイトに準拠）
src/styles/admin.css     管理画面のデザイン
```

- データはメモリ上にのみ保持されます。管理画面左下の「デモデータをリセット」で初期状態に戻せます。
- メールは**実際には送信されません**。送信内容は管理画面の「送信メール履歴」に記録されます。
- 管理画面の「**要求事項 対応状況**」で、35項目それぞれの実装箇所へ移動できます。

## デザインについて

`https://www.vis-a-vis.co.jp/` の公開CSS/HTMLの値を元にしています（フォント Jost + Noto Sans JP、ルート 10px、ヘッダー 77px・右端の黄色い CONTACT タブ、
ピル型ボタン、色 `#fcc800 / #ff8900 / #4d9df2 / #57ba87 / #c598e7 / #f4f2f2`、フッター `#f4f2f2`）。
トップのメインビジュアルは、同サイトの `top-mainv` と同じ 1315×722 のステージに、各イラストを同サイトの座標・幅・アニメーションで配置しています。

`public/images` に無いもの（star / tv / train / signage / plane、ロゴ、マーキー文字画像、フッターのキャッチ画像）は再現していません。
ロゴとキャッチコピーはテキストで代用しています。画像を追加いただければ差し替え可能です。
