"use client";
import Link from "next/link";
import { useState } from "react";
import { AdminPage } from "@/components/admin";

type R = { no: string; area: string; item: string; pri: string; type: string; status: string; how: string; href?: string; hrefLabel?: string };

// 要求事項（案）Rev.1（2026/09/19・佐藤）の全35行と、このデモでの実装箇所
const REQS: R[] = [
  { no: "1", area: "ログイン画面", item: "問合せフォーム（非モニター用）", pri: "◎", type: "追加", status: "確定", how: "ログイン画面の下部と /contact に非モニター（一般）用フォームを新設。画像認証付き。受信は管理画面「お問い合わせ」。", href: "/#contact", hrefLabel: "ログイン画面" },
  { no: "2", area: "マイページTOP", item: "ID／モニター番号の表記統一", pri: "◎", type: "統一", status: "確定", how: "すべての画面・メール・CSVで「モニター番号」に統一。", href: "/mypage", hrefLabel: "マイページ" },
  { no: "3", area: "マイページTOP", item: "問合せフォーム（モニター用）", pri: "◎", type: "変更", status: "確定", how: "マイページ内にモニター専用フォーム。モニター番号・氏名・連絡先を表示し、問い合わせと一緒に送信（非モニター用と別フォーム）。", href: "/mypage/contact", hrefLabel: "モニター用フォーム" },
  { no: "4", area: "マイページTOP", item: "SNS連携かんたんログイン", pri: "◎", type: "削除（非表示）", status: "確定", how: "Facebook／Twitter連携ブロックを実装せず（削除）。" },
  { no: "5", area: "マイページTOP", item: "アンケート種類の表示", pri: "△", type: "確認", status: "要検討", how: "「事前アンケート」「本アンケート」など種類ごとに開閉セクションで表示分け（採用案）。", href: "/mypage", hrefLabel: "マイページ" },
  { no: "6", area: "マイページTOP", item: "ポイント有効期限", pri: "○", type: "追加（必要か？）", status: "要検討", how: "設定でON/OFF（G-1：獲得日から○か月・0＝なし）。サイドパネルと一覧に失効予定を表示。古いポイントから消費。", href: "/admin/settings", hrefLabel: "G-1 設定" },
  { no: "7", area: "マイページTOP", item: "ログイン情報（最終ログイン）", pri: "△", type: "追加（必要か？）", status: "要検討", how: "サイドパネルに前回ログイン日時を表示。管理画面にも最終ログインを表示。", href: "/mypage", hrefLabel: "マイページ" },
  { no: "8", area: "ポイント交換申込", item: "ポイント交換のプルダウン方式", pri: "◎", type: "変更", status: "確定", how: "商品ごとの口数をプルダウン（0口〜残高上限）で選択。合計ポイントを自動計算。確認画面→申込み。", href: "/mypage/trade", hrefLabel: "ポイント交換" },
  { no: "9-1", area: "アンケート管理", item: "検索：フリーワード（部分一致）", pri: "○", type: "追加", status: "要検討", how: "タイトル・クライアント名・種別・ID・状態を対象に部分一致で検索（対象項目は暫定）。", href: "/admin/surveys", hrefLabel: "A-1" },
  { no: "9-2", area: "アンケート管理", item: "検索：配信条件（詳細）・付与ポイント数（詳細）", pri: "△", type: "追加（必要か？）", status: "要検討", how: "「詳細検索」で配信条件の要約テキストと付与ポイント範囲を検索（配信条件は要約文を保持して実現）。", href: "/admin/surveys", hrefLabel: "A-1" },
  { no: "10", area: "アンケート管理", item: "一覧の並べ替え", pri: "×", type: "無し", status: "対応不要", how: "現行機能を維持（状態・ID・ポイント・タイトル・設問数・回答数・回答率・配信開始日）。", href: "/admin/surveys", hrefLabel: "A-1" },
  { no: "11", area: "アンケート管理", item: "コピー（複製）", pri: "◎", type: "追加", status: "確定", how: "一覧・詳細に「コピー」。設問ごと複製し、配信待ちの新規アンケートを作成。", href: "/admin/surveys", hrefLabel: "A-1" },
  { no: "12", area: "アンケート管理", item: "テスト配信（管理者メールのみ）", pri: "◎", type: "追加", status: "確定", how: "「テスト配信」は設定の管理者メールアドレスにのみ送信（送信先は変更不可）。内容は送信メール履歴で確認。", href: "/admin/mail-log", hrefLabel: "送信メール履歴" },
  { no: "13", area: "アンケート管理", item: "CSV出力", pri: "×", type: "無し", status: "対応不要", how: "追加のCSV出力は作らず、現行の回答データCSV（5種類）のみ維持。" },
  { no: "14", area: "新着情報管理", item: "個別配信", pri: "◎", type: "追加", status: "確定", how: "新着情報にモニター番号を指定して個別配信。有効期限が近いモニターの自動入力も可能。個別配信分は「あなたへのご案内」として表示。", href: "/admin/news/new", hrefLabel: "B-1-1" },
  { no: "15", area: "新着情報管理", item: "メール同時配信", pri: "◎", type: "追加", status: "確定", how: "公開時に「メールも同時配信」を選択可能。配信件数を記録。", href: "/admin/news/new", hrefLabel: "B-1-1" },
  { no: "16", area: "申請一覧", item: "検索条件に「交換商品」", pri: "○", type: "追加（必要か？）", status: "要検討", how: "検索条件に交換商品のプルダウンを追加。", href: "/admin/trades", hrefLabel: "C-1" },
  { no: "17", area: "申請一覧", item: "一覧に交換商品を表示", pri: "○", type: "追加", status: "確定", how: "一覧に「交換商品」列（口数付き）を表示。", href: "/admin/trades", hrefLabel: "C-1" },
  { no: "18", area: "申請一覧", item: "「発送済」後もモニター情報を保持", pri: "◎", type: "変更", status: "確定", how: "発送済みにしても申請者情報（氏名・住所等）を削除せず、一覧・詳細に表示し続ける。", href: "/admin/trades", hrefLabel: "C-1" },
  { no: "19", area: "申請一覧", item: "並べ替え（既定：申請日の降順）", pri: "◎", type: "追加", status: "確定", how: "見出しクリックで昇順／降順。既定は申請日の降順。", href: "/admin/trades", hrefLabel: "C-1" },
  { no: "20", area: "申請一覧", item: "CSV出力", pri: "△", type: "追加（必要か？）", status: "要検討", how: "任意機能として実装（絞り込み結果をCSV出力）。不要であれば非表示にできます。", href: "/admin/trades", hrefLabel: "C-1" },
  { no: "33", area: "ポイント付与（新設）", item: "ポイント付与（手動）", pri: "◎", type: "追加", status: "確定", how: "管理画面でモニター番号（複数可）・ポイント・理由・有効期限を指定して付与。メール通知は任意。監査ログに記録。", href: "/admin/points/grant", hrefLabel: "ポイント付与" },
  { no: "34", area: "ポイント付与一覧（新設）", item: "ポイント付与一覧", pri: "◎", type: "追加", status: "確定", how: "手動付与・アンケート回答の付与履歴を検索・並べ替え付きで一覧表示。", href: "/admin/points", hrefLabel: "ポイント付与一覧" },
  { no: "21", area: "モニター管理", item: "検索条件：氏名・電話番号・メールアドレス（部分一致）", pri: "◎", type: "追加", status: "要検討", how: "3項目を部分一致で検索（電話はハイフン有無を問わない）。", href: "/admin/monitors", hrefLabel: "D-1" },
  { no: "22", area: "モニター管理", item: "一覧に検索項目を表示", pri: "◎", type: "追加", status: "確定", how: "一覧に氏名・メールアドレス・電話番号・住所などを表示。", href: "/admin/monitors", hrefLabel: "D-1" },
  { no: "23", area: "モニター管理", item: "並べ替え（既定：モニター番号の昇順）", pri: "◎", type: "追加", status: "確定", how: "見出しクリックで昇順／降順。既定はモニター番号の昇順。", href: "/admin/monitors", hrefLabel: "D-1" },
  { no: "24", area: "モニター管理", item: "モニター情報項目の追加と入力規制", pri: "◎", type: "追加", status: "要検討", how: "氏名・電話・職種・就業形態・子供の学齢・興味関心6項目などを追加。入力規制（半角／全角・形式）を共通化し、登録・マイページ・管理画面で同一ルールを適用。", href: "/register", hrefLabel: "登録フォーム" },
  { no: "32", area: "モニター管理", item: "モニター情報の編集（管理画面）", pri: "◎", type: "追加", status: "確定", how: "モニター詳細から全項目を編集可能（入力規制あり）。変更項目を監査ログに記録。", href: "/admin/monitors/1001?edit=1", hrefLabel: "D-1-1 編集" },
  { no: "25", area: "モニター管理", item: "CSV出力（No.24の項目）", pri: "◎", type: "確認", status: "要検討", how: "新項目を含む全項目をCSV出力（パスワードは出力しない）。CSVインポートにも対応。", href: "/admin/monitors", hrefLabel: "D-1" },
  { no: "26", area: "サンプル数調査", item: "サンプル項目の追加", pri: "◎", type: "追加", status: "要検討", how: "子供の学齢・職種・就業形態・興味関心・利用媒体などを絞り込み条件に追加。配信条件（A-1-4）にも同じ条件を使用。", href: "/admin/sample", hrefLabel: "E-1" },
  { no: "27", area: "退会管理", item: "検索機能", pri: "×", type: "無し", status: "対応不要", how: "追加しない（現行どおり）。" },
  { no: "28", area: "退会管理", item: "並べ替え（既定：退会日時の降順）", pri: "△", type: "追加", status: "確定", how: "見出しクリックで昇順／降順。既定は退会日時の降順。", href: "/admin/withdrawals", hrefLabel: "F-1" },
  { no: "29", area: "退会管理", item: "CSV出力", pri: "×", type: "無し", status: "対応不要", how: "追加しない。" },
  { no: "30", area: "設定", item: "管理者設定", pri: "×", type: "無し", status: "対応不要", how: "機能の変更なし。ただしパスワードは画面に平文表示せず、ハッシュ化して保管（セキュリティ指摘への対応）。", href: "/admin/settings", hrefLabel: "G-1" },
  { no: "31", area: "設定", item: "文章設定", pri: "×", type: "無し", status: "対応不要", how: "機能の変更なし（パスワードを平文で送るメールのみ、再設定URL方式に置換）。", href: "/admin/mail-texts", hrefLabel: "G-2" },
];

