import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { checkHealth } from './api'
import './App.css'

const MAX_SIZE_MB = 20

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function App() {
  const [paper, setPaper] = useState<File | null>(null)
  const [error, setError] = useState('')
  // null = still checking, true = server running, false = can't reach it
  const [serverUp, setServerUp] = useState<boolean | null>(null)

  // Runs once when the panel opens
  useEffect(() => {
    checkHealth().then(setServerUp)
  }, [])

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

  // Turns serverUp into a word for the status line and a class for its colour
  const serverLabel =
    serverUp === null ? 'checking' : serverUp ? 'connected' : 'offline'

  return (
    <main className="panel">
      <header className="masthead">
        <h1 className="wordmark">Clutch</h1>
        <p className={`server server--${serverLabel}`} role="status">
          <span className="server__dot" aria-hidden="true" />
          server {serverLabel}
        </p>
      </header>

      <p className="lead">Practise from your course's own past papers.</p>

      {serverUp === false && (
        <p className="note">
          Start the backend with <code>./mvnw spring-boot:run</code>, then reopen this panel.
        </p>
      )}

      <section className="paper" aria-labelledby="paper-heading">
        <h2 id="paper-heading" className="section-label">
          Past paper
        </h2>

        <label className={`answer-box${paper ? ' answer-box--filled' : ''}`}>
          <input
            className="visually-hidden"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
          />
          {paper ? (
            <>
              <span className="answer-box__mark" aria-hidden="true">✓</span>
              <span className="answer-box__file">{paper.name}</span>
              <span className="answer-box__meta">{formatSize(paper.size)} · choose a different file</span>
            </>
          ) : (
            <>
              <span className="answer-box__title">Choose a PDF</span>
              <span className="answer-box__meta">An exam your course has shared · up to {MAX_SIZE_MB} MB</span>
            </>
          )}
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="primary" disabled={!paper}>
          Read the questions
        </button>
      </section>

      <section className="steps" aria-labelledby="steps-heading">
        <h2 id="steps-heading" className="section-label">
          How a session works
        </h2>
        <ol>
          <li>
            <strong>Clutch reads the paper</strong> and tags each question by topic and marks.
          </li>
          <li>
            <strong>You get new questions</strong> written in the same style, multiple choice or
            written.
          </li>
          <li>
            <strong>Answer, then get marked</strong> with partial credit. Hints come before the
            answer, and videos for topics you keep missing.
          </li>
        </ol>
      </section>
    </main>
  )
}

export default App
