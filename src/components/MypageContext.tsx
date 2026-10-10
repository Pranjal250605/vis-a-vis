"use client";
import { createContext, useContext } from "react";

export interface MyPageData {
  monitor: any;
  news: { id: number; date: string; title: string; individual: boolean }[];
  surveys: { id: number; date: string; type: string; title: string; points: number | null; state: string }[];
  trades: { id: number; appliedAt: string; items: { item: string; units: number }[]; pointsUsed: number; status: string }[];
  expiry: { months: number; lots: { points: number; expiresAt: string | null }[]; soon: { points: number; expiresAt: string | null }[]; soonTotal: number; nextExpiry: { points: number; expiresAt: string } | null };
  active: boolean;
}
export const MyPageCtx = createContext<{ data: MyPageData | null; reload: () => void }>({ data: null, reload: () => {} });
export const useMyPage = () => useContext(MyPageCtx);
