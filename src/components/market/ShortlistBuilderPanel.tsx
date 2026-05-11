import Link from 'next/link'

interface ShortlistBuilderPanelProps {
  title?: string
  description?: string
  contextLabel?: string
}

const DEFAULT_TITLE = 'Turn discovery into a real shortlist'
const DEFAULT_DESCRIPTION =
  'Use the heart on promising phones, then open your watchlist to protect the right finalists with alerts and move the strongest two into Compare.'

const STEPS = [
  {
    eyebrow: 'Step 1',
    title: 'Save likely finalists',
    description: 'As soon as a phone looks promising, save it instead of trusting memory or browser tabs.',
  },
  {
    eyebrow: 'Step 2',
    title: 'Open your watchlist',
    description: 'Review saved phones in one place, set alerts, and see which picks still need protection.',
  },
  {
    eyebrow: 'Step 3',
    title: 'Compare the strongest two',
    description: 'Once two phones keep surviving the shortlist, move them into a direct head-to-head page.',
  },
] as const

export const ShortlistBuilderPanel = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  contextLabel = 'Shortlist builder',
}: ShortlistBuilderPanelProps) => (
  <section className="rounded-2xl border border-borderHigh bg-gradient-to-br from-tealTint via-surface to-surface px-5 py-5 shadow-sm">
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {contextLabel}
        </p>
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-text-primary">
            {title}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {STEPS.map((step) => (
          <article
            key={step.title}
            className="rounded-2xl border border-border bg-white/80 px-4 py-4"
          >
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                {step.eyebrow}
              </p>
              <h3 className="text-base font-bold text-text-primary">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/saved"
          className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-bold text-white transition-colors duration-fast hover:bg-accent-hover"
        >
          Open watchlist
        </Link>
        <Link
          href="/compare"
          className="inline-flex h-10 items-center justify-center rounded-md border border-accent/25 bg-tealTint px-4 text-sm font-black text-accent transition-colors duration-fast hover:border-accent/40 hover:bg-accent/10 hover:text-accent-hover"
        >
          Compare finalists
        </Link>
      </div>
    </div>
  </section>
)
