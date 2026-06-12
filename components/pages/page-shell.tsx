import type { ReactNode } from "react"

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12 md:px-12 md:py-16">
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string
  title: string
  intro?: string
}) {
  return (
    <header className="mb-10">
      <p className="mb-4 text-xs uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </p>
      <h1 className="text-balance font-serif text-3xl font-light leading-tight text-foreground md:text-4xl">
        {title}
      </h1>
      {intro && (
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
    </header>
  )
}
