import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic()

export interface ParsedScorecard {
  courseName: string | null
  date: string | null
  holes: 9 | 18 | null
  par: number | null
  players: { name: string; score: number }[]
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported image type. Use JPEG, PNG, or WebP.' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Parse this golf scorecard image and return a JSON object with these exact fields:
- courseName: string or null (name of the golf course if visible)
- date: string or null (date in YYYY-MM-DD format if visible)
- holes: 9 or 18 (number of holes played — count the hole columns or infer from context)
- par: number or null (total par for the round, not per-hole)
- players: array of objects with "name" (string) and "score" (number, total score for the round)

Rules:
- Return ONLY the raw JSON object, no markdown, no explanation
- If you cannot determine a value, use null
- For players, only include players who have a total score recorded
- scores should be the gross total score for the round`,
        },
      ],
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  // Strip markdown code fences if Claude wrapped the response
  const cleaned = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  try {
    const parsed = JSON.parse(cleaned) as ParsedScorecard
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Could not parse scorecard — try a clearer image' }, { status: 422 })
  }
}
