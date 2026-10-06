function PlaceholderPage({ description = 'This section will be available in a later phase.', title }) {
  const isBattle = title === 'Battle Setup'

  return (
    <>
      <header className="page-header">
        <p className="page-header__label">{isBattle ? 'BATTLE' : 'COMING SOON'}</p>
        <h1>{title}</h1>
        <p className="page-header__description">{description}</p>
      </header>
      <section className="placeholder-card">
        <span aria-hidden="true">{isBattle ? '⚔' : '◌'}</span>
        <h2>{isBattle ? 'Battle setup is coming soon' : 'Coming soon'}</h2>
        <p>{isBattle ? 'Your next challenge will be ready here.' : 'We are preparing this space for you.'}</p>
      </section>
    </>
  )
}

export default PlaceholderPage
