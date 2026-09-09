function XPProgress({ level, xp }) {
  const levelStart = (level - 1) * 1000
  const currentLevelXp = Math.max(0, xp - levelStart)
  const remainingXp = Math.max(0, 1000 - currentLevelXp)
  const progress = Math.min(100, (currentLevelXp / 1000) * 100)

  return (
    <section className="xp-progress">
      <div className="xp-progress__heading"><div><p>XP PROGRESS</p><h2>LEVEL {level} <span>→</span> LEVEL {level + 1}</h2></div><strong>{currentLevelXp} / 1000 XP</strong></div>
      <div aria-label={`${Math.round(progress)} percent to level ${level + 1}`} aria-valuemax="100" aria-valuemin="0" aria-valuenow={progress} className="xp-progress__track" role="progressbar"><span style={{ width: `${progress}%` }} /></div>
      <p className="xp-progress__remaining">{remainingXp} XP to next level</p>
    </section>
  )
}

export default XPProgress
