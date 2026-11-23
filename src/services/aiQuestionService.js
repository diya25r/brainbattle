
import Question from '../../backend/models/Question.js'
export async function generateAIQuestions(subject, topic, count) {
  // 1. Get existing questions to help prevent duplicates
  const existingQuestions = await Question.find({
    subject,
    topic,
  })
    .select('question -_id')
    .lean()

  const existingQuestionTexts = existingQuestions.map(
    (q) => q.question,
  )

  // 2. Design the AI prompt
  const prompt = `
ROLE:
You are an expert question setter for BrainBattle,
an educational quiz and multiplayer battle platform.

TASK:
Generate exactly ${count} multiple-choice questions.

INPUT PARAMETERS:
Subject: ${subject}
Topic: ${topic}
Number of questions: ${count}

RELEVANCE:
- Every question must belong to the selected subject and topic.
- Do not include unrelated concepts.
- Use accurate concepts and terminology.

DIFFICULTY:
- Include easy, medium and hard questions.
- Easy questions should test basic understanding.
- Medium questions should test application of concepts.
- Hard questions should require reasoning and problem-solving.
- Aim for approximately 20% easy, 50% medium and 30% hard.
- Adjust the distribution sensibly for small question counts.

DIVERSITY:
- Do not repeat the same concept or question.
- Include conceptual questions.
- Include scenario-based questions.
- Include practical problem-solving questions.
- Include code-based or output-prediction questions
  when appropriate for the subject.
- Cover different aspects of the selected topic.

QUALITY:
- Every question must be clear and unambiguous.
- Provide exactly four meaningful answer options.
- Only one option must be correct.
- Incorrect options should be plausible but clearly wrong.
- The correct answer must be factually accurate.
- Avoid giving away the answer through the wording.

EXISTING QUESTION COLLECTION:
Avoid repeating or closely rephrasing these questions:
${existingQuestionTexts.length
    ? existingQuestionTexts.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : 'No existing questions available.'}

OUTPUT FORMAT:
Return valid JSON only, without markdown.

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Exact correct option"
    }
  ]
}

FINAL CHECK:
- Generate exactly ${count} questions.
- Ensure all questions match the subject and topic.
- Ensure variety in difficulty and question style.
- Do not repeat questions.
- Include exactly four options per question.
- Ensure exactly one correct answer.
- Ensure correctAnswer matches one of the options.
`

  // 3. Send the prompt to Google's Gemini API
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      }),
    },
  )

  // 4. Handle API errors
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  // 5. Read the AI response
  const data = await response.json()

  const generatedText = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')

  if (!generatedText) {
    throw new Error('Gemini returned an empty response.')
  }

  // 6. Convert JSON text into a JavaScript object
  let result

  try {
    result = JSON.parse(generatedText)
  } catch {
    throw new Error('Gemini returned invalid JSON.')
  }

  // 7. Validate the generated questions
  if (
    !Array.isArray(result.questions) ||
    result.questions.length !== count
  ) {
    throw new Error('Gemini generated an incorrect number of questions.')
  }

  const seenQuestions = new Set(
    existingQuestionTexts.map((q) => q.trim().toLowerCase()),
  )

  for (const question of result.questions) {
    if (
      typeof question.question !== 'string' ||
      !question.question.trim() ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      question.options.some(
        (option) =>
          typeof option !== 'string' || !option.trim(),
      ) ||
      typeof question.correctAnswer !== 'string' ||
      !question.options.includes(question.correctAnswer)
    ) {
      throw new Error('Gemini generated an invalid question.')
    }

    // Check for duplicate questions
    const normalizedQuestion = question.question
      .trim()
      .toLowerCase()

    if (seenQuestions.has(normalizedQuestion)) {
      throw new Error('Gemini generated a duplicate question.')
    }

    seenQuestions.add(normalizedQuestion)
  }

  // 8. Return validated questions to the controller
  return result.questions
}
