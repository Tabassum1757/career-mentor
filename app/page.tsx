'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

type Skill = { id: number; Name: string }
type Role = { id: number; Name: string }
type Phase = {
  phase_name: string
  skills: string[]
  reasoning: string
  estimated_weeks: number
}

export default function Home() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [roadmap, setRoadmap] = useState<string[]>([])
  const [aiPhases, setAiPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: skillsData } = await supabase.from('skills').select('*')
      const { data: rolesData } = await supabase.from('roles').select('*')
      if (skillsData) setSkills(skillsData)
      if (rolesData) setRoles(rolesData)
    }
    fetchData()

    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  function toggleSkill(id: number) {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function getMissingSkills(): Promise<{ names: string[]; roleName: string }> {
    if (!selectedRole) return { names: [], roleName: '' }
    const { data: requirements } = await supabase
      .from('role_requirements')
      .select('skill_id, step_order')
      .eq('role_id', selectedRole)
      .order('step_order', { ascending: true })
    if (!requirements) return { names: [], roleName: '' }
    const missingSkillIds = requirements
      .filter(r => !selectedSkills.includes(r.skill_id))
      .map(r => r.skill_id)
    const missingSkillNames = missingSkillIds.map(id => {
      const skill = skills.find(s => s.id === id)
      return skill ? skill.Name : 'Unknown skill'
    })
    const roleName = roles.find(r => r.id === selectedRole)?.Name || ''
    return { names: missingSkillNames, roleName }
  }

  async function generateRoadmap() {
    setAiPhases([])
    setError('')
    setSaveMessage('')
    const { names } = await getMissingSkills()
    setRoadmap(names)
  }

  async function generateAiRoadmap() {
    setRoadmap([])
    setError('')
    setSaveMessage('')
    setLoading(true)
    const { names: missingSkills, roleName } = await getMissingSkills()

    if (missingSkills.length === 0 || !roleName) {
      setError('Please select a role and make sure you have missing skills to learn.')
      setLoading(false)
      return
    }

    const knownSkillNames = selectedSkills.map(id => {
      const skill = skills.find(s => s.id === id)
      return skill ? skill.Name : ''
    }).filter(Boolean)

    try {
      const res = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knownSkills: knownSkillNames, targetRole: roleName, missingSkills }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setAiPhases(data.phases || [])

      if (user && data.phases) {
        const { error: saveError } = await supabase.from('user_roadmaps').insert({
          user_id: user.id,
          role_id: selectedRole,
          known_skills: knownSkillNames.join(', '),
          roadmap_data: data.phases,
        })
        if (!saveError) setSaveMessage('Saved to your account.')
      }
    } catch (err) {
      setError('AI roadmap generation failed. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="font-display text-2xl" style={{ color: 'var(--ink)' }}>
            Trailhead
          </h1>
          {user ? (
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--muted)' }}>
              <span>{user.email}</span>
              <Link href="/dashboard" className="underline hover:no-underline" style={{ color: 'var(--trail)' }}>
                My Roadmaps
              </Link>
              <button onClick={handleLogout} className="underline hover:no-underline">
                Log Out
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm underline hover:no-underline" style={{ color: 'var(--trail)' }}>
              Log In / Sign Up
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-[280px_1fr] gap-10">

        {/* Left column: skills + role */}
        <div>
          <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--waypoint)' }}>
            Step 1
          </p>
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--ink)' }}>
            What do you already know?
          </h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {skills.map(skill => {
              const active = selectedSkills.includes(skill.id)
              return (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className="px-3 py-1.5 rounded-full text-sm border transition-colors"
                  style={
                    active
                      ? { backgroundColor: 'var(--trail)', borderColor: 'var(--trail)', color: 'white' }
                      : { backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--ink)' }
                  }
                >
                  {skill.Name}
                </button>
              )
            })}
          </div>

          <p className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--waypoint)' }}>
            Step 2
          </p>
          <h2 className="font-display text-xl mb-4" style={{ color: 'var(--ink)' }}>
            Where are you headed?
          </h2>
          <select
            value={selectedRole ?? ''}
            onChange={e => setSelectedRole(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
          >
            <option value="">Choose a role</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.Name}</option>
            ))}
          </select>

          <div className="flex flex-col gap-3 mt-8">
            <button
              onClick={generateAiRoadmap}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--trail)' }}
            >
              {loading ? 'Mapping your route…' : 'Generate AI Roadmap'}
            </button>
            <button
              onClick={generateRoadmap}
              className="px-4 py-2.5 rounded-lg text-sm font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
            >
              Generate Simple Roadmap
            </button>
          </div>

          {error && <p className="text-sm mt-4" style={{ color: '#B4432E' }}>{error}</p>}
          {saveMessage && <p className="text-sm mt-4" style={{ color: 'var(--trail)' }}>{saveMessage}</p>}
        </div>

        {/* Right column: results */}
        <div>
          {roadmap.length > 0 && (
            <div>
              <h2 className="font-display text-xl mb-4" style={{ color: 'var(--ink)' }}>Your Roadmap</h2>
              <ol className="space-y-2">
                {roadmap.map((name, i) => (
                  <li
                    key={i}
                    className="px-4 py-3 rounded-lg border flex items-center gap-3"
                    style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                  >
                    <span className="font-mono text-xs" style={{ color: 'var(--waypoint)' }}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-sm">{name}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {aiPhases.length > 0 && (
            <div>
              <h2 className="font-display text-xl mb-6" style={{ color: 'var(--ink)' }}>Your Trail</h2>
              <div className="relative pl-10">
                {/* vertical trail line */}
                <div
                  className="absolute left-[15px] top-2 bottom-2 w-[2px]"
                  style={{ backgroundColor: 'var(--border)' }}
                />
                <div className="space-y-8">
                  {aiPhases.map((phase, i) => (
                    <div key={i} className="relative">
                      {/* waypoint circle */}
                      <div
                        className="absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-medium text-white"
                        style={{ backgroundColor: i === 0 ? 'var(--trail)' : 'var(--waypoint)' }}
                      >
                        {i + 1}
                      </div>
                      <div
                        className="rounded-lg border p-4"
                        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-baseline justify-between mb-2 gap-3">
                          <h3 className="font-display text-lg" style={{ color: 'var(--ink)' }}>
                            {phase.phase_name}
                          </h3>
                          <span
                            className="font-mono text-xs px-2 py-1 rounded whitespace-nowrap"
                            style={{ backgroundColor: 'var(--waypoint-light)', color: 'var(--waypoint)' }}
                          >
                            ~{phase.estimated_weeks} wks
                          </span>
                        </div>
                        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                          {phase.reasoning}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {phase.skills.map((s, j) => (
                            <span
                              key={j}
                              className="text-xs px-2 py-1 rounded-full"
                              style={{ backgroundColor: 'var(--trail-light)', color: 'var(--trail)' }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {roadmap.length === 0 && aiPhases.length === 0 && (
            <div
              className="h-full flex items-center justify-center rounded-lg border border-dashed text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)', minHeight: 240 }}
            >
              Your roadmap will appear here.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
