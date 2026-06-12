export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span
        aria-hidden
        className="inline-block h-2 w-2 translate-y-[-1px] rounded-full bg-accent"
      />
      <span className="font-serif text-lg font-medium tracking-tight text-foreground">
        Méridian
      </span>
    </span>
  )
}
