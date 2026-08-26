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

      if (!error && roadmapsData) {
        setRoadmaps(roadmapsData)
      }

      setLoading(false)
    }
    load()
  }, [router])

  function getRoleName(roleId: number) {
    return roles.find(r => r.id === roleId)?.Name || 'Unknown role'
  }

  if (loading) return <main style={{ padding: 20 }}>Loading...</main>

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>My Roadmaps</h1>
        <Link href="/">Back to Home</Link>
      </div>

      {roadmaps.length === 0 && (
        <p>You haven&apos;t generated any roadmaps yet. <Link href="/">Create one now</Link>.</p>
      )}

      {roadmaps.map(rm => (
        <div key={rm.id} style={{ marginBottom: 24, padding: 16, border: '1px solid #ccc', borderRadius: 8 }}>
          <h2>{getRoleName(rm.role_id)}</h2>
          <p style={{ color: '#666', fontSize: 14 }}>
            Generated on {new Date(rm.created_at).toLocaleDateString()}
          </p>
          <p><strong>Skills you had:</strong> {rm.known_skills || 'None'}</p>

          {rm.roadmap_data.map((phase, i) => (
            <div key={i} style={{ marginTop: 12, paddingLeft: 12, borderLeft: '3px solid #ddd' }}>
              <strong>{phase.phase_name}</strong> (~{phase.estimated_weeks} weeks)
              <p style={{ color: '#555', margin: '4px 0' }}>{phase.reasoning}</p>
              <ul>
                {phase.skills.map((s, j) => <li key={j}>{s}</li>)}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </main>
  )
}