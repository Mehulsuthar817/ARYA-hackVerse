import { ArrowRight, Camera, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-navy-500/35 bg-steel-900/75 shadow-card backdrop-blur">
        <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-navy-400/35 bg-navy-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-navy-100">
              AI + CCTV Integrated Monitoring
            </p>
            <h1 className="font-display text-4xl font-bold text-steel-50 md:text-5xl">
              Missing Person Identification System
            </h1>
            <p className="max-w-xl text-steel-200">
              A professional investigation interface for citizens and police teams to report, track,
              and verify missing person cases with AI-assisted CCTV analysis.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-navy-700 px-5 py-3 font-medium text-white hover:bg-navy-800"
              >
                Login <ArrowRight size={16} />
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-steel-100 transition hover:bg-white/10"
              >
                Create Account <UserRoundPlus size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-navy-900 to-navy-700 p-5 text-white">
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="mb-1 text-sm text-steel-100">Live Camera Monitoring</p>
              <p className="font-display text-2xl font-semibold">06 Active Feeds</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-4">
              <p className="mb-1 text-sm text-steel-100">AI Match Pipeline</p>
              <p className="font-display text-2xl font-semibold">Real-time Candidate Alerts</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-300/20 p-4">
                <ShieldCheck className="mb-2" size={18} />
                <p className="text-sm">Police verified investigation workflow</p>
              </div>
              <div className="rounded-xl bg-amber-300/20 p-4">
                <Camera className="mb-2" size={18} />
                <p className="text-sm">Evidence-ready footage tracking</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
