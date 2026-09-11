import { AdminApp } from "@/components/admin-app";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminPage() {
  return <AdminApp />;
}
