import "../../styles/admin.css";
import "../../styles/admin-polish.css";
import { AdminShell } from "@/components/admin";

export const metadata = { title: "Vinsight 管理画面" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
