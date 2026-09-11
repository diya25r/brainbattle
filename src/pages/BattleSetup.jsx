import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { createMultiplayerBattle, joinMultiplayerBattleByCode } from '../services/battleService.js'
import './BattleSetup.css'

const subjectTopics = { Java: ['Basics', 'OOP', 'Arrays', 'Strings', 'Methods', 'Inheritance', 'Polymorphism', 'Exception Handling', 'Collections', 'Loops / Control Flow'], DBMS: ['DBMS Basics', 'SQL', 'Keys', 'Normalization', 'ER Model', 'Transactions', 'ACID', 'Joins', 'Indexing', 'Relational Concepts'], 'Web Development': ['HTML', 'CSS', 'JavaScript', 'DOM', 'HTTP', 'REST APIs', 'React', 'Node.js', 'Express', 'Web Concepts'], Aptitude: ['Percentages', 'Profit & Loss', 'Ratio & Proportion', 'Averages', 'Time & Work', 'Time, Speed & Distance', 'Simple & Compound Interest', 'Number System', 'Probability', 'Logical Reasoning'] }
const questionCounts = [5, 10]
const battleCodePattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/

function BattleSetup() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [setup, setSetup] = useState({ subject: '', topic: '', difficulty: '', questionCount: '' })
  const [battleCode, setBattleCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const topics = useMemo(() => subjectTopics[setup.subject] || [], [setup.subject])
  const isValid = Boolean(setup.subject && setup.topic && setup.difficulty && setup.questionCount)

  function updateSetup(event) {
    const { name, value } = event.target
    setError('')
    setSetup((current) => name === 'subject' ? { ...current, subject: value, topic: '' } : { ...current, [name]: value })
  }

  function updateBattleCode(event) {
    setError('')
    setBattleCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6))
  }

  async function createBattle(event) {
    event.preventDefault()
    if (!isValid || isLoading) return
    setIsLoading(true); setError('')
    try { const data = await createMultiplayerBattle(token, setup); navigate(`/battle/${data.battle._id}`) } catch (requestError) { setError(requestError.message) } finally { setIsLoading(false) }
  }

  async function joinBattle(event) {
    event.preventDefault()
    const normalizedCode = battleCode.trim()
    if (!battleCodePattern.test(normalizedCode)) { setError('Please enter a valid 6-character battle code.'); return }
    setIsJoining(true); setError('')
    try { const data = await joinMultiplayerBattleByCode(token, normalizedCode); navigate(`/battle/${data.battle._id}`) } catch (requestError) { setError(requestError.message) } finally { setIsJoining(false) }
  }

  return <>
    <header className="page-header"><p className="page-header__label">BATTLE</p><h1>Challenge another player</h1><p className="page-header__description">Create a battle, share its code, then face your opponent in real time.</p></header>
    <section className="battle-section"><div className="battle-section__heading"><p className="page-header__label">CREATE A BATTLE</p><h2>Set up your challenge</h2></div>
      <form className="battle-setup" onSubmit={createBattle}><div className="battle-setup__grid">
        <label className="battle-field">SUBJECT<select name="subject" onChange={updateSetup} value={setup.subject}><option value="">Select a subject</option>{Object.keys(subjectTopics).map((subject) => <option key={subject}>{subject}</option>)}</select></label>
        <label className="battle-field">TOPIC<select disabled={!setup.subject} name="topic" onChange={updateSetup} value={setup.topic}><option value="">Select a topic</option>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
        <label className="battle-field">DIFFICULTY<select name="difficulty" onChange={updateSetup} value={setup.difficulty}><option value="">Select difficulty</option>{['Easy', 'Medium', 'Hard'].map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></label>
        <label className="battle-field">NUMBER OF QUESTIONS<select name="questionCount" onChange={updateSetup} value={setup.questionCount}><option value="">Select a number</option>{questionCounts.map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
      </div>{error && <p className="battle-setup__error" role="alert">{error}</p>}<button className="battle-setup__button" disabled={!isValid || isLoading} type="submit">{isLoading ? 'CREATING BATTLE...' : 'CREATE BATTLE'}</button></form>
    </section>
    <section className="battle-section battle-section--join"><div className="battle-section__heading"><p className="page-header__label">JOIN A BATTLE</p><h2>Enter your opponent's code</h2></div>
      <form className="battle-code-join" onSubmit={joinBattle}><label className="battle-field">BATTLE CODE<input autoComplete="off" inputMode="text" maxLength="6" onChange={updateBattleCode} placeholder="B7K9XP" value={battleCode} /></label>{error && <p className="battle-setup__error" role="alert">{error}</p>}<button className="battle-setup__button" disabled={isJoining} type="submit">{isJoining ? 'JOINING BATTLE...' : 'JOIN BATTLE'}</button></form>
    </section>
  </>
}

export default BattleSetup
