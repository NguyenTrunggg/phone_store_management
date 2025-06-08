"use client"

import { ReactNode } from "react"
import { DashboardHeader } from "@/components/layout/DashboardHeader"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { DashboardMainContent } from "@/components/layout/DashboardMainContent"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <DashboardMainContent>
          {children}
        </DashboardMainContent>
      </div>
    </div>
  )
}

