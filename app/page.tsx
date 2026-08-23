'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Skill = { id: number; Name: string }
type Role = { id: number; Name: string }

export default function Home() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [roadmap, setRoadmap] = useState<string[]>([])

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

  async function generateRoadmap() {
    if (!selectedRole) return

    const { data: requirements } = await supabase
      .from('role_requirements')
      .select('skill_id, step_order')
      .eq('role_id', selectedRole)
      .order('step_order', { ascending: true })

    if (!requirements) return

    const missingSkillIds = requirements
      .filter(r => !selectedSkills.includes(r.skill_id))
      .map(r => r.skill_id)

    const missingSkillNames = missingSkillIds.map(id => {
      const skill = skills.find(s => s.id === id)
      return skill ? skill.Name : 'Unknown skill'
    })

    setRoadmap(missingSkillNames)
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
      <button onClick={generateRoadmap}>Generate Roadmap</button>

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
    </main>
  )
}
