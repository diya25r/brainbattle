import mongoose from 'mongoose'
import Question from '../models/Question.js'

export const subjectTopics = {
  Java: ['Basics', 'OOP', 'Arrays'],
  DBMS: ['SQL', 'Normalization', 'Keys'],
  'Web Development': ['HTML', 'CSS', 'JavaScript'],
  Aptitude: ['Percentages', 'Ratios', 'Number Problems'],
}

const difficulties = ['Easy', 'Medium', 'Hard']
const battleFields = '_id subject topic difficulty question options'

function validateQuestionInput(body) {
  const { subject, topic, difficulty, question, options, correctAnswer } = body
  if (!subjectTopics[subject]) return 'Please provide a valid subject.'
  if (!subjectTopics[subject].includes(topic)) return 'Please provide a topic valid for the selected subject.'
  if (!difficulties.includes(difficulty)) return 'Please provide a valid difficulty.'
  if (!question?.trim()) return 'Question text is required.'
  if (!Array.isArray(options) || options.length !== 4 || options.some((option) => typeof option !== 'string' || !option.trim())) return 'Exactly four non-empty options are required.'
  if (!correctAnswer?.trim() || !options.includes(correctAnswer)) return 'Correct answer must match one of the options.'
  return null
}

export async function createQuestion(request, response, next) {
  try {
    const validationError = validateQuestionInput(request.body)
    if (validationError) return response.status(400).json({ success: false, message: validationError })
    const question = await Question.create(request.body)
    return response.status(201).json({ success: true, question })
  } catch (error) {
    return next(error)
  }
}

export async function getQuestions(_request, response, next) {
  try {
    const questions = await Question.find().sort({ subject: 1, topic: 1, createdAt: -1 })
    return response.status(200).json({ success: true, questions })
  } catch (error) {
    return next(error)
  }
}

export async function updateQuestion(request, response, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid question id.' })
    const validationError = validateQuestionInput(request.body)
    if (validationError) return response.status(400).json({ success: false, message: validationError })
    const question = await Question.findByIdAndUpdate(request.params.id, request.body, { new: true, runValidators: true })
    if (!question) return response.status(404).json({ success: false, message: 'Question not found.' })
    return response.status(200).json({ success: true, question })
  } catch (error) {
    return next(error)
  }
}

export async function deleteQuestion(request, response, next) {
  try {
    if (!mongoose.isObjectIdOrHexString(request.params.id)) return response.status(400).json({ success: false, message: 'Invalid question id.' })
    const question = await Question.findByIdAndDelete(request.params.id)
    if (!question) return response.status(404).json({ success: false, message: 'Question not found.' })
    return response.status(200).json({ success: true, message: 'Question deleted.' })
  } catch (error) {
    return next(error)
  }
}

export async function getBattleQuestions(request, response, next) {
  try {
    const { subject, topic, difficulty, limit: limitValue } = request.query
    const limit = Number(limitValue)
    if (!subjectTopics[subject] || !subjectTopics[subject].includes(topic) || !difficulties.includes(difficulty) || !Number.isInteger(limit) || limit < 1 || limit > 20) {
      return response.status(400).json({ success: false, message: 'Choose a valid subject, topic, difficulty, and question limit between 1 and 20.' })
    }

    const filter = { subject, topic, difficulty }
    const available = await Question.countDocuments(filter)
    if (available < limit) {
      return response.status(422).json({ success: false, message: `Only ${available} matching questions are available. Please choose another setup or a smaller number.`, available })
    }

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
      { $project: { subject: 1, topic: 1, difficulty: 1, question: 1, options: 1 } },
    ])
    return response.status(200).json({ success: true, questions })
  } catch (error) {
    return next(error)
  }
}

export { battleFields }
