import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const battleSubmissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: [answerSchema], required: true },
  },
  { timestamps: true },
)

const BattleSubmission = mongoose.model('BattleSubmission', battleSubmissionSchema)

export default BattleSubmission
