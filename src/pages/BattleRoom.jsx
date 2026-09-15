import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { getMultiplayerBattle } from '../services/battleService.js'
import './BattleRoom.css'

function BattleRoom() {
  const { battleId } = useParams()
  const { token, user } = useAuth()
  const { connect } = useSocket()
  const navigate = useNavigate()
  const [battle, setBattle] = useState(null)
  const [liveState, setLiveState] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const loadBattle = useCallback(async () => {
    try { const data = await getMultiplayerBattle(token, battleId); setBattle(data.battle); return data.battle } catch (requestError) { setError(requestError.message); return null }
  }, [battleId, token])

  useEffect(() => { loadBattle() }, [loadBattle])

  async function copyBattleCode() {
    try {
      await navigator.clipboard.writeText(battle.battleCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Unable to copy the battle code. Please copy it manually.')
    }
  }

  useEffect(() => {
    const socket = connect()
    if (!socket) return undefined
    let disposed = false
    const joinRoom = () => socket.emit('battle:join', { battleId }, (result) => {
      if (disposed || !result?.ok) { if (!disposed && result?.message) setError(result.message); return }
      setLiveState(result.state)
      loadBattle().then((current) => { if (!disposed && current?.status === 'active') navigate(`/battle/${battleId}/play`, { replace: true }); else if (!disposed && current?.status === 'completed') navigate(`/battle/result/${battleId}`, { replace: true }) })
    })
    const syncState = (state) => { setLiveState(state); loadBattle() }
    const startBattle = (state) => { setLiveState(state); loadBattle().then(() => { if (!disposed) navigate(`/battle/${battleId}/play`, { replace: true }) }) }
    const completedBattle = () => navigate(`/battle/result/${battleId}`, { replace: true })
    const updateConnection = (userId, connected) => setLiveState((state) => state ? { ...state, creator: state.creator.id === userId ? { ...state.creator, connected } : state.creator, opponent: state.opponent?.id === userId ? { ...state.opponent, connected } : state.opponent } : state)
    const playerConnected = ({ userId }) => updateConnection(userId, true)
    const playerDisconnected = ({ userId }) => updateConnection(userId, false)
    socket.on('connect', joinRoom)
    socket.on('battle:state', syncState)
    socket.on('battle:opponent_joined', syncState)
    socket.on('battle:started', startBattle)
    socket.on('battle:completed', completedBattle)
    socket.on('battle:player_connected', playerConnected)
    socket.on('battle:player_disconnected', playerDisconnected)
    if (socket.connected) joinRoom()
    return () => { disposed = true; socket.off('connect', joinRoom); socket.off('battle:state', syncState); socket.off('battle:opponent_joined', syncState); socket.off('battle:started', startBattle); socket.off('battle:completed', completedBattle); socket.off('battle:player_connected', playerConnected); socket.off('battle:player_disconnected', playerDisconnected) }
  }, [battleId, connect, loadBattle, navigate])

  if (error) return <section className="battle-room-state"><h1>Battle unavailable</h1><p>{error}</p><Link to="/battle">RETURN TO BATTLES</Link></section>
  if (!battle) return <p className="page-state">Loading battle room...</p>
  const isCreator = battle.creator._id === user.id
  const hasSubmitted = isCreator ? battle.creatorSubmitted : battle.opponentSubmitted
  const opponentOnline = isCreator ? liveState?.opponent?.connected : liveState?.creator?.connected
  const opponentSubmitted = isCreator ? battle.opponentSubmitted : battle.creatorSubmitted
  return <section className="battle-room"><header className="page-header"><p className="page-header__label">BATTLE ROOM</p><h1>{battle.status === 'waiting' ? 'Battle Created' : battle.status === 'completed' ? 'Battle Completed' : 'Battle Ready'}</h1><p className="page-header__description">Battle ID: #{battle._id.slice(-6).toUpperCase()}</p></header>
    <article className="battle-room__card"><div className="battle-room__players"><div><small>PLAYER 1</small><strong>{battle.creator.name}</strong><span>{isCreator ? 'YOU' : 'OPPONENT'} · {liveState?.creator?.connected ? 'CONNECTED' : 'DISCONNECTED'}</span></div><b>VS</b><div><small>PLAYER 2</small><strong>{battle.opponent?.name || 'Waiting...'}</strong><span>{!battle.opponent ? 'WAITING' : `${isCreator ? 'OPPONENT' : 'YOU'} · ${liveState?.opponent?.connected ? 'CONNECTED' : 'DISCONNECTED'}`}</span></div></div><dl><div><dt>Subject</dt><dd>{battle.subject}</dd></div><div><dt>Topic</dt><dd>{battle.topic}</dd></div><div><dt>Questions</dt><dd>{battle.questionCount}</dd></div></dl>
      {battle.status === 'waiting' && isCreator && <div className="battle-room__code"><small>YOUR BATTLE CODE</small><strong>{battle.battleCode}</strong><button onClick={copyBattleCode} type="button">{copied ? 'COPIED!' : 'COPY CODE'}</button><p>Share this code with your opponent.</p></div>}
      {battle.status === 'waiting' && <p className="battle-room__notice">Waiting for an opponent<span className="battle-room__dots">...</span></p>}
      {battle.status === 'active' && <p className="battle-room__notice">{hasSubmitted ? 'Your answers are submitted. Waiting for your opponent.' : opponentSubmitted ? 'Opponent has submitted their answers.' : opponentOnline ? 'Opponent joined! Starting your battle...' : 'Opponent disconnected. Reconnecting when they return.'}</p>}
      {battle.status === 'completed' && <Link className="battle-room__notice" to={`/battle/result/${battleId}`}>VIEW RESULTS</Link>}
    </article></section>
}

export default BattleRoom
