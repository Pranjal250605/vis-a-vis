"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { INPUT_HINTS } from "@/lib/rules";
import { Alert, Pill, Row, SectionTitle } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";

/** Shown once, right after the first login of a member carried over from the old site. */
export default function PasswordChange() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ monitor: { passwordChangeRequired: boolean } | null }>("/auth/me")
      .then(({ monitor }) => {
        if (!monitor) router.replace("/?expired=1#login");
        else if (!monitor.passwordChangeRequired) router.replace("/mypage"); // already done: this page is never shown again
        else setReady(true);
      })
      .catch(() => router.replace("/"));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(""); setErrors({});
    try {
      await api("/auth/change-password", { body: { currentPassword, password, passwordConfirm } });
      router.replace("/mypage");
    } catch (ex) {
      const x = ex as ApiClientError;
      setMsg(x.message); setErrors(x.fields);
    } finally { setBusy(false); }
  };

  if (!ready) return null;
  return (
    <div className="cmn-inner" style={{ maxWidth: 720 }}>
      <div className="page-head"><SectionTitle en="Password" jp="新しいパスワードの設定" /></div>
      <Alert kind="info">
        サイトをリニューアルしました。安全のため、初回のログイン時に新しいパスワードを設定していただいています。設定が終わると、マイページをご利用いただけます。
      </Alert>
      <form className="card fm" onSubmit={submit} noValidate style={{ marginTop: 24 }}>
        {msg && <Alert kind="err">{msg}</Alert>}
        <Row label="現在のパスワード" required error={errors.currentPassword} hint="ログインに使ったパスワードです。">
          <input type="password" autoComplete="current-password" value={currentPassword} className={errors.currentPassword ? "invalid" : ""} onChange={(e) => setCurrentPassword(e.target.value)} />
        </Row>
        <Row label="新しいパスワード" required error={errors.password} hint={INPUT_HINTS.password}>
          <input type="password" autoComplete="new-password" value={password} className={errors.password ? "invalid" : ""} onChange={(e) => setPassword(e.target.value)} />
        </Row>
        <Row label="新しいパスワード（確認）" required error={errors.passwordConfirm}>
          <input type="password" autoComplete="new-password" value={passwordConfirm} className={errors.passwordConfirm ? "invalid" : ""} onChange={(e) => setPasswordConfirm(e.target.value)} />
        </Row>
        <div className="form-actions"><Pill type="submit" disabled={busy}>{busy ? "設定中…" : "設定する"}</Pill></div>
      </form>
    </div>
  );
}
