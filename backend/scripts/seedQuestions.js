import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDatabase from '../config/db.js'
import Question from '../models/Question.js'
import User from '../models/User.js'

dotenv.config()

const question = (subject, topic, difficulty, text, options, correctAnswer) => ({ subject, topic, difficulty, question: text, options, correctAnswer })

const questions = [
  question('Java', 'Basics', 'Easy', 'Which keyword creates an object in Java?', ['new', 'class', 'static', 'void'], 'new'),
  question('Java', 'Basics', 'Easy', 'Which method is the entry point of a Java application?', ['main', 'start', 'run', 'init'], 'main'),
  question('Java', 'Basics', 'Easy', 'Which primitive type stores true or false?', ['boolean', 'char', 'int', 'String'], 'boolean'),
  question('Java', 'Basics', 'Easy', 'Which symbol ends a Java statement?', [';', ':', '.', ','], ';'),
  question('Java', 'Basics', 'Easy', 'Which keyword declares a class?', ['class', 'object', 'define', 'struct'], 'class'),
  question('Java', 'OOP', 'Medium', 'Which OOP feature lets a child class reuse a parent class?', ['Inheritance', 'Encapsulation', 'Overloading', 'Casting'], 'Inheritance'),
  question('Java', 'OOP', 'Medium', 'Which concept hides an object\'s internal details behind methods?', ['Encapsulation', 'Inheritance', 'Compilation', 'Indexing'], 'Encapsulation'),
  question('Java', 'OOP', 'Medium', 'What is it called when one method name has different parameter lists?', ['Method overloading', 'Method hiding', 'Garbage collection', 'Serialization'], 'Method overloading'),
  question('Java', 'OOP', 'Medium', 'Which keyword prevents a class from being inherited?', ['final', 'static', 'private', 'abstract'], 'final'),
  question('Java', 'OOP', 'Medium', 'What does polymorphism allow an object reference to do?', ['Refer to different object types', 'Store only strings', 'Avoid constructors', 'Skip compilation'], 'Refer to different object types'),
  question('Java', 'Arrays', 'Hard', 'What is the first valid index of a Java array?', ['0', '1', '-1', 'It depends on the type'], '0'),

  question('DBMS', 'SQL', 'Easy', 'Which SQL command retrieves rows from a table?', ['SELECT', 'INSERT', 'UPDATE', 'DELETE'], 'SELECT'),
  question('DBMS', 'SQL', 'Easy', 'Which clause filters rows in a SELECT query?', ['WHERE', 'ORDER BY', 'GROUP BY', 'JOIN'], 'WHERE'),
  question('DBMS', 'SQL', 'Easy', 'Which command adds a new row to a table?', ['INSERT', 'ALTER', 'DROP', 'GRANT'], 'INSERT'),
  question('DBMS', 'SQL', 'Easy', 'Which SQL command changes existing data?', ['UPDATE', 'CREATE', 'SELECT', 'COMMIT'], 'UPDATE'),
  question('DBMS', 'SQL', 'Easy', 'Which clause sorts query results?', ['ORDER BY', 'HAVING', 'VALUES', 'FROM'], 'ORDER BY'),
  question('DBMS', 'Normalization', 'Medium', 'Which normal form removes partial dependency?', ['Second normal form', 'First normal form', 'Third normal form', 'Boyce-Codd normal form'], 'Second normal form'),
  question('DBMS', 'Keys', 'Hard', 'Which key uniquely identifies each row in a table?', ['Primary key', 'Foreign key', 'Composite key', 'Candidate attribute'], 'Primary key'),

  question('Web Development', 'HTML', 'Easy', 'Which HTML element creates a hyperlink?', ['a', 'link', 'href', 'url'], 'a'),
  question('Web Development', 'HTML', 'Easy', 'Which HTML element is used for the largest heading?', ['h1', 'head', 'header', 'title'], 'h1'),
  question('Web Development', 'HTML', 'Easy', 'Which attribute provides alternative text for an image?', ['alt', 'src', 'title', 'href'], 'alt'),
  question('Web Development', 'HTML', 'Easy', 'Which element creates an unordered list?', ['ul', 'ol', 'li', 'list'], 'ul'),
  question('Web Development', 'HTML', 'Easy', 'Which HTML element creates a paragraph?', ['p', 'para', 'text', 'article'], 'p'),
  question('Web Development', 'CSS', 'Medium', 'Which CSS property changes text color?', ['color', 'font-color', 'text-style', 'background'], 'color'),
  question('Web Development', 'JavaScript', 'Hard', 'Which keyword creates a block-scoped variable?', ['let', 'var', 'function', 'this'], 'let'),

  question('Aptitude', 'Percentages', 'Easy', 'What is 25% of 200?', ['50', '25', '75', '100'], '50'),
  question('Aptitude', 'Percentages', 'Easy', 'A value increases from 80 to 100. What is the percentage increase?', ['25%', '20%', '15%', '80%'], '25%'),
  question('Aptitude', 'Percentages', 'Easy', 'What is 10% of 450?', ['45', '40', '50', '35'], '45'),
  question('Aptitude', 'Percentages', 'Easy', 'What is 50% of 86?', ['43', '36', '46', '50'], '43'),
  question('Aptitude', 'Percentages', 'Easy', 'A 20% discount on 500 gives which price?', ['400', '450', '480', '300'], '400'),
  question('Aptitude', 'Ratios', 'Medium', 'Simplify the ratio 12:18.', ['2:3', '3:2', '6:9', '4:6'], '2:3'),
  question('Aptitude', 'Number Problems', 'Hard', 'What is the next prime number after 29?', ['31', '30', '33', '35'], '31'),
]

async function seedAdmin() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NAME: name = 'BrainBattle Admin' } = process.env
  if (!email || !password) return
  if (password.length < 6) throw new Error('ADMIN_PASSWORD must be at least 6 characters long.')

  const normalizedEmail = email.trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail })
  if (existing) {
    existing.role = 'admin'
    await existing.save()
    return
  }

  await User.create({ name, email: normalizedEmail, password: await bcrypt.hash(password, 12), role: 'admin' })
}

async function seed() {
  await connectDatabase()
  const texts = questions.map(({ question: text }) => text)
  await Question.deleteMany({ question: { $in: texts } })
  await Question.insertMany(questions)
  await seedAdmin()
  console.log(`Seeded ${questions.length} sample questions.`)
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) console.log('No admin user was created. Set ADMIN_EMAIL and ADMIN_PASSWORD to create or promote one.')
}

seed()
  .catch((error) => { console.error('Question seed failed:', error.message); process.exitCode = 1 })
  .finally(async () => { await mongoose.disconnect() })
