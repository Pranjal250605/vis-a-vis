"use client";
import { useParams } from "next/navigation";
import { AdminPage } from "@/components/admin";
import NewsForm from "@/components/NewsForm";
import { Alert } from "@/components/ui";
import { useApi } from "@/lib/client";
import type { News } from "@/lib/types";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useApi<{ news: News }>(`/admin/news/${id}`);
  if (error) return <AdminPage title="新着情報"><Alert kind="err">{error.message}</Alert></AdminPage>;
  if (!data) return null;
  return <NewsForm news={data.news} />;
}
