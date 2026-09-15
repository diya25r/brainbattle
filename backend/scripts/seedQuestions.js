import dotenv from 'dotenv'
import mongoose from 'mongoose'
import questions from '../../brainbattle_200_questions.js'
import connectDatabase from '../config/db.js'
import Question from '../models/Question.js'

dotenv.config()

const expectedTopics = {
  Java: ['Basics', 'OOP', 'Arrays', 'Strings', 'Collections'],
  DBMS: ['SQL', 'Keys', 'Normalization', 'Transactions', 'Joins'],
  'Web Development': ['HTML', 'CSS', 'JavaScript', 'HTTP', 'REST APIs'],
  Aptitude: ['Percentages', 'Profit & Loss', 'Ratio', 'Time & Work', 'Probability'],
}
const expectedFields = ['subject', 'topic', 'question', 'options', 'correctAnswer']

function validateQuestionBank(bank) {
  const subjectCounts = Object.fromEntries(Object.keys(expectedTopics).map((subject) => [subject, bank.filter((item) => item.subject === subject).length]))
  const topicCounts = Object.fromEntries(Object.entries(expectedTopics).flatMap(([subject, topics]) => topics.map((topic) => [`${subject} / ${topic}`, bank.filter((item) => item.subject === subject && item.topic === topic).length])))
  const invalidQuestions = bank.filter((item) => Object.keys(item).length !== expectedFields.length || expectedFields.some((field) => !(field in item)) || item.options.length !== 4 || !item.options.includes(item.correctAnswer) || 'difficulty' in item)
  const duplicates = bank.length - new Set(bank.map((item) => item.question)).size
  const valid = bank.length === 200 && Object.values(subjectCounts).every((count) => count === 50) && Object.values(topicCounts).every((count) => count === 10) && invalidQuestions.length === 0 && duplicates === 0

  const results = { total: bank.length, subjectCounts, topicCounts, invalidQuestions: invalidQuestions.length, duplicateQuestions: duplicates, valid }
  console.log('Question-bank validation:', JSON.stringify(results, null, 2))
  if (!valid) throw new Error('Question-bank validation failed; the questions collection was not changed.')
  return results
}

async function seed() {
  validateQuestionBank(questions)
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured before seeding questions.')

  await connectDatabase()
  await Question.deleteMany({})
  const result = await Question.collection.insertMany(questions, { ordered: true })
  const total = await Question.countDocuments()

  if (total !== 200 || result.insertedCount !== 200) throw new Error(`Question insert verification failed: inserted ${result.insertedCount}, found ${total}.`)
  console.log(`Inserted ${result.insertedCount} questions. Total questions in collection: ${total}.`)
}

seed()
  .catch((error) => { console.error('Question seed failed:', error.message); process.exitCode = 1 })
  .finally(async () => { if (mongoose.connection.readyState !== 0) await mongoose.disconnect() })
