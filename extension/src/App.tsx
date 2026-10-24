import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { checkHealth } from './api'
import './App.css'
import HintCoach from './HintCoach'

type Tab = 'Notes' | 'Practice' | 'Past papers'
type Question = { prompt: string; answer: string; source: string }
const MAX_SIZE_MB = 20

function makeQuestions(notes: string, count: number): Question[] {
  return notes.split(/(?<=[.!?])\s+|\n+/).map(line => line.trim())
    .filter(line => line.split(/\s+/).length >= 5)
    .map(source => {
      const words = source.match(/[A-Za-z][A-Za-z'-]{3,}/g) ?? []
      const answer = [...words].sort((a, b) => b.length - a.length)[0]
      return answer ? { prompt: source.replace(new RegExp(answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '________'), answer, source } : null
    }).filter((q): q is Question => q !== null).slice(0, count)
}

function App() {
  const notesInput = useRef<HTMLInputElement>(null)
  const paperInput = useRef<HTMLInputElement>(null)
  const [hintsOn, setHintsOn] = useState(true)
  const [tab, setTab] = useState<Tab>('Notes')
  const [notes, setNotes] = useState('')
  const [noteName, setNoteName] = useState('Pasted notes')
  const [paper, setPaper] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [serverUp, setServerUp] = useState<boolean | null>(null)
  const [count, setCount] = useState(5)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  useEffect(() => { checkHealth().then(setServerUp) }, [])

  async function handleFile(event: ChangeEvent<HTMLInputElement>, kind: 'notes' | 'paper') {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Choose a file under ${MAX_SIZE_MB} MB.`)
      return
    }
    try {
      if (kind === 'paper') {
        if (await file.slice(0, 5).text() !== '%PDF-') {
          setError('Choose a valid PDF past paper.')
          return
        }
        setPaper(file)
      } else {
        if (!/\.(txt|md)$/i.test(file.name)) {
          setError('Upload .txt or .md notes, or paste your notes below. PDF notes are not supported yet.')
          return
        }
        setNotes(await file.text())
        setNoteName(file.name)
      }
    } catch { setError('This file could not be read. Please try again.') }
  }

  function generate() {
    const next = makeQuestions(notes, count)
    if (!next.length) {
      setError('Add a few complete sentences to your notes first. Each needs at least five words.')
      return
    }
    setQuestions(next)
    setAnswers(next.map(() => ''))
    setSubmitted(false)
    setError('')
    setTab('Practice')
  }
  function openWorkspace() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
    } else window.open(window.location.href, '_blank', 'noopener,noreferrer')
  }
  const score = questions.filter((q, i) => answers[i]?.trim().toLowerCase() === q.answer.toLowerCase()).length

  return (
    <main className="panel">
      <header className="masthead">
        <div><h1 className="wordmark">Clutch<span>.</span></h1></div>
        <div className="header-actions"><span className="connection" role="status">{serverUp === null ? 'Connecting' : serverUp ? 'Backend connected' : 'Local study mode'}</span><button className="text-button" onClick={openWorkspace}>Open workspace ↗</button></div>
      </header>
      <section className="agent-bar" aria-labelledby="hints-mode-label">
        <div className="agent-heading"><h2 id="hints-mode-label">Hints Mode</h2><span>{hintsOn ? 'Guided steps and breakdowns' : 'Quiz with direct answer feedback'}</span></div>
        <div className={`mode-toggle${hintsOn ? ' mode-toggle--on' : ''}`} role="group" aria-labelledby="hints-mode-label">
          <span className="mode-indicator" aria-hidden="true" />
          <button type="button" aria-pressed={hintsOn} onClick={() => setHintsOn(true)}>Hints On</button>
          <button type="button" aria-pressed={!hintsOn} onClick={() => setHintsOn(false)}>No Hints</button>
        </div>
      </section>
      <nav className="tabs" aria-label="Study sections">
        {(['Notes', 'Practice', 'Past papers'] as Tab[]).map(name => <button key={name} aria-current={tab === name ? 'page' : undefined} className={tab === name ? 'tab active' : 'tab'} onClick={() => { setTab(name); setError('') }}>{name}</button>)}
      </nav>
      {error && <p className="error" role="alert">{error}</p>}
      {tab === 'Notes' && <div className="content">
        <div className="section-heading"><div><h2>Course notes</h2></div></div>
        <div className="upload"><input className="visually-hidden" type="file" accept=".txt,.md,text/plain,text/markdown" aria-label="Upload notes" tabIndex={-1} ref={notesInput} onChange={e => void handleFile(e, 'notes')} /><span className="upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg></span><strong>Upload notes</strong><span>.txt or .md · up to 20 MB</span><button type="button" className="upload-button" onClick={() => notesInput.current?.click()}><svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4"/></svg>Browse files</button></div>
        <div className="field-heading"><label htmlFor="notes">Or paste your notes</label><span>{notes.trim() ? notes.trim().split(/\s+/).length : 0} words</span></div>
        <textarea id="notes" value={notes} onChange={e => { setNotes(e.target.value); setNoteName('Pasted notes') }} placeholder="Enter notes here..." />
        <p className="session-note">Notes stay in this session only.</p>
        <button className="primary" disabled={!notes.trim()} onClick={() => { setTab('Practice'); setError('') }}>Continue to practice <span>→</span></button>
      </div>}
      {tab === 'Practice' && <div className={hintsOn && questions.length > 0 ? "practice-layout" : "practice-layout practice-layout--direct"}><div className="content practice-main">
        <div className="section-heading"><div><h2>Practice setup</h2></div></div>
        <div className="source"><span className="field-label">Source notes</span><strong>{notes.trim() ? noteName : 'No notes added yet'}</strong><button className="text-button" onClick={() => setTab('Notes')}>{notes.trim() ? 'Edit notes' : 'Add notes'} →</button></div>
        <div className="settings"><label>Question type<select defaultValue="blank"><option value="blank">Fill in the blank</option></select></label><label>Questions<select value={count} onChange={e => setCount(Number(e.target.value))}><option value={5}>5 questions</option><option value={10}>10 questions</option><option value={15}>15 questions</option></select></label></div>
        <p className="muted">Question count depends on the available notes.</p>
        <button className="primary" disabled={!notes.trim()} onClick={generate}>{questions.length ? 'Create a new quiz' : 'Create practice quiz'} <span>→</span></button>
        {questions.length > 0 && <section className="quiz" aria-label="Practice quiz"><div className="section-heading"><h3>Your practice quiz</h3><span className="badge">{questions.length} questions</span></div>{questions.map((q, i) => <div className="question" key={`${i}-${q.prompt}`}><label htmlFor={`answer-${i}`}><span className="field-label">Question {i + 1}</span><p>{q.prompt}</p></label><input id={`answer-${i}`} value={answers[i]} disabled={submitted} placeholder="Missing term…" onChange={e => setAnswers(answers.map((a, n) => n === i ? e.target.value : a))} />{submitted && <p className={answers[i].trim().toLowerCase() === q.answer.toLowerCase() ? 'correct' : 'feedback'}>{answers[i].trim().toLowerCase() === q.answer.toLowerCase() ? 'Correct!' : hintsOn ? 'Keep trying — ask Clutch for a hint.' : 'Answer: ' + q.answer}</p>}</div>)}{submitted ? <div className="quiz-result"><button className="secondary" onClick={() => setSubmitted(false)}>Try again →</button><p className="result" role="status">{score} / {questions.length} correct. {score === questions.length ? 'You’ve got this.' : hintsOn ? 'Use the hints and give it another go.' : 'Review the answers or try again.'}</p></div> : <button className="primary" onClick={() => setSubmitted(true)} disabled={answers.some(a => !a.trim())}>Check my answers</button>}</section>}
      </div>{hintsOn && questions.length > 0 && <HintCoach key={questions.map(q => q.prompt).join()} questions={questions.map(q => q.prompt)} />}
      </div>}
      {tab === 'Past papers' && <div className="content"><div className="section-heading"><div><h2>Past papers</h2></div></div><div className="upload"><input className="visually-hidden" type="file" accept="application/pdf,.pdf" aria-label="Upload a past paper" tabIndex={-1} ref={paperInput} onChange={e => void handleFile(e, 'paper')} /><span className="upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg></span><strong>{paper ? paper.name : 'Choose a past paper'}</strong><span>{paper ? `${(paper.size / 1024 / 1024).toFixed(1)} MB · PDF selected` : 'A PDF from your course · up to 20 MB'}</span><button type="button" className="upload-button" onClick={() => paperInput.current?.click()}><svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4"/></svg>{paper ? 'Replace PDF' : 'Choose PDF'}</button></div><div className="callout" role="note"><p><strong>Past paper practice is coming next.</strong> You can select a PDF here; reading questions and generating exam-style practice still need a backend connection. Use text notes for quizzes today.</p></div><button className="secondary" onClick={() => setTab('Notes')}>Practice from notes →</button></div>}
    </main>
  )
}
export default App
