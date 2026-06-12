"use client"

import { AppProvider, useApp } from "@/lib/store"
import { Onboarding } from "@/components/onboarding/onboarding"
import { AppShell } from "@/components/app-shell"

function Root() {
  const { onboarded, setOnboarded } = useApp()
  if (!onboarded) return <Onboarding onComplete={() => setOnboarded(true)} />
  return <AppShell />
}

export default function Page() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  )
}
