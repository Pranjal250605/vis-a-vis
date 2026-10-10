import Link from "next/link";
import { SectionTitle } from "@/components/ui";

export default function Privacy() {
  return (
    <div className="cmn-inner" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div className="crumb"><Link href="/">HOME</Link> ＞ 個人情報保護方針</div>
        <SectionTitle en="Privacy" jp="個人情報保護方針" />
      </div>
      <div className="simple-page" style={{ padding: 0 }}>
        <p style={{ marginTop: 20 }}>※これはデモ用の文面です。正式な個人情報保護方針の本文は、運営団体（協同組合岡山情報文化研究所）の最新版に差し替えてください。</p>
        <h2>1. 取得する情報</h2>
        <p>モニター登録時にご入力いただく氏名、連絡先、生年月日、性別、家族構成、お仕事、興味・関心、ポイント交換時のお届け先情報などを取得します。</p>
        <h2>2. 利用目的</h2>
        <p>アンケートの配信・集計、謝礼ポイントの付与・交換、各種ご案内（メール・新着情報）、お問い合わせへの対応のために利用します。</p>
        <h2>3. パスワードの取り扱い</h2>
        <p>パスワードは暗号化（ハッシュ化）して保管し、画面表示やメール送信は行いません。</p>
        <h2>4. 退会時の取り扱い</h2>
        <p>退会手続きにより、登録情報の削除と保有ポイントの失効を行います（退会理由は運営上の統計として保管されます）。</p>
        <h2>5. お問い合わせ</h2>
        <p>個人情報の取り扱いに関するお問い合わせは、<Link href="/contact" style={{ textDecoration: "underline" }}>お問い合わせフォーム</Link>からご連絡ください。</p>
        <p style={{ marginTop: 28 }}>運営団体：協同組合岡山情報文化研究所</p>
      </div>
    </div>
  );
}
