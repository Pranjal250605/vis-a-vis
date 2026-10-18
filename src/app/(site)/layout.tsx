import "../../styles/site.css";
import "../../styles/polish.css";
import "../../styles/home.css";
import { SiteShell } from "@/components/SiteShell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
