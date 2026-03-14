import { AlertTriangle, CheckCircle2 } from 'lucide-react'

function AlertPanel({ alerts = [] }) {
  return (
    <section className="rounded-2xl border border-steel-200 bg-white p-4 shadow-card">
      <h3 className="mb-4 font-display text-lg font-semibold text-navy-900">AI Alerts</h3>

      {alerts.length === 0 ? (
        <p className="text-sm text-steel-600">No active alerts at the moment.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-steel-200 bg-steel-50 p-3"
            >
              <div>
                <p className="font-medium text-steel-800">{alert.message}</p>
                <p className="text-xs text-steel-600">{alert.time}</p>
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
