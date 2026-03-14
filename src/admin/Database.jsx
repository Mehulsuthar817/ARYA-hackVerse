function Database() {
  const rows = [
    { id: 'DB-001', caseName: 'Rahul Nair', stage: 'Investigation Active', assignedUnit: 'Unit A2' },
    { id: 'DB-002', caseName: 'Anita Das', stage: 'Verified Lead', assignedUnit: 'Unit C1' },
    { id: 'DB-003', caseName: 'Farhan Iqbal', stage: 'Closed - Person Found', assignedUnit: 'Unit B3' },
  ]

  return (
    <section className="rounded-2xl border border-steel-200 bg-white p-5 shadow-card sm:p-6">
      <h1 className="font-display text-3xl font-bold text-navy-900">Case Database</h1>
      <p className="mt-1 text-sm text-steel-600">Centralized case index for police operations.</p>

      <div className="mt-5 overflow-hidden rounded-xl border border-steel-200">
        <table className="min-w-full divide-y divide-steel-200 text-left text-sm">
          <thead className="bg-steel-100">
            <tr>
              <th className="px-4 py-3">Case ID</th>
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Assigned Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-200 bg-white">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{row.id}</td>
                <td className="px-4 py-3">{row.caseName}</td>
                <td className="px-4 py-3">{row.stage}</td>
                <td className="px-4 py-3">{row.assignedUnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default Database
