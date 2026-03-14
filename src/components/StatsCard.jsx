function StatsCard({ title, value, icon, tone = 'default' }) {
  const toneClasses = {
    default: 'bg-white border-steel-200',
    accent: 'bg-navy-50 border-navy-200',
    warning: 'bg-amber-50 border-amber-200',
  }

  return (
    <article
      className={`rounded-2xl border p-5 shadow-card transition hover:-translate-y-1 hover:shadow-lg ${toneClasses[tone] || toneClasses.default}`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-steel-600">{title}</p>
        <div className="rounded-xl bg-white p-2 text-navy-700">{icon}</div>
      </div>
      <p className="font-display text-3xl font-semibold text-navy-900">{value}</p>
    </article>
  )
}

export default StatsCard