export default function Requirements() {
  const [filter, setFilter] = useState("");
  const rows = REQS.filter((r) => !filter || r.status === filter);
  return (
    <AdminPage title="要求事項 対応状況" crumbs="デモ ＞ 要求事項（案）Rev.1 の全35行と実装箇所">
      <div className="alert _info">「③Vinsight_要求事項（案）.xlsx」の全35行に対応しています。「要検討」の項目は<b>採用案として実装</b>しており、不要と判断された場合は後から外せます。</div>
      <div className="filter"><label className="f">ステータス<select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">すべて（{REQS.length}）</option><option>確定</option><option>要検討</option><option>対応不要</option></select></label></div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>No.</th><th>画面</th><th>対象項目</th><th>重要度</th><th>区分</th><th>ステータス</th><th>このデモでの実装</th><th>確認</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.no}>
            <td><b className="jost">{r.no}</b></td><td>{r.area}</td><td style={{ minWidth: 200 }}>{r.item}</td><td>{r.pri}</td><td>{r.type}</td>
            <td><span className={"pill " + (r.status === "確定" ? "go" : r.status === "要検討" ? "warn" : "end")}>{r.status}</span></td>
            <td style={{ minWidth: 340 }}>{r.how}</td>
            <td className="acts">{r.href && <Link className="link" href={r.href} target={r.href.startsWith("/admin") ? undefined : "_blank"}>{r.hrefLabel} →</Link>}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </AdminPage>
  );
}
