import { useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'

const MAX_SIZE_MB = 20

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function App() {
  const [paper, setPaper] = useState<File | null>(null)
  const [error, setError] = useState('')

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setPaper(null)
    setError('')

    if (!file) return

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`That file is ${formatSize(file.size)}. Pick a PDF under ${MAX_SIZE_MB} MB.`)
      return
    }

    // Every real PDF starts with "%PDF-", so check the file itself, not just its name
    const header = await file.slice(0, 5).text()
    if (header !== '%PDF-') {
      setError("That file isn't a PDF. Pick a past paper saved as .pdf.")
      return
    }

    setPaper(file)
  }

  return (
    <main>
      <h1>Clutch</h1>
      <p>
        Study from past papers. Clutch makes questions in the same style as your real exams,
        including multiple choice and written questions. It grades your answers with partial
        marks, gives hints when you're stuck, and finds YouTube videos for topics you keep missing.
      </p>

      <label htmlFor="paper-upload">Upload a past paper (PDF)</label>
      <input
        id="paper-upload"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
      />

      {error && <p role="alert">{error}</p>}

      {paper && (
        <p>
          Ready: <strong>{paper.name}</strong> ({formatSize(paper.size)})
        </p>
      )}

      <button type="button">Study this page</button>
    </main>
  )
}

export default App
