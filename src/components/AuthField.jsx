function AuthField({ error, id, label, type = 'text', ...inputProps }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={error ? 'auth-field__input auth-field__input--error' : 'auth-field__input'}
        id={id}
        type={type}
        {...inputProps}
      />
      {error && <p className="auth-field__error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

export default AuthField
