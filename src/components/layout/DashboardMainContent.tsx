"use client";

import { ReactNode } from "react";

interface DashboardMainContentProps {
  children: ReactNode;
}

export const DashboardMainContent = ({ children }: DashboardMainContentProps) => {
  return (
    <main className="flex-1 p-6">
      {children}
    </main>
  );
};
