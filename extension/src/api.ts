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
