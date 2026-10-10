"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert, Pill } from "@/components/ui";
import { fmtDate, useApi } from "@/lib/client";

export default function TopicDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useApi<{ date: string; title: string; body: string }>(`/mypage/news/${id}`);
  return (
    <section>
      <div className="crumb" style={{ fontSize: "1.3rem", color: "#525252", marginBottom: 18 }}><Link href="/mypage" style={{ textDecoration: "underline" }}>マイページ</Link> ＞ 新着情報</div>
      {error && <Alert kind="err">{error.message}</Alert>}
      {data && (
        <article>
          <div className="jost" style={{ fontSize: "1.5rem", fontWeight: 500 }}>{fmtDate(data.date)}</div>
          <h2 style={{ fontSize: "2.8rem", fontWeight: 900, lineHeight: 1.5, margin: "8px 0 24px", paddingBottom: 18, borderBottom: "2px solid #000" }}>{data.title}</h2>
          <div style={{ whiteSpace: "pre-wrap", fontSize: "1.6rem", lineHeight: 2 }}>{data.body}</div>
          <Pill href="/mypage" left>マイページへ戻る</Pill>
        </article>
      )}
    </section>
  );
}
