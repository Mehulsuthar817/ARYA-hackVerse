import { AlertTriangle, CheckCircle2 } from 'lucide-react'

function AlertPanel({ alerts = [] }) {
  return (
    <section className="rounded-2xl border border-steel-700/80 bg-steel-900/80 p-4 shadow-card">
      <h3 className="mb-4 font-display text-lg font-semibold text-steel-50">AI Alerts</h3>

      {alerts.length === 0 ? (
        <p className="text-sm text-steel-300">No active alerts at the moment.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-steel-700/80 bg-steel-800/45 p-3"
            >
              <div>
                <p className="font-medium text-steel-100">{alert.message}</p>
                <p className="text-xs text-steel-300">{alert.time}</p>
              </div>
              {alert.severity === 'high' ? (
                <AlertTriangle className="text-amber-600" size={18} />
              ) : (
                <CheckCircle2 className="text-emerald-600" size={18} />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default AlertPanel
