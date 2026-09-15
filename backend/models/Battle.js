import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  answer: { type: String, required: true, trim: true },
  isCorrect: { type: Boolean, required: true },
  answeredAt: { type: Date, default: Date.now },
}, { _id: false })

const battleSchema = new mongoose.Schema({
  battleCode: { type: String, required: true, unique: true, index: true, sparse: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }],
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  questionCount: { type: Number, required: true, min: 1, max: 20 },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  creatorAnswers: { type: [answerSchema], default: [] },
  opponentAnswers: { type: [answerSchema], default: [] },
  creatorSubmittedAt: { type: Date, default: null },
  opponentSubmittedAt: { type: Date, default: null },
  creatorScore: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt: { type: Date, default: null },
  rewardsGranted: { type: Boolean, default: false },
  creatorXpEarned: { type: Number, default: 0 },
  opponentXpEarned: { type: Number, default: 0 },
}, { timestamps: true })

battleSchema.index({ status: 1, completedAt: -1 })
battleSchema.index({ creator: 1, status: 1, completedAt: -1 })
battleSchema.index({ opponent: 1, status: 1, completedAt: -1 })

const Battle = mongoose.model('Battle', battleSchema)

export default Battle
