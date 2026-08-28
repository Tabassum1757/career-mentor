'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Phase = {
  phase_name: string
  skills: string[]
  reasoning: string
  estimated_weeks: number
}

type SavedRoadmap = {
  id: number
  created_at: string
  role_id: number
  known_skills: string
  roadmap_data: Phase[]
}

type Role = { id: number; Name: string }

export default function Dashboard() {
  const [roadmaps, setRoadmaps] = useState<SavedRoadmap[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: rolesData } = await supabase.from('roles').select('*')
      if (rolesData) setRoles(rolesData)

      const { data: roadmapsData, error } = await supabase
        .from('user_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && roadmapsData) setRoadmaps(roadmapsData)
      setLoading(false)
    }
    load()
  }, [router])

  function getRoleName(roleId: number) {
    return roles.find(r => r.id === roleId)?.Name || 'Unknown role'
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading your roadmaps…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
            Trailhead
          </Link>
          <Link href="/" className="text-sm underline hover:no-underline" style={{ color: 'var(--trail)' }}>
            Back to Home
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--waypoint)' }}>
          Your history
        </p>
        <h1 className="font-display text-2xl mb-8" style={{ color: 'var(--ink)' }}>
          My Roadmaps
        </h1>

        {roadmaps.length === 0 && (
          <div
            className="rounded-lg border border-dashed p-8 text-center text-sm"
            style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          >
            You haven&apos;t generated any roadmaps yet.{' '}
            <Link href="/" className="underline hover:no-underline" style={{ color: 'var(--trail)' }}>
              Create one now
            </Link>.
          </div>
        )}

        <div className="space-y-6">
          {roadmaps.map(rm => (
            <div
              key={rm.id}
              className="rounded-lg border p-5"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-baseline justify-between mb-1 gap-3">
                <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>
                  {getRoleName(rm.role_id)}
                </h2>
                <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {new Date(rm.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                Known skills: {rm.known_skills || 'None'}
              </p>

              <div className="relative pl-8">
                <div
                  className="absolute left-[7px] top-1 bottom-1 w-[2px]"
                  style={{ backgroundColor: 'var(--border)' }}
                />
                <div className="space-y-4">
                  {rm.roadmap_data.map((phase, i) => (
                    <div key={i} className="relative">
                      <div
                        className="absolute -left-8 top-1 w-4 h-4 rounded-full"
                        style={{ backgroundColor: i === 0 ? 'var(--trail)' : 'var(--waypoint)' }}
                      />
                      <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                        {phase.phase_name}{' '}
                        <span className="font-mono text-xs font-normal" style={{ color: 'var(--waypoint)' }}>
                          (~{phase.estimated_weeks} wks)
                        </span>
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{phase.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}