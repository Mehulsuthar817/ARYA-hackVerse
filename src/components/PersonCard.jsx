import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

function PersonCard({ person }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-card">
      <img
        src={person.photo}
        alt={person.name}
        className="h-48 w-full object-cover"
        loading="lazy"
      />
      <div className="space-y-2 p-4">
        <h3 className="font-display text-lg font-semibold text-navy-900">{person.name}</h3>
        <p className="text-sm text-steel-700">Age: {person.age}</p>
        <p className="text-sm text-steel-700">Last Seen: {person.lastSeenLocation}</p>
        <Link
          to="/my-reports"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-navy-700 px-3 py-2 text-sm font-medium text-white hover:bg-navy-800"
        >
          <Eye size={16} />
          Details
        </Link>
      </div>
    </article>
  )
}

export default PersonCard
