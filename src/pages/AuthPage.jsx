import { useState } from 'react'
import AuthField from '../components/AuthField.jsx'
import './AuthPage.css'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getErrors(mode, values) {
  const errors = {}
  if (mode === 'signup' && !values.name.trim()) errors.name = 'Please enter your full name.'
  if (!values.email.trim()) errors.email = 'Please enter your email address.'
  else if (!emailPattern.test(values.email)) errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Please enter your password.'
  if (mode === 'signup' && values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

function AuthPage({ mode, onModeChange }) {
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const isLogin = mode === 'login'

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setNotice('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = getErrors(mode, values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      setNotice('Authentication will be connected in a later phase. No account changes were made.')
    }
  }

  function switchMode(nextMode) {
    setValues({ name: '', email: '', password: '', confirmPassword: '' })
    setErrors({})
    setNotice('')
    onModeChange(nextMode)
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="auth-card__brand" aria-label="BrainBattle">BRAIN<span>BATTLE</span></p>
        <div className="auth-card__heading">
          <p className="auth-card__kicker">{isLogin ? 'YOUR BATTLE AWAITS' : 'JOIN THE ARENA'}</p>
          <h2>{isLogin ? 'WELCOME BACK' : 'CREATE YOUR ACCOUNT'}</h2>
          <p>{isLogin ? 'Ready for your battle?' : 'Start learning. Start competing. Start leveling up.'}</p>
        </div>

        <form noValidate onSubmit={handleSubmit}>
          {!isLogin && <AuthField autoComplete="name" error={errors.name} id="name" label="Full Name" name="name" onChange={handleChange} placeholder="Enter your full name" value={values.name} />}
          <AuthField autoComplete="email" error={errors.email} id="email" label="Email" name="email" onChange={handleChange} placeholder="you@example.com" type="email" value={values.email} />
          <AuthField autoComplete={isLogin ? 'current-password' : 'new-password'} error={errors.password} id="password" label="Password" name="password" onChange={handleChange} placeholder="Enter your password" type="password" value={values.password} />
          {!isLogin && <AuthField autoComplete="new-password" error={errors.confirmPassword} id="confirmPassword" label="Confirm Password" name="confirmPassword" onChange={handleChange} placeholder="Confirm your password" type="password" value={values.confirmPassword} />}

          {isLogin && <button className="auth-card__forgot" type="button">Forgot password?</button>}
          {notice && <p className="auth-card__notice" role="status">{notice}</p>}
          <button className="auth-card__submit" type="submit">{isLogin ? 'LOGIN' : 'CREATE ACCOUNT'}</button>
        </form>

        <p className="auth-card__switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => switchMode(isLogin ? 'signup' : 'login')} type="button">
            {isLogin ? 'CREATE ACCOUNT' : 'LOGIN'}
          </button>
        </p>
      </div>
    </section>
  )
}

export default AuthPage
