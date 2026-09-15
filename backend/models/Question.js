import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) => Array.isArray(options) && options.length === 4 && options.every((option) => typeof option === 'string' && option.trim()),
        message: 'A question must have exactly four non-empty options.',
      },
    },
    correctAnswer: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

questionSchema.pre('validate', function validateCorrectAnswer() {
  if (this.options?.length === 4 && !this.options.includes(this.correctAnswer)) {
    this.invalidate('correctAnswer', 'Correct answer must be one of the four options.')
  }
})

const Question = mongoose.model('Question', questionSchema)

export default Question
