'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

  useEffect(() => {
    async function fetchData() {
      const { data: skillsData } = await supabase.from('skills').select('*')
      const { data: rolesData } = await supabase.from('roles').select('*')
      if (skillsData) setSkills(skillsData)
      if (rolesData) setRoles(rolesData)
    }
    fetchData()
  }, [])

  function toggleSkill(id: number) {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
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
    const { names } = await getMissingSkills()
    setRoadmap(names)
  }

  async function generateAiRoadmap() {
    setRoadmap([])
    setError('')
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
        body: JSON.stringify({
          knownSkills: knownSkillNames,
          targetRole: roleName,
          missingSkills,
        }),
      })

      if (!res.ok) throw new Error('Request failed')

      const data = await res.json()
      setAiPhases(data.phases || [])
    } catch (err) {
      setError('AI roadmap generation failed. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 600, margin: '40px auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>AI Career Mentor</h1>

      <h2>1. Select the skills you already know</h2>
      {skills.map(skill => (
        <label key={skill.id} style={{ display: 'block', marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={selectedSkills.includes(skill.id)}
            onChange={() => toggleSkill(skill.id)}
          />
          {' '}{skill.Name}
        </label>
      ))}

      <h2>2. Select your target role</h2>
      <select
        value={selectedRole ?? ''}
        onChange={e => setSelectedRole(Number(e.target.value))}
      >
        <option value="">-- Choose a role --</option>
        {roles.map(role => (
          <option key={role.id} value={role.id}>{role.Name}</option>
        ))}
      </select>

      <br /><br />
      <button onClick={generateRoadmap}>Generate Simple Roadmap</button>
      {' '}
      <button onClick={generateAiRoadmap} disabled={loading}>
        {loading ? 'Generating with AI...' : 'Generate AI Roadmap'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {roadmap.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2>Your Roadmap</h2>
          <ol>
            {roadmap.map((skillName, i) => (
              <li key={i}>{skillName}</li>
            ))}
          </ol>
        </div>
      )}

      {aiPhases.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h2>Your AI-Generated Roadmap</h2>
          {aiPhases.map((phase, i) => (
            <div key={i} style={{ marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
              <h3>{phase.phase_name} (~{phase.estimated_weeks} weeks)</h3>
              <p style={{ color: '#555' }}>{phase.reasoning}</p>
              <ul>
                {phase.skills.map((s, j) => <li key={j}>{s}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
