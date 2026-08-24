import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    const { knownSkills, targetRole, missingSkills } = await request.json()

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' })

    const prompt = `You are a career mentor helping someone become a ${targetRole}.

They already know: ${knownSkills.join(', ') || 'nothing yet'}.
They still need to learn: ${missingSkills.join(', ')}.

Create a phased learning roadmap using ONLY the skills listed above (do not add new skills).
Group them into 2-4 logical phases based on dependency order.
For each phase, give a short reason why those skills come at that stage, and a rough estimated number of weeks.

Respond ONLY with valid JSON in this exact structure, no extra text, no markdown formatting:
{
  "phases": [
    {
      "phase_name": "string",
      "skills": ["string"],
      "reasoning": "string",
      "estimated_weeks": number
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('AI roadmap generation failed:', error)
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 })
  }
}