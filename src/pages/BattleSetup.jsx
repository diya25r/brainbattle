import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getBattleQuestions } from '../services/battleService.js'
import './BattleSetup.css'

const subjectTopics = {
  Java: ['Basics', 'OOP', 'Arrays'],
  DBMS: ['SQL', 'Normalization', 'Keys'],
  'Web Development': ['HTML', 'CSS', 'JavaScript'],
  Aptitude: ['Percentages', 'Ratios', 'Number Problems'],
}

const questionCounts = [5, 10, 15, 20]

function BattleSetup() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [setup, setSetup] = useState({ subject: '', topic: '', difficulty: '', limit: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const topics = useMemo(() => subjectTopics[setup.subject] || [], [setup.subject])
  const isValid = Boolean(setup.subject && setup.topic && setup.difficulty && setup.limit)

  function updateSetup(event) {
    const { name, value } = event.target
    setError('')
    setSetup((current) => name === 'subject' ? { ...current, subject: value, topic: '' } : { ...current, [name]: value })
  }

  async function startBattle(event) {
    event.preventDefault()
    if (!isValid || isLoading) return
    setIsLoading(true)
    setError('')
    try {
      const questions = await getBattleQuestions(token, setup)
      sessionStorage.setItem('brainbattle-battle', JSON.stringify({ setup, questions }))
      navigate('/battle/quiz')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <header className="page-header">
        <p className="page-header__label">BATTLE</p>
        <h1>Set Up Your Battle</h1>
        <p className="page-header__description">Choose your subject, topic, difficulty and number of questions.</p>
      </header>

      <form className="battle-setup" onSubmit={startBattle}>
        <div className="battle-setup__grid">
          <label className="battle-field">SUBJECT
            <select name="subject" onChange={updateSetup} value={setup.subject}>
              <option value="">Select a subject</option>
              {Object.keys(subjectTopics).map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
          </label>
          <label className="battle-field">TOPIC
            <select disabled={!setup.subject} name="topic" onChange={updateSetup} value={setup.topic}>
              <option value="">Select a topic</option>
              {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </label>
          <label className="battle-field">DIFFICULTY
            <select name="difficulty" onChange={updateSetup} value={setup.difficulty}>
              <option value="">Select difficulty</option>
              {['Easy', 'Medium', 'Hard'].map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
            </select>
          </label>
          <label className="battle-field">NUMBER OF QUESTIONS
            <select name="limit" onChange={updateSetup} value={setup.limit}>
              <option value="">Select a number</option>
              {questionCounts.map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="battle-setup__error" role="alert">{error}</p>}
        <button className="battle-setup__button" disabled={!isValid || isLoading} type="submit">
          {isLoading ? 'PREPARING BATTLE...' : 'START BATTLE →'}
        </button>
      </form>
    </>
  )
}

export default BattleSetup
