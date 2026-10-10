"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Alert, Pill } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

function Inner() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "ng">("loading");
  const [id, setId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    api<{ id: number }>("/register/complete", { body: { token } })
      .then((r) => { if (alive) { setId(r.id); setState("ok"); } })
      .catch((e: ApiClientError) => { if (alive) { setMsg(e.message); setState("ng"); } });
    return () => { alive = false; };
  }, [token]);

  return (
    <div className="cmn-inner">
      <div className="done-box">
        {state === "loading" && <p>本登録処理中…</p>}
        {state === "ok" && (
          <>
            <h2>本登録が完了しました</h2>
            <p>モニター番号は <b className="jost" style={{ fontSize: "2.4rem" }}>{id}</b> です。<br />本登録完了メールをお送りしました。ログインしてアンケートにご回答ください。</p>
            <Pill href="/#login">ログインへ</Pill>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/person01.webp" alt="" />
          </>
        )}
        {state === "ng" && (<div style={{ maxWidth: 560, margin: "0 auto" }}><Alert kind="err">{msg}</Alert><Pill href="/register">新規登録へ</Pill></div>)}
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
