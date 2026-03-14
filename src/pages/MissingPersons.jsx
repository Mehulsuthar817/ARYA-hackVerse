import { Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import PersonCard from '../components/PersonCard'
import { getErrorMessage, reportApi } from '../services/api'

function MissingPersons() {
  const [loading, setLoading] = useState(true)
  const [persons, setPersons] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const response = await reportApi.getMissingPersons({ status: 'all' })
        setPersons(response.data)
      } catch (fetchError) {
        setError(getErrorMessage(fetchError, 'Unable to load missing persons.'))
      } finally {
        setLoading(false)
      }
    }

    fetchPersons()
  }, [])

  const filteredPersons = useMemo(
    () =>
      persons.filter((person) => {
        const matchQuery = `${person.name} ${person.lastSeenLocation}`
          .toLowerCase()
          .includes(query.toLowerCase())
        const matchStatus = statusFilter === 'All' || person.status === statusFilter
        return matchQuery && matchStatus
      }),
    [persons, query, statusFilter],
  )

  return (
    <section className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-navy-900">Missing Persons</h1>
        <p className="text-sm text-steel-600">Search and filter ongoing missing person records.</p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-steel-200 bg-white p-4 shadow-card sm:grid-cols-3">
        <label className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or location"
            className="w-full rounded-xl border border-steel-300 py-2 pl-9 pr-3"
          />
        </label>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-xl border border-steel-300 px-3 py-2"
        >
          <option>All</option>
          <option value="missing">Missing</option>
          <option value="found">Person Found</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-steel-600">
          <Loader2 className="animate-spin" size={18} /> Loading missing persons...
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : filteredPersons.length === 0 ? (
        <p className="rounded-xl bg-steel-100 p-4 text-sm text-steel-700">No matching records found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPersons.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </section>
  )
}

export default MissingPersons
