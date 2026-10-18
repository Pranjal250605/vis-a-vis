"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, Captcha, Pill, Row, SectionTitle } from "@/components/ui";
import { useMyPage } from "@/components/MypageContext";
import { api, ApiClientError, useApi, yen } from "@/lib/client";
import { EXCHANGE_ITEMS, POINTS_PER_UNIT, PREFECTURES } from "@/lib/constants";
import { INPUT_HINTS } from "@/lib/rules";

type Step = "form" | "confirm" | "done";

export default function Trade() {
  const { reload } = useMyPage();
  const info = useApi<{ monitor: any }>("/mypage/trade");
  const m = info.data?.monitor;
  const [step, setStep] = useState<Step>("form");
  const [units, setUnits] = useState<Record<string, number>>({});
  const [card, setCard] = useState(""); // たまルンカード番号（0526に続く9桁）
  const [a, setA] = useState({ name: "", postcode: "", prefecture: "岡山県", address1: "", address2: "", tel: "", email: "", birth: "" });
  const [cap, setCap] = useState({ id: "", text: "" });
  const [capKey, setCapKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ used: number; balance: number } | null>(null);

  useEffect(() => {
    if (m) setA({ name: m.name, postcode: m.postcode, prefecture: m.prefecture, address1: m.city, address2: m.street, tel: m.tel, email: m.email, birth: m.birth });
  }, [m]);

  const used = useMemo(() => Object.values(units).reduce((s, n) => s + n * POINTS_PER_UNIT, 0), [units]);
  if (!m) return null;
  const balance: number = m.points;
  const remain = balance - used;
  const bad = (k: string) => (errors[k] ? "invalid" : "");
  const itemsPayload = () => EXCHANGE_ITEMS.map((e) => ({ item: e.key, units: units[e.key] ?? 0, cardNo: e.key === "たまルンポイント" ? "0526" + card : undefined }));

  const toConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (used === 0) er.items = "交換する商品の口数を選択してください。";
    if ((units["たまルンポイント"] ?? 0) > 0 && !/^\d{9}$/.test(card)) er.cardNo = "たまルンカード番号は「0526」に続く9桁の半角数字（合計13桁）で入力してください。";
    if (!cap.text) er.captcha = "画像認証の文字を入力してください。";
    setErrors(er);
    if (Object.keys(er).length) { setMsg("入力内容に誤りがあります。"); return; }
    setMsg(""); setStep("confirm"); window.scrollTo({ top: 0 });
  };

  const submit = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await api<{ used: number; balance: number }>("/mypage/trade", { body: { items: itemsPayload(), ...a, captchaId: cap.id, captcha: cap.text } });
      setResult(r); setStep("done"); reload(); window.scrollTo({ top: 0 });
    } catch (ex) {
      const x = ex as ApiClientError;
      setErrors(x.fields); setMsg(x.message); setStep("form"); setCapKey((k) => k + 1); window.scrollTo({ top: 0 });
    } finally { setBusy(false); }
  };

  if (step === "done" && result) {
    return (
      <div className="done-box">
        <h2>ポイント交換のお申し込みを受け付けました</h2>
        <p>消費ポイント：<b className="jost">{yen(result.used)}</b> pt ／ 残りポイント：<b className="jost">{yen(result.balance)}</b> pt<br />ご登録のメールアドレス宛に受付確認メールをお送りしました。発送（送付）までしばらくお待ちください。</p>
        <Pill href="/mypage">マイページへ戻る</Pill>
      </div>
    );
  }

  if (step === "confirm") {
    const rows: [string, string][] = [
      ["交換商品", EXCHANGE_ITEMS.filter((e) => (units[e.key] ?? 0) > 0).map((e) => `${e.key}：${units[e.key]}口（${yen(units[e.key] * POINTS_PER_UNIT)}pt）${e.key === "たまルンポイント" ? `\nカード番号：0526${card}` : ""}`).join("\n")],
      ["消費ポイント", `${yen(used)} pt（残り ${yen(remain)} pt）`],
      ["氏名", a.name], ["住所", `〒${a.postcode}\n${a.prefecture}${a.address1}${a.address2}`], ["電話番号", a.tel], ["メールアドレス", a.email], ["生年月日", a.birth],
    ];
    return (
      <section>
        <SectionTitle small en="Confirm" jp="ポイント交換申込み｜入力内容の確認" />
        {msg && <Alert kind="err">{msg}</Alert>}
        <div className="confirm" style={{ marginTop: 20 }}><dl>{rows.map(([k, v]) => <div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div>
        <p style={{ fontSize: "1.3rem", marginTop: 14 }}>※お申し込み後の取り消し・変更はできません。内容をご確認ください。</p>
        <div className="form-actions">
          <Pill variant="gray" short onClick={() => setStep("form")}>戻る</Pill>
          <Pill short onClick={submit} disabled={busy}>申し込む</Pill>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="crumb" style={{ fontSize: "1.3rem", color: "#525252", marginBottom: 18 }}><Link href="/mypage" style={{ textDecoration: "underline" }}>マイページ</Link> ＞ ポイント交換申込み</div>
      <SectionTitle small en="Point Exchange" jp="ポイント交換申込み" />
      <form className="fm" onSubmit={toConfirm} noValidate style={{ marginTop: 20 }}>
        {msg && <Alert kind="err">{msg}</Alert>}
        <p style={{ fontSize: "1.5rem" }}>現在の謝礼ポイント：<b className="jost" style={{ fontSize: "2.6rem", color: "var(--orange)" }}>{yen(balance)}</b> point　（1口＝{POINTS_PER_UNIT}ポイント）</p>
        {errors.items && <div className="err">{errors.items}</div>}
        <div className="xchg">
          {EXCHANGE_ITEMS.map((e) => {
            const cur = units[e.key] ?? 0;
            const max = Math.floor((remain + cur * POINTS_PER_UNIT) / POINTS_PER_UNIT);
            return (
              <div className="blk" key={e.key}>
                <h4>{e.key}</h4>
                <div className="pick">
                  {/* 口数はプルダウンで選択（要求事項 No.8） */}
                  <select aria-label={`${e.key}の口数`} value={cur} onChange={(ev) => setUnits({ ...units, [e.key]: Number(ev.target.value) })}>
                    {Array.from({ length: Math.max(max, 0) + 1 }, (_, i) => <option key={i} value={i}>{i}口{i ? `（${yen(i * POINTS_PER_UNIT)}pt）` : ""}</option>)}
                  </select>
                  <span className="sub">{yen(cur * POINTS_PER_UNIT)} pt</span>
                </div>
                <p>{e.note}</p>
                {e.key === "たまルンポイント" && cur > 0 && (
                  <div className="extra">
                    <Row label="たまルンカード番号" required error={errors.cardNo} hint={<>「0526」から始まる13桁です。<a href="https://tamarun.jp/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>たまルンカードについて（外部サイト）</a></>}>
                      <div className="inline"><b className="jost" style={{ fontSize: "1.8rem" }}>0526</b><input type="text" inputMode="numeric" maxLength={9} value={card} className={bad("cardNo")} onChange={(ev) => setCard(ev.target.value.replace(/\D/g, ""))} style={{ maxWidth: 220 }} placeholder="9桁" /></div>
                    </Row>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="total"><span>申請ポイント合計</span><b>{yen(used)} <small style={{ fontSize: "1.6rem" }}>pt</small></b></div>

        <div className="sect">申請者情報<small>登録情報が入力されています。お届け先が異なる場合は修正してください。</small></div>
        <Row label="氏名" required error={errors.name} hint={INPUT_HINTS.name}><input type="text" value={a.name} className={bad("name")} onChange={(e) => setA({ ...a, name: e.target.value })} /></Row>
        <Row label="郵便番号" required error={errors.postcode} hint={INPUT_HINTS.postcode}><input type="text" value={a.postcode} className={bad("postcode")} onChange={(e) => setA({ ...a, postcode: e.target.value })} style={{ maxWidth: 200 }} /></Row>
        <Row label="都道府県" required error={errors.prefecture}><select value={a.prefecture} onChange={(e) => setA({ ...a, prefecture: e.target.value })}>{PREFECTURES.map((p) => <option key={p}>{p}</option>)}</select></Row>
        <Row label="市区町村" required error={errors.city}><input type="text" value={a.address1} className={bad("city")} onChange={(e) => setA({ ...a, address1: e.target.value })} /></Row>
        <Row label="丁目・番地・建物名" required><input type="text" value={a.address2} onChange={(e) => setA({ ...a, address2: e.target.value })} /></Row>
        <Row label="電話番号" required error={errors.tel} hint={INPUT_HINTS.tel}><input type="tel" value={a.tel} className={bad("tel")} onChange={(e) => setA({ ...a, tel: e.target.value })} /></Row>
        <Row label="メールアドレス" required error={errors.email} hint="ギフトの送付先になります。パソコンで受信可能なアドレスを推奨します。"><input type="email" value={a.email} className={bad("email")} onChange={(e) => setA({ ...a, email: e.target.value })} /></Row>
        <Row label="生年月日" required><input type="date" value={a.birth} onChange={(e) => setA({ ...a, birth: e.target.value })} /></Row>
        <Captcha onChange={(id, text) => setCap({ id, text })} error={errors.captcha} resetKey={capKey} />
        <div className="form-actions">
          <Pill href="/mypage" variant="gray" short>戻る</Pill>
          <Pill type="submit" short>入力内容を確認する</Pill>
        </div>
      </form>
    </section>
  );
}
