function StatsCard({ title, value, icon, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-steel-900/80 border-steel-700/80',
    accent: 'bg-navy-900/40 border-navy-500/35',
    warning: 'bg-amber-500/12 border-amber-400/40',
  }

  return (
    <article
      className={`rounded-2xl border p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lg ${toneClasses[tone] || toneClasses.default}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-steel-300">{title}</p>
        <div className="rounded-xl border border-white/10 bg-steel-800/70 p-2 text-navy-200">{icon}</div>
      </div>
      <p className="font-display text-3xl font-semibold text-steel-50">{value}</p>
    </article>
  )
}

export default StatsCard
