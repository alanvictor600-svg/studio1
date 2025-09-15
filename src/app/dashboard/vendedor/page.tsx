
"use client";

// This is an alias for the main dashboard page, pre-setting the role.
// The actual logic is in /dashboard/[role]/page.tsx to avoid duplication.
// We keep this file for a cleaner seller-specific URL.

import DashboardPage from '../[role]/page';

export default function SellerPageAlias() {
  return <DashboardPage />;
}
