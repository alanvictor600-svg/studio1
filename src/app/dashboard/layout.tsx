import type React from "react";
import DashboardLayoutClient from "./DashboardLayoutClient";
export default function Layout(props: any) {
  const { children } = props as { children: React.ReactNode };
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
