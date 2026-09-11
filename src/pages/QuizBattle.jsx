import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { getMultiplayerBattle, submitMultiplayerAnswer } from '../services/battleService.js'
import './QuizBattle.css'

const letters = ['A', 'B', 'C', 'D']

function QuizBattle() {
  const { battleId } = useParams()
  const { token, user } = useAuth()
  const { connect } = useSocket()
  const navigate = useNavigate()
  const storageKey = `brainbattle-battle-${battleId}`
  const [battle, setBattle] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState(() => { try { return JSON.parse(sessionStorage.getItem(storageKey)) || {} } catch { return {} } })
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [liveState, setLiveState] = useState(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const loadBattle = useCallback(async () => {
    try {
      const data = await getMultiplayerBattle(token, battleId)
      setBattle(data.battle)
      if (data.battle.myAnswers?.length) setAnswers(Object.fromEntries(data.battle.myAnswers.map(({ questionId, answer }) => [questionId, answer])))
      setHasSubmitted(data.battle.myAnswers?.length === data.battle.questionCount)
      return data.battle
    } catch (requestError) { setError(requestError.message); return null }
  }, [battleId, token])
  useEffect(() => { loadBattle() }, [loadBattle])
  useEffect(() => {
    const socket = connect()
    if (!socket) return undefined
    const joinRoom = () => socket.emit('battle:join', { battleId }, (result) => { if (result?.ok) setLiveState(result.state); else if (result?.message) setError(result.message) })
    const syncState = (state) => { setLiveState(state); loadBattle() }
    const updateConnection = (userId, connected) => setLiveState((state) => state ? { ...state, creator: state.creator.id === userId ? { ...state.creator, connected } : state.creator, opponent: state.opponent?.id === userId ? { ...state.opponent, connected } : state.opponent } : state)
    const playerConnected = ({ userId }) => updateConnection(userId, true)
    const playerDisconnected = ({ userId }) => updateConnection(userId, false)
    const completedBattle = () => navigate(`/battle/result/${battleId}`, { replace: true })
    socket.on('connect', joinRoom); socket.on('battle:state', syncState); socket.on('battle:opponent_joined', syncState); socket.on('battle:started', syncState); socket.on('battle:player_submitted', syncState); socket.on('battle:completed', completedBattle); socket.on('battle:player_connected', playerConnected); socket.on('battle:player_disconnected', playerDisconnected)
    if (socket.connected) joinRoom()
    return () => { socket.off('connect', joinRoom); socket.off('battle:state', syncState); socket.off('battle:opponent_joined', syncState); socket.off('battle:started', syncState); socket.off('battle:player_submitted', syncState); socket.off('battle:completed', completedBattle); socket.off('battle:player_connected', playerConnected); socket.off('battle:player_disconnected', playerDisconnected) }
  }, [battleId, connect, loadBattle])
  useEffect(() => { sessionStorage.setItem(storageKey, JSON.stringify(answers)) }, [answers, storageKey])
  useEffect(() => {
    if (!hasSubmitted || battle?.status !== 'active') return undefined
    const pollBattle = async () => {
      try {
        const data = await getMultiplayerBattle(token, battleId)
        setBattle(data.battle)
        if (data.battle.status === 'completed') navigate(`/battle/result/${battleId}`, { replace: true })
      } catch { /* Socket.IO remains the primary path; retry on the next interval. */ }
    }
    const intervalId = window.setInterval(pollBattle, 2500)
    return () => window.clearInterval(intervalId)
  }, [battle?.status, battleId, hasSubmitted, navigate, token])
  useEffect(() => { if (battle?.status === 'completed') navigate(`/battle/result/${battleId}`, { replace: true }) }, [battle?.status, battleId, navigate])

  if (error) return <section className="quiz-empty"><p className="page-header__label">BATTLE</p><h1>Battle unavailable</h1><p>{error}</p><Link to="/battle">RETURN TO BATTLES</Link></section>
  if (!battle) return <p className="page-state">Loading your battle...</p>
  if (battle.status === 'waiting') return <section className="quiz-empty"><p className="page-header__label">BATTLE</p><h1>Waiting for opponent</h1><p>Your battle cannot start until another player joins.</p><Link to={`/battle/${battleId}`}>RETURN TO BATTLE ROOM</Link></section>
  if (battle.status === 'completed') return <section className="quiz-empty"><p className="page-header__label">BATTLE</p><h1>Battle completed</h1><Link to={`/battle/result/${battleId}`}>VIEW RESULTS</Link></section>
  const questions = battle.questions
  const currentQuestion = questions[currentIndex]
  const selectedAnswer = answers[currentQuestion._id]
  const answeredCount = Object.keys(answers).length
  const isCreator = battle.creator._id === user.id
  const opponent = isCreator ? battle.opponent : battle.creator
  const opponentSubmitted = isCreator ? (liveState?.opponentSubmitted ?? battle.opponentSubmitted) : (liveState?.creatorSubmitted ?? battle.creatorSubmitted)
  const opponentConnected = isCreator ? liveState?.opponent?.connected : liveState?.creator?.connected
  const isLast = currentIndex === questions.length - 1

  if (hasSubmitted) return <section className="quiz-empty"><p className="page-header__label">BATTLE</p><h1>You finished!</h1><p>Your answers have been submitted.</p><p>Waiting for your opponent to finish...</p><small>Opponent: {opponentSubmitted ? 'Finished' : opponentConnected ? 'Answering...' : 'Disconnected'}</small></section>

  async function submit() {
    setIsSubmitting(true); setError('')
    try {
      let status = 'active'
      for (const question of questions) {
        if (battle.myAnswers?.some(({ questionId }) => questionId === question._id)) continue
        const result = await submitMultiplayerAnswer(token, battleId, question._id, answers[question._id])
        status = result.status
      }
      sessionStorage.removeItem(storageKey)
      setShowConfirmation(false)
      setHasSubmitted(true)
      if (status === 'completed') navigate(`/battle/result/${battleId}`, { replace: true })
      else await loadBattle()
    } catch (requestError) { setError(requestError.message); setShowConfirmation(false) } finally { setIsSubmitting(false) }
  }

  return <section className="quiz-battle"><header className="quiz-battle__header"><div><p className="page-header__label">BATTLE</p><h1>{battle.subject}</h1><p>{battle.topic} <span>•</span> {battle.difficulty}</p></div><div className="quiz-battle__progress-label">Question {currentIndex + 1} of {questions.length}<small>YOU VS {opponent.name} · {opponentSubmitted ? 'SUBMITTED' : opponentConnected ? 'CONNECTED' : 'DISCONNECTED'}</small></div></header>
    <div className="quiz-battle__progress"><span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} /></div><nav aria-label="Question navigation" className="question-navigator">{questions.map((question, index) => <button className={`${index === currentIndex ? 'is-current ' : ''}${answers[question._id] ? 'is-answered' : ''}`} key={question._id} onClick={() => setCurrentIndex(index)} type="button">{String(index + 1).padStart(2, '0')}</button>)}</nav>
    <article className="quiz-question-card"><p className="quiz-question-card__number">{String(currentIndex + 1).padStart(2, '0')}</p><h2>{currentQuestion.question}</h2><div aria-label="Answer options" className="quiz-options" role="radiogroup">{currentQuestion.options.map((option, index) => <button aria-checked={selectedAnswer === option} className={selectedAnswer === option ? 'is-selected' : ''} key={option} onClick={() => setAnswers((current) => ({ ...current, [currentQuestion._id]: option }))} role="radio" type="button"><span>{letters[index]}</span>{option}</button>)}</div></article>
    {error && <p className="quiz-error" role="alert">{error}</p>}<footer className="quiz-controls"><button disabled={currentIndex === 0 || isSubmitting} onClick={() => setCurrentIndex((index) => index - 1)} type="button">PREVIOUS</button>{isLast ? <button className="quiz-controls__primary" disabled={answeredCount !== questions.length || isSubmitting} onClick={() => setShowConfirmation(true)} type="button">SUBMIT BATTLE</button> : <button className="quiz-controls__primary" disabled={!selectedAnswer || isSubmitting} onClick={() => setCurrentIndex((index) => index + 1)} type="button">NEXT</button>}</footer>
    {showConfirmation && <div aria-modal="true" className="quiz-modal-backdrop" role="dialog"><div className="quiz-modal"><p className="page-header__label">BATTLE</p><h2>Submit your battle?</h2><p>You have answered {answeredCount} of {questions.length} questions.</p><div><button disabled={isSubmitting} onClick={() => setShowConfirmation(false)} type="button">GO BACK</button><button className="quiz-controls__primary" disabled={isSubmitting} onClick={submit} type="button">{isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}</button></div></div></div>}
  </section>
}

export default QuizBattle
