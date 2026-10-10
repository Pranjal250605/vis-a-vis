"use client";
import Link from "next/link";
import VisitorInquiry from "@/components/VisitorInquiry";
import { SectionTitle } from "@/components/ui";

export default function Contact() {
  return (
    <div className="cmn-inner" style={{ maxWidth: 860 }}>
      <div className="page-head">
        <div className="crumb"><Link href="/">HOME</Link> ＞ お問い合わせ</div>
        <SectionTitle en="Contact" jp="お問い合わせ（モニター以外の方）" />
        <p style={{ marginTop: 14, fontSize: "1.4rem" }}>すでにモニターの方は、ログイン後のマイページ内にあるお問い合わせフォームをご利用ください。</p>
      </div>
      <div className="card" style={{ marginTop: 24 }}><VisitorInquiry /></div>
    </div>
  );
}
