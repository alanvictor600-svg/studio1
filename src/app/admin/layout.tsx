import type React from "react";
import AdminLayoutClient from "./AdminLayoutClient";
export default function Layout(props: any) {
  const { children } = props as { children: React.ReactNode };
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
