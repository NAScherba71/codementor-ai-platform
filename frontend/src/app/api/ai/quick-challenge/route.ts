import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { challengeId, code, language } = body

    // Call the AI Engine's quick-challenge endpoint (Gemini 3 Flash)
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:5000'
    const response = await fetch(`${aiEngineUrl}/ai/quick-challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challenge_id: challengeId,
        code,
        language,
      }),
    })

    if (!response.ok) {
      throw new Error('AI Engine request failed')
    }

    const data = await response.json()

    return NextResponse.json({
      success: data.success || true,
      feedback: data.feedback || data.message,
      score: data.score,
      hints: data.hints,
    })
  } catch (error) {
    console.error('Quick challenge error:', error)
    return NextResponse.json(
      {
        success: false,
        feedback: 'Failed to process your solution. Please try again.',
      },
      { status: 500 }
    )
  }
}
