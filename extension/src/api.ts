// Where the Spring Boot server runs during development
export const API_BASE = 'http://localhost:8080/api'

// Returns true if the server answers /api/health with {"status":"ok"}
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    if (!response.ok) return false
    const data: { status?: string } = await response.json()
    return data.status === 'ok'
  } catch {
    // fetch throws when the server isn't running at all
    return false
  }
}

export async function requestHint(question: string, message: string): Promise<{ hint: string; mode: 'ai' | 'local' }> {
  const response = await fetch(`${API_BASE}/hints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, message }),
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) throw new Error('Hint request failed')
  const data = await response.json()
  if (typeof data.hint !== 'string' || !['ai', 'local'].includes(data.mode)) throw new Error('Invalid hint response')
  return data
}
