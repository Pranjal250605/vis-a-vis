"use client";
import { useParams } from "next/navigation";
import { Alert, SectionTitle } from "@/components/ui";
import { useApi } from "@/lib/client";

/** アンケートのプレビュー（内部IDとは別採番の公開IDで開く。回答は保存されない） */
export default function Preview() {
  const { publicId } = useParams<{ publicId: string }>();
  const { data, error } = useApi<any>(`/preview/${publicId}`);
  if (error) return <div className="cmn-inner"><div style={{ padding: "60px 0" }}><Alert kind="err">{error.message}</Alert></div></div>;
  if (!data) return null;
  return (
    <div className="cmn-inner" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div className="crumb">プレビュー（回答は送信されません）</div>
        <SectionTitle en="Preview" jp={data.title} />
      </div>
      <div className="pre-text">{data.preText}</div>
      {data.questions.map((q: any, i: number) => (
        <div className="survey-q" key={q.id}>
          <h4><span>Q{i + 1}</span>{q.text}</h4>
          <div className="opts fm">
            {q.kind === "自由記述" ? <textarea disabled /> : q.options.map((o: string) => (
              <label className="check" key={o}><input type={q.kind === "単一選択" ? "radio" : "checkbox"} disabled />{o}</label>
            ))}
          </div>
        </div>
      ))}
      <div className="pre-text" style={{ background: "#eaf3fe" }}>{data.postText}</div>
    </div>
  );
}
