import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDatabase from '../config/db.js'
import Question from '../models/Question.js'
import User from '../models/User.js'

dotenv.config()

const question = (subject, topic, difficulty, text, options, correctAnswer) => ({ subject, topic, difficulty, question: text, options, correctAnswer })

const baseQuestions = [
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

const additionalQuestions = [
  ['Java', 'Basics', 'Easy', 'Which data type stores a 64-bit whole number in Java?', ['long', 'int', 'short', 'byte'], 'long'],
  ['Java', 'Basics', 'Easy', 'What is the default value of an instance boolean field?', ['false', 'true', 'null', '0'], 'false'],
  ['Java', 'Basics', 'Easy', 'Which operator compares two primitive values for equality?', ['==', '=', '!=', '&&'], '=='],
  ['Java', 'Basics', 'Easy', 'What is printed by System.out.println(7 % 3)?', ['1', '2', '3', '0'], '1'],
  ['Java', 'Basics', 'Medium', 'What is printed by int x = 4; System.out.println(++x);?', ['5', '4', '3', 'Compilation error'], '5'],
  ['Java', 'Basics', 'Medium', 'Which statement exits a loop immediately?', ['break', 'continue', 'return false', 'skip'], 'break'],
  ['Java', 'Basics', 'Medium', 'Which loop always runs its body at least once?', ['do-while', 'for', 'while', 'enhanced for'], 'do-while'],
  ['Java', 'Basics', 'Medium', 'Which keyword is used to handle one alternative condition?', ['else', 'catch', 'case', 'finally'], 'else'],
  ['Java', 'Basics', 'Hard', 'What is printed by System.out.println(2 + 3 + "4")?', ['54', '234', '9', '45'], '54'],
  ['Java', 'Basics', 'Hard', 'What is printed by System.out.println("4" + 2 * 3)?', ['46', '24', '12', '10'], '46'],
  ['Java', 'Basics', 'Hard', 'Which statement about local variables is correct?', ['They must be initialized before use', 'They default to zero', 'They are always public', 'They are stored in arrays'], 'They must be initialized before use'],
  ['Java', 'Basics', 'Hard', 'What does continue do inside a loop?', ['Skips to the next iteration', 'Ends the method', 'Exits the program', 'Repeats the same iteration'], 'Skips to the next iteration'],
  ['Java', 'Arrays', 'Easy', 'Which property gives the number of elements in an array?', ['length', 'size()', 'count', 'capacity'], 'length'],
  ['Java', 'Arrays', 'Easy', 'Which exception can occur when an array index is too large?', ['ArrayIndexOutOfBoundsException', 'NullPointerException', 'IOException', 'ClassCastException'], 'ArrayIndexOutOfBoundsException'],
  ['Java', 'Arrays', 'Easy', 'Which class is commonly used for mutable text?', ['StringBuilder', 'String', 'Character', 'Text'], 'StringBuilder'],
  ['Java', 'Arrays', 'Medium', 'What is printed by int[] a = {2, 4, 6}; System.out.println(a[1]);?', ['4', '2', '6', '1'], '4'],
  ['Java', 'Arrays', 'Medium', 'Which method compares String content?', ['equals', '==', 'compare', 'matchesOnly'], 'equals'],
  ['Java', 'Arrays', 'Medium', 'What does "Java".charAt(2) return?', ['v', 'a', 'J', '3'], 'v'],
  ['Java', 'Arrays', 'Medium', 'Which loop is convenient when only array values are needed?', ['enhanced for loop', 'do-while only', 'switch', 'try-catch'], 'enhanced for loop'],
  ['Java', 'Arrays', 'Hard', 'What is printed by int[] a = new int[3]; System.out.println(a[2]);?', ['0', 'null', '3', 'Compilation error'], '0'],
  ['Java', 'Arrays', 'Hard', 'What is the result of "cat".substring(1)?', ['at', 'ca', 'c', 'cat'], 'at'],
  ['Java', 'OOP', 'Easy', 'Which special method initializes a new object?', ['Constructor', 'Getter', 'Iterator', 'Destructor'], 'Constructor'],
  ['Java', 'OOP', 'Easy', 'Which access modifier limits access to the same class?', ['private', 'public', 'protected', 'static'], 'private'],
  ['Java', 'OOP', 'Medium', 'Which keyword refers to the current object?', ['this', 'super', 'self', 'current'], 'this'],
  ['Java', 'OOP', 'Medium', 'Which keyword calls a parent constructor?', ['super', 'this', 'extends', 'implements'], 'super'],
  ['Java', 'OOP', 'Medium', 'Which keyword declares a class that cannot be instantiated?', ['abstract', 'final', 'static', 'private'], 'abstract'],
  ['Java', 'OOP', 'Hard', 'Which collection does not allow duplicate elements?', ['Set', 'List', 'ArrayList', 'Queue'], 'Set'],
  ['Java', 'OOP', 'Hard', 'Which block runs whether or not an exception occurs?', ['finally', 'try', 'catch', 'throw'], 'finally'],
  ['Java', 'OOP', 'Hard', 'What is method overriding?', ['A subclass provides a new implementation with the same signature', 'Two methods have different parameters', 'A method is made static', 'A field is hidden'], 'A subclass provides a new implementation with the same signature'],

  ['DBMS', 'SQL', 'Easy', 'Which clause specifies the table in a SELECT statement?', ['FROM', 'WHERE', 'INTO', 'SET'], 'FROM'],
  ['DBMS', 'SQL', 'Easy', 'Which aggregate function counts rows?', ['COUNT', 'SUM', 'TOTAL', 'NUMBER'], 'COUNT'],
  ['DBMS', 'SQL', 'Easy', 'Which command permanently removes a table definition?', ['DROP TABLE', 'DELETE FROM', 'REMOVE TABLE', 'CLEAR TABLE'], 'DROP TABLE'],
  ['DBMS', 'SQL', 'Easy', 'Which SQL keyword removes duplicate result rows?', ['DISTINCT', 'UNIQUE', 'SINGLE', 'FILTER'], 'DISTINCT'],
  ['DBMS', 'SQL', 'Medium', 'Which clause filters groups after GROUP BY?', ['HAVING', 'WHERE', 'ORDER BY', 'FROM'], 'HAVING'],
  ['DBMS', 'SQL', 'Medium', 'Which join returns only matching rows from both tables?', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'], 'INNER JOIN'],
  ['DBMS', 'SQL', 'Medium', 'What does SELECT * FROM Students WHERE marks >= 50 do?', ['Returns students with marks at least 50', 'Deletes failing students', 'Sorts marks descending', 'Counts all students'], 'Returns students with marks at least 50'],
  ['DBMS', 'SQL', 'Medium', 'Which command makes a transaction permanent?', ['COMMIT', 'ROLLBACK', 'SAVEPOINT', 'GRANT'], 'COMMIT'],
  ['DBMS', 'SQL', 'Hard', 'Which join keeps every row from the left table?', ['LEFT JOIN', 'INNER JOIN', 'RIGHT JOIN', 'SELF JOIN'], 'LEFT JOIN'],
  ['DBMS', 'SQL', 'Hard', 'Which constraint prevents NULL values in a column?', ['NOT NULL', 'UNIQUE', 'CHECK', 'DEFAULT'], 'NOT NULL'],
  ['DBMS', 'SQL', 'Hard', 'What does AVG ignore in most SQL databases?', ['NULL values', 'Zero values', 'Negative values', 'Duplicate rows'], 'NULL values'],
  ['DBMS', 'SQL', 'Hard', 'Which statement is used to change a table structure?', ['ALTER TABLE', 'UPDATE TABLE', 'MODIFY ROW', 'CHANGE TABLE'], 'ALTER TABLE'],
  ['DBMS', 'Keys', 'Easy', 'A foreign key usually references which key in another table?', ['Primary key', 'Alternate key', 'Index key', 'Composite key only'], 'Primary key'],
  ['DBMS', 'Keys', 'Easy', 'Which key can be chosen as a primary key?', ['Candidate key', 'Foreign key', 'Duplicate key', 'Partial key only'], 'Candidate key'],
  ['DBMS', 'Keys', 'Easy', 'Can a primary key contain NULL?', ['No', 'Yes, always', 'Only twice', 'Only in a view'], 'No'],
  ['DBMS', 'Keys', 'Medium', 'A key made from more than one attribute is called what?', ['Composite key', 'Foreign key', 'Weak key', 'Surrogate query'], 'Composite key'],
  ['DBMS', 'Keys', 'Medium', 'What is a super key?', ['Any attribute set that uniquely identifies a row', 'A key from another database', 'A key with one attribute only', 'A sorted index'], 'Any attribute set that uniquely identifies a row'],
  ['DBMS', 'Keys', 'Medium', 'Which constraint prevents duplicate non-NULL values?', ['UNIQUE', 'NOT NULL', 'CHECK', 'DEFAULT'], 'UNIQUE'],
  ['DBMS', 'Keys', 'Hard', 'Which relationship needs a junction table in a relational design?', ['Many-to-many', 'One-to-one', 'Unary only', 'None'], 'Many-to-many'],
  ['DBMS', 'Keys', 'Hard', 'What is a surrogate key?', ['An artificial identifier with no business meaning', 'A foreign key from a parent', 'A repeated natural key', 'A key that allows NULL'], 'An artificial identifier with no business meaning'],
  ['DBMS', 'Normalization', 'Easy', 'What is the main goal of normalization?', ['Reduce redundant data', 'Increase duplicate rows', 'Remove all keys', 'Avoid SQL'], 'Reduce redundant data'],
  ['DBMS', 'Normalization', 'Easy', 'Which normal form requires atomic column values?', ['First normal form', 'Second normal form', 'Third normal form', 'Fourth normal form'], 'First normal form'],
  ['DBMS', 'Normalization', 'Medium', 'Which normal form removes transitive dependency?', ['Third normal form', 'First normal form', 'Second normal form', 'Zero normal form'], 'Third normal form'],
  ['DBMS', 'Normalization', 'Medium', 'Which ACID property means a transaction is all-or-nothing?', ['Atomicity', 'Consistency', 'Isolation', 'Durability'], 'Atomicity'],
  ['DBMS', 'Normalization', 'Medium', 'Which ACID property keeps committed data after a crash?', ['Durability', 'Atomicity', 'Isolation', 'Redundancy'], 'Durability'],
  ['DBMS', 'Normalization', 'Hard', 'What does an index primarily improve?', ['Query lookup speed', 'Data duplication', 'Password security', 'Number of columns'], 'Query lookup speed'],
  ['DBMS', 'Normalization', 'Hard', 'In an ER diagram, a rectangle represents what?', ['Entity', 'Relationship', 'Attribute', 'Key value'], 'Entity'],
  ['DBMS', 'Normalization', 'Hard', 'Which ACID property prevents interfering concurrent transactions?', ['Isolation', 'Atomicity', 'Consistency', 'Durability'], 'Isolation'],

  ['Web Development', 'HTML', 'Easy', 'Which HTML element contains metadata not displayed in the page body?', ['head', 'body', 'main', 'footer'], 'head'],
  ['Web Development', 'HTML', 'Easy', 'Which input type hides typed characters?', ['password', 'hidden', 'secret', 'private'], 'password'],
  ['Web Development', 'HTML', 'Easy', 'Which semantic element represents primary page content?', ['main', 'div', 'span', 'b'], 'main'],
  ['Web Development', 'HTML', 'Easy', 'Which attribute connects a label to an input?', ['for', 'name', 'value', 'action'], 'for'],
  ['Web Development', 'HTML', 'Medium', 'Which element is best for independent self-contained content?', ['article', 'div', 'br', 'em'], 'article'],
  ['Web Development', 'HTML', 'Medium', 'Which form method usually sends data in the request body?', ['POST', 'GET', 'LINK', 'FETCH'], 'POST'],
  ['Web Development', 'HTML', 'Medium', 'Which HTML attribute makes a form control mandatory?', ['required', 'needed', 'validate', 'checked'], 'required'],
  ['Web Development', 'HTML', 'Hard', 'Which status code means a requested resource was not found?', ['404', '200', '201', '500'], '404'],
  ['Web Development', 'HTML', 'Hard', 'Which HTTP method is commonly used to replace a resource?', ['PUT', 'GET', 'DELETE', 'HEAD'], 'PUT'],
  ['Web Development', 'CSS', 'Easy', 'Which CSS property adds space inside an element border?', ['padding', 'margin', 'gap', 'outline'], 'padding'],
  ['Web Development', 'CSS', 'Easy', 'Which selector targets an element with id="menu"?', ['#menu', '.menu', 'menu()', '*menu'], '#menu'],
  ['Web Development', 'CSS', 'Easy', 'Which property makes text bold?', ['font-weight', 'text-bold', 'font-style', 'weight'], 'font-weight'],
  ['Web Development', 'CSS', 'Medium', 'Which Flexbox property aligns items along the main axis?', ['justify-content', 'align-items', 'flex-wrap', 'position'], 'justify-content'],
  ['Web Development', 'CSS', 'Medium', 'Which CSS unit is relative to the root font size?', ['rem', 'px', 'cm', 'pt'], 'rem'],
  ['Web Development', 'CSS', 'Medium', 'Which property creates a Grid layout?', ['display: grid', 'position: grid', 'layout: grid', 'grid: true'], 'display: grid'],
  ['Web Development', 'CSS', 'Medium', 'What does box-sizing: border-box include in width?', ['Padding and border', 'Only content', 'Only margin', 'Only outline'], 'Padding and border'],
  ['Web Development', 'CSS', 'Hard', 'Which media query feature is commonly used for responsive widths?', ['max-width', 'font-family', 'z-index', 'opacity'], 'max-width'],
  ['Web Development', 'CSS', 'Hard', 'Which selector has the highest specificity?', ['#header', '.header', 'header', '*'], '#header'],
  ['Web Development', 'CSS', 'Hard', 'What does position: fixed position an element relative to?', ['The viewport', 'Its parent only', 'The document flow only', 'The nearest grid item'], 'The viewport'],
  ['Web Development', 'JavaScript', 'Easy', 'Which method converts JSON text to a JavaScript value?', ['JSON.parse', 'JSON.stringify', 'parseJSON', 'toJSON'], 'JSON.parse'],
  ['Web Development', 'JavaScript', 'Easy', 'Which event occurs when a user clicks a button?', ['click', 'change', 'load', 'submitOnly'], 'click'],
  ['Web Development', 'JavaScript', 'Easy', 'What does typeof 42 return?', ['number', 'integer', 'numeric', 'float'], 'number'],
  ['Web Development', 'JavaScript', 'Medium', 'Which method adds an item to the end of an array?', ['push', 'pop', 'shift', 'slice'], 'push'],
  ['Web Development', 'JavaScript', 'Medium', 'What does document.querySelector return?', ['The first matching element', 'All matching elements always', 'A JSON string', 'A CSS rule'], 'The first matching element'],
  ['Web Development', 'JavaScript', 'Medium', 'What is printed by console.log(3 === "3")?', ['false', 'true', '3', 'Error'], 'false'],
  ['Web Development', 'JavaScript', 'Hard', 'What does await do inside an async function?', ['Waits for a Promise to settle', 'Creates a class', 'Stops the browser forever', 'Converts JSON to CSS'], 'Waits for a Promise to settle'],
  ['Web Development', 'JavaScript', 'Hard', 'Which Promise method handles a rejected Promise?', ['catch', 'then', 'finallyOnly', 'resolve'], 'catch'],
  ['Web Development', 'JavaScript', 'Hard', 'Which status code usually means successful resource creation?', ['201', '200', '204', '400'], '201'],

  ['Aptitude', 'Percentages', 'Easy', 'What is 15% of 300?', ['45', '30', '60', '15'], '45'],
  ['Aptitude', 'Percentages', 'Easy', 'A shirt costs 800 and has a 25% discount. What is the sale price?', ['600', '650', '700', '750'], '600'],
  ['Aptitude', 'Percentages', 'Easy', 'What percentage of 80 is 20?', ['25%', '20%', '40%', '50%'], '25%'],
  ['Aptitude', 'Percentages', 'Medium', 'A price rises by 10% then falls by 10%. Compared with the original, it is?', ['1% lower', 'Unchanged', '1% higher', '10% lower'], '1% lower'],
  ['Aptitude', 'Percentages', 'Medium', 'If 40% of a number is 72, what is the number?', ['180', '144', '288', '112'], '180'],
  ['Aptitude', 'Percentages', 'Medium', 'A population of 2000 grows by 5%. What is the new population?', ['2100', '2050', '2200', '2150'], '2100'],
  ['Aptitude', 'Percentages', 'Hard', 'A number is increased by 20% and becomes 360. What was it?', ['300', '320', '280', '432'], '300'],
  ['Aptitude', 'Percentages', 'Hard', 'Successive discounts of 20% and 10% equal one discount of?', ['28%', '30%', '18%', '32%'], '28%'],
  ['Aptitude', 'Ratios', 'Easy', 'Divide 60 in the ratio 2:3. What is the smaller share?', ['24', '20', '30', '36'], '24'],
  ['Aptitude', 'Ratios', 'Easy', 'If boys:girls is 3:2 and there are 15 boys, how many girls are there?', ['10', '8', '12', '15'], '10'],
  ['Aptitude', 'Ratios', 'Medium', 'The average of 10, 20 and 30 is?', ['20', '15', '30', '25'], '20'],
  ['Aptitude', 'Ratios', 'Medium', 'The average of five numbers is 18. Their total is?', ['90', '72', '23', '18'], '90'],
  ['Aptitude', 'Ratios', 'Medium', 'If A:B = 4:5 and B:C = 10:7, then A:C is?', ['8:7', '4:7', '5:7', '8:5'], '8:7'],
  ['Aptitude', 'Ratios', 'Hard', 'A sum is shared by A and B in ratio 5:7. If B gets 420, total is?', ['720', '600', '840', '350'], '720'],
  ['Aptitude', 'Ratios', 'Hard', 'A recipe uses flour:sugar = 5:2. For 350 g flour, sugar needed is?', ['140 g', '100 g', '175 g', '70 g'], '140 g'],
  ['Aptitude', 'Number Problems', 'Easy', 'What is the HCF of 12 and 18?', ['6', '3', '12', '36'], '6'],
  ['Aptitude', 'Number Problems', 'Easy', 'What is the LCM of 4 and 6?', ['12', '10', '24', '2'], '12'],
  ['Aptitude', 'Number Problems', 'Easy', 'What is the next number: 2, 4, 8, 16, ?', ['32', '24', '20', '18'], '32'],
  ['Aptitude', 'Number Problems', 'Medium', 'A train travels 120 km in 2 hours. Its speed is?', ['60 km/h', '240 km/h', '30 km/h', '122 km/h'], '60 km/h'],
  ['Aptitude', 'Number Problems', 'Medium', 'If 5 workers finish a job in 12 days, worker-days required are?', ['60', '17', '7', '120'], '60'],
  ['Aptitude', 'Number Problems', 'Medium', 'Simple interest on 1000 at 10% per year for 2 years is?', ['200', '100', '210', '1200'], '200'],
  ['Aptitude', 'Number Problems', 'Hard', 'Compound interest on 1000 at 10% per year for 2 years is?', ['210', '200', '220', '110'], '210'],
  ['Aptitude', 'Probability', 'Hard', 'A fair die is rolled once. Probability of an even number is?', ['1/2', '1/6', '1/3', '2/3'], '1/2'],
  ['Aptitude', 'Number Problems', 'Hard', 'How many ways can 3 distinct books be arranged?', ['6', '3', '9', '1'], '6'],
  ['Aptitude', 'Number Problems', 'Hard', 'A person walks 3 km north then 4 km east. How far from the start?', ['5 km', '7 km', '1 km', '12 km'], '5 km'],
  ['Aptitude', 'Number Problems', 'Easy', 'A father is 40 years old and his son is 10. What is their age ratio?', ['4:1', '3:1', '5:1', '2:1'], '4:1'],
  ['Aptitude', 'Number Problems', 'Medium', 'In a class, 18 of 30 students passed. What fraction passed?', ['3/5', '2/5', '1/2', '4/5'], '3/5'],
  ['Aptitude', 'Number Problems', 'Medium', 'What is the remainder when 47 is divided by 5?', ['2', '1', '3', '4'], '2'],
  ['Aptitude', 'Number Problems', 'Hard', 'A clock shows 3:00. What is the angle between its hands?', ['90 degrees', '60 degrees', '120 degrees', '30 degrees'], '90 degrees'],
  ['Aptitude', 'Number Problems', 'Hard', 'If SOUTH is coded as TPVUI, how is NORTH coded?', ['OPSUI', 'NPSUI', 'OPSTI', 'OQRUI'], 'OPSUI'],
  ['Aptitude', 'Number Problems', 'Easy', 'Which direction is opposite to east?', ['West', 'North', 'South', 'North-east'], 'West'],
  ['Aptitude', 'Number Problems', 'Medium', 'If today is Monday, what day will it be after 10 days?', ['Thursday', 'Wednesday', 'Friday', 'Saturday'], 'Thursday'],
  ['Aptitude', 'Probability', 'Hard', 'Two coins are tossed. What is the probability of getting two heads?', ['1/4', '1/2', '1/3', '3/4'], '1/4'],
  ['Java', 'OOP', 'Easy', 'Which keyword creates an interface in Java?', ['interface', 'implements', 'extends', 'abstract'], 'interface'],
  ['Java', 'OOP', 'Easy', 'Which access modifier makes a member available everywhere?', ['public', 'private', 'protected', 'final'], 'public'],
  ['Java', 'OOP', 'Easy', 'Which keyword implements an interface?', ['implements', 'extends', 'inherits', 'interface'], 'implements'],
  ['Java', 'Arrays', 'Medium', 'What is printed by int[] n = {1, 2}; System.out.println(n.length);?', ['2', '1', '0', '3'], '2'],
  ['Java', 'Basics', 'Hard', 'Which operator performs a logical AND on boolean values?', ['&&', '||', '!', '&='], '&&'],
  ['Java', 'Strings', 'Easy', 'Are String objects immutable in Java?', ['Yes', 'No', 'Only static strings are', 'Only empty strings are'], 'Yes'],
  ['Java', 'Strings', 'Medium', 'Which method returns the number of characters in a String?', ['length()', 'size()', 'count()', 'charAt()'], 'length()'],
  ['Java', 'Strings', 'Hard', 'What is printed by "abc".indexOf("b")?', ['1', '2', '0', '-1'], '1'],
  ['Java', 'Methods', 'Easy', 'What keyword is used when a method returns no value?', ['void', 'null', 'empty', 'return'], 'void'],
  ['Java', 'Methods', 'Medium', 'What is recursion?', ['A method calling itself', 'A class calling a constructor', 'An array loop', 'A caught exception'], 'A method calling itself'],
  ['Java', 'Methods', 'Hard', 'Which statement about method parameters is correct in Java?', ['Primitive values are passed by value', 'Objects are always passed by reference', 'Parameters must be static', 'Methods cannot have parameters'], 'Primitive values are passed by value'],
  ['Java', 'Inheritance', 'Easy', 'Which keyword establishes class inheritance?', ['extends', 'implements', 'inherits', 'super'], 'extends'],
  ['Java', 'Inheritance', 'Medium', 'Which modifier allows a child class in another package to access a member?', ['protected', 'private', 'final', 'local'], 'protected'],
  ['Java', 'Polymorphism', 'Medium', 'Which is an example of runtime polymorphism?', ['Method overriding', 'Method overloading', 'Constructor chaining', 'Field declaration'], 'Method overriding'],
  ['Java', 'Exception Handling', 'Easy', 'Which keyword manually raises an exception?', ['throw', 'throws', 'catch', 'finally'], 'throw'],
  ['Java', 'Exception Handling', 'Medium', 'Which block handles an exception?', ['catch', 'try', 'finally', 'throw'], 'catch'],
  ['Java', 'Collections', 'Easy', 'Which collection maintains insertion order and allows duplicates?', ['List', 'Set', 'Map', 'TreeSet'], 'List'],
  ['Java', 'Collections', 'Medium', 'Which collection stores key-value pairs?', ['Map', 'List', 'Set', 'Queue'], 'Map'],
  ['Java', 'Loops / Control Flow', 'Easy', 'Which loop is best when the number of repetitions is known?', ['for', 'while', 'do-while', 'switch'], 'for'],
  ['Java', 'Loops / Control Flow', 'Hard', 'What does a switch statement commonly use to select a branch?', ['case labels', 'array indexes', 'constructors', 'exceptions'], 'case labels'],

  ['DBMS', 'Normalization', 'Medium', 'A table with repeating groups violates which normal form?', ['First normal form', 'Second normal form', 'Third normal form', 'BCNF only'], 'First normal form'],
  ['DBMS', 'Normalization', 'Medium', 'A dependency of a non-key attribute on another non-key attribute is called?', ['Transitive dependency', 'Partial dependency', 'Full dependency', 'Join dependency'], 'Transitive dependency'],
  ['DBMS', 'Transactions', 'Hard', 'Which command undoes uncommitted transaction changes?', ['ROLLBACK', 'COMMIT', 'SELECT', 'GRANT'], 'ROLLBACK'],
  ['DBMS', 'Transactions', 'Hard', 'What is a SAVEPOINT used for?', ['Marking a point for partial rollback', 'Creating a table', 'Adding an index', 'Granting access'], 'Marking a point for partial rollback'],
  ['DBMS', 'Transactions', 'Hard', 'A transaction is a sequence of database operations treated as what?', ['One logical unit of work', 'A backup file', 'A user account', 'A table index'], 'One logical unit of work'],
  ['DBMS', 'Transactions', 'Hard', 'Which issue occurs when one transaction reads another uncommitted change?', ['Dirty read', 'Dead table', 'Primary conflict', 'Lost schema'], 'Dirty read'],
  ['DBMS', 'Transactions', 'Hard', 'Which command sets a point to which a transaction can roll back?', ['SAVEPOINT', 'COMMIT', 'BEGIN', 'LOCK'], 'SAVEPOINT'],
  ['DBMS', 'DBMS Basics', 'Easy', 'What does DBMS stand for?', ['Database Management System', 'Data Backup Memory System', 'Database Modeling Service', 'Digital Base Management Software'], 'Database Management System'],
  ['DBMS', 'DBMS Basics', 'Medium', 'Which is a benefit of a DBMS?', ['Reduced data redundancy', 'No data security', 'No data sharing', 'Mandatory duplicate data'], 'Reduced data redundancy'],
  ['DBMS', 'Relational Concepts', 'Easy', 'A row in a relational table is also called a?', ['Tuple', 'Attribute', 'Domain', 'Schema'], 'Tuple'],
  ['DBMS', 'Relational Concepts', 'Medium', 'A column in a relation is called an?', ['Attribute', 'Tuple', 'Record set', 'Transaction'], 'Attribute'],
  ['DBMS', 'ER Model', 'Easy', 'In an ER diagram, an oval represents an?', ['Attribute', 'Entity', 'Relationship', 'Table row'], 'Attribute'],
  ['DBMS', 'ER Model', 'Medium', 'A diamond in a traditional ER diagram represents a?', ['Relationship', 'Entity', 'Attribute', 'Primary key'], 'Relationship'],
  ['DBMS', 'ACID', 'Easy', 'Which ACID property ensures valid database rules are preserved?', ['Consistency', 'Isolation', 'Durability', 'Atomicity'], 'Consistency'],
  ['DBMS', 'ACID', 'Medium', 'Which ACID property makes concurrent transactions appear independent?', ['Isolation', 'Durability', 'Atomicity', 'Consistency'], 'Isolation'],
  ['DBMS', 'Joins', 'Easy', 'Which join returns matching rows only?', ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'], 'INNER JOIN'],
  ['DBMS', 'Joins', 'Medium', 'Which join includes unmatched rows from both tables when supported?', ['FULL OUTER JOIN', 'INNER JOIN', 'CROSS JOIN', 'SELF JOIN'], 'FULL OUTER JOIN'],
  ['DBMS', 'Indexing', 'Easy', 'What is the main trade-off of adding an index?', ['Faster reads but slower writes', 'Faster writes only', 'Less storage always', 'No effect on queries'], 'Faster reads but slower writes'],
  ['DBMS', 'Indexing', 'Medium', 'Which columns are good candidates for an index?', ['Frequently searched columns', 'Every text comment', 'Only NULL columns', 'Only foreign databases'], 'Frequently searched columns'],
  ['DBMS', 'SQL', 'Hard', 'Which clause limits the number of rows returned in many SQL dialects?', ['LIMIT', 'COUNT', 'HAVING', 'VALUES'], 'LIMIT'],
  ['DBMS', 'SQL', 'Hard', 'What does DELETE FROM Orders WHERE id = 5 remove?', ['The row whose id is 5', 'The Orders table', 'The id column', 'All databases'], 'The row whose id is 5'],
  ['DBMS', 'Keys', 'Medium', 'A minimal super key is known as a?', ['Candidate key', 'Foreign key', 'Duplicate key', 'Partial key'], 'Candidate key'],
  ['DBMS', 'Keys', 'Hard', 'Which key enforces referential integrity between tables?', ['Foreign key', 'Alternate key', 'Super key', 'Composite key'], 'Foreign key'],
  ['DBMS', 'Relational Concepts', 'Hard', 'What is the degree of a relation?', ['Number of attributes', 'Number of tuples', 'Number of databases', 'Number of keys'], 'Number of attributes'],
  ['DBMS', 'DBMS Basics', 'Hard', 'Which level of database abstraction describes the physical storage?', ['Internal level', 'External level', 'View level', 'Conceptual level'], 'Internal level'],

  ['Web Development', 'JavaScript', 'Easy', 'Which keyword declares a constant binding?', ['const', 'let', 'var', 'static'], 'const'],
  ['Web Development', 'JavaScript', 'Easy', 'Which method removes the last array item?', ['pop', 'push', 'shift', 'unshift'], 'pop'],
  ['Web Development', 'React', 'Medium', 'Which hook stores state in a function component?', ['useState', 'useEffect', 'useContext', 'useMemo'], 'useState'],
  ['Web Development', 'React', 'Medium', 'What must JSX lists usually provide for each item?', ['A stable key', 'A CSS id', 'A Promise', 'A reducer'], 'A stable key'],
  ['Web Development', 'React', 'Medium', 'Which hook runs side effects after rendering?', ['useEffect', 'useState', 'useRef only', 'useKey'], 'useEffect'],
  ['Web Development', 'React', 'Medium', 'Props in React are generally?', ['Read-only inputs to a component', 'Mutable database rows', 'Global CSS rules', 'HTTP status codes'], 'Read-only inputs to a component'],
  ['Web Development', 'React', 'Medium', 'What does a React component return?', ['UI description such as JSX', 'A SQL table', 'A CSS file only', 'A server port'], 'UI description such as JSX'],
  ['Web Development', 'HTTP', 'Hard', 'Which status code indicates an unauthorized request?', ['401', '403', '404', '500'], '401'],
  ['Web Development', 'HTTP', 'Hard', 'Which status code indicates an internal server error?', ['500', '400', '301', '204'], '500'],
  ['Web Development', 'HTTP', 'Hard', 'Which request header commonly describes the body format sent by a client?', ['Content-Type', 'Location', 'Host only', 'Referer only'], 'Content-Type'],
  ['Web Development', 'HTTP', 'Hard', 'Which HTTP method is intended to remove a resource?', ['DELETE', 'POST', 'PATCH', 'OPTIONS'], 'DELETE'],
  ['Web Development', 'HTTP', 'Hard', 'What does a 204 response indicate?', ['Success with no response body', 'Resource not found', 'Server error', 'Redirect required'], 'Success with no response body'],
  ['Web Development', 'DOM', 'Easy', 'What does DOM stand for?', ['Document Object Model', 'Data Object Method', 'Document Order Map', 'Dynamic Output Module'], 'Document Object Model'],
  ['Web Development', 'DOM', 'Medium', 'Which method attaches an event listener?', ['addEventListener', 'attachClick', 'onEventOnly', 'listenDOM'], 'addEventListener'],
  ['Web Development', 'REST APIs', 'Easy', 'REST APIs commonly exchange data in which format?', ['JSON', 'CSS', 'JPEG', 'SQL only'], 'JSON'],
  ['Web Development', 'REST APIs', 'Medium', 'Which HTTP method is commonly used for a partial resource update?', ['PATCH', 'GET', 'HEAD', 'OPTIONS'], 'PATCH'],
  ['Web Development', 'Node.js', 'Easy', 'Node.js primarily lets JavaScript run where?', ['On a server/runtime outside the browser', 'Only in CSS', 'Only in a database', 'Only in HTML'], 'On a server/runtime outside the browser'],
  ['Web Development', 'Node.js', 'Medium', 'Which Node.js module style is used by import statements?', ['ES modules', 'HTML modules', 'CSS modules only', 'SQL modules'], 'ES modules'],
  ['Web Development', 'Express', 'Easy', 'Express is commonly used to build what?', ['Web servers and APIs', 'Mobile hardware', 'Database engines', 'CSS preprocessors'], 'Web servers and APIs'],
  ['Web Development', 'Express', 'Medium', 'Which Express method registers a GET route?', ['app.get', 'app.post', 'app.useOnly', 'app.routeDelete'], 'app.get'],
  ['Web Development', 'Web Concepts', 'Easy', 'Which protocol is normally used for secure web traffic?', ['HTTPS', 'FTP', 'SMTP', 'SSH'], 'HTTPS'],
  ['Web Development', 'Web Concepts', 'Medium', 'What is a browser cookie commonly used for?', ['Storing small client-side data', 'Compiling JavaScript', 'Creating databases', 'Replacing HTTP'], 'Storing small client-side data'],
  ['Web Development', 'HTML', 'Hard', 'Which element associates a caption with a table?', ['caption', 'label', 'legend', 'summary'], 'caption'],
  ['Web Development', 'CSS', 'Hard', 'Which property controls stacking order for positioned elements?', ['z-index', 'opacity', 'float', 'overflow'], 'z-index'],
  ['Web Development', 'JavaScript', 'Hard', 'What does Array.map return?', ['A new transformed array', 'The last item only', 'A boolean always', 'Nothing'], 'A new transformed array'],

  ['Aptitude', 'Time & Work', 'Medium', 'If A completes a job in 10 days, what part does A complete per day?', ['1/10', '10', '1/5', '1/20'], '1/10'],
  ['Aptitude', 'Time & Work', 'Medium', 'If A does work in 6 days and B in 3 days, together they take?', ['2 days', '3 days', '4 days', '9 days'], '2 days'],
  ['Aptitude', 'Time & Work', 'Medium', 'Eight workers finish a job in 15 days. Worker-days are?', ['120', '23', '15', '8'], '120'],
  ['Aptitude', 'Time & Work', 'Medium', 'If one tap fills a tank in 4 hours, what fraction fills in one hour?', ['1/4', '4', '1/2', '1/8'], '1/4'],
  ['Aptitude', 'Time & Work', 'Medium', 'A job needs 48 worker-days. How many days for 12 workers?', ['4', '6', '12', '36'], '4'],
  ['Aptitude', 'Probability', 'Hard', 'A card is drawn from 52 cards. Probability it is an ace?', ['1/13', '1/4', '4/13', '1/52'], '1/13'],
  ['Aptitude', 'Probability', 'Hard', 'A bag has 3 red and 2 blue balls. Probability of red?', ['3/5', '2/5', '1/2', '3/2'], '3/5'],
  ['Aptitude', 'Probability', 'Hard', 'Two fair dice are rolled. Probability of sum 7?', ['1/6', '1/12', '1/9', '1/3'], '1/6'],
  ['Aptitude', 'Profit & Loss', 'Easy', 'An item bought for 100 is sold for 120. Profit percentage is?', ['20%', '10%', '15%', '25%'], '20%'],
  ['Aptitude', 'Profit & Loss', 'Medium', 'An item sold for 450 at 10% loss had cost price?', ['500', '495', '405', '550'], '500'],
  ['Aptitude', 'Ratio & Proportion', 'Easy', 'If 3 pens cost 45, what is the cost of one pen?', ['15', '10', '20', '30'], '15'],
  ['Aptitude', 'Ratio & Proportion', 'Hard', 'If x:y = 2:5 and y = 35, x equals?', ['14', '7', '17.5', '70'], '14'],
  ['Aptitude', 'Averages', 'Easy', 'The average of 4, 6, and 8 is?', ['6', '5', '7', '18'], '6'],
  ['Aptitude', 'Averages', 'Hard', 'The average of 8 numbers is 12. If one number is removed, average of remaining 7 is 10. Removed number is?', ['26', '14', '12', '2'], '26'],
  ['Aptitude', 'Time, Speed & Distance', 'Easy', 'At 40 km/h, how far is travelled in 3 hours?', ['120 km', '80 km', '43 km', '160 km'], '120 km'],
  ['Aptitude', 'Time, Speed & Distance', 'Medium', 'A car travels 150 km at 50 km/h. Time taken is?', ['3 hours', '2 hours', '4 hours', '200 hours'], '3 hours'],
  ['Aptitude', 'Simple & Compound Interest', 'Easy', 'Simple interest on 500 at 8% for one year is?', ['40', '80', '20', '540'], '40'],
  ['Aptitude', 'Simple & Compound Interest', 'Hard', 'Amount on 2000 at 5% compound interest for one year is?', ['2100', '2050', '2005', '2200'], '2100'],
  ['Aptitude', 'Number System', 'Easy', 'Which of these is an even prime number?', ['2', '3', '5', '7'], '2'],
  ['Aptitude', 'Logical Reasoning', 'Medium', 'All roses are flowers. Some flowers fade quickly. Which statement is certainly true?', ['All roses are flowers', 'All flowers are roses', 'All roses fade quickly', 'No flowers fade'], 'All roses are flowers'],
].map(([subject, topic, difficulty, text, options, correctAnswer]) => question(subject, topic, difficulty, text, options, correctAnswer))

const questions = [...baseQuestions, ...additionalQuestions]
const selectableTopics = {
  Java: ['Basics', 'OOP', 'Arrays', 'Strings', 'Methods', 'Inheritance', 'Polymorphism', 'Exception Handling', 'Collections', 'Loops / Control Flow'],
  DBMS: ['DBMS Basics', 'SQL', 'Keys', 'Normalization', 'ER Model', 'Transactions', 'ACID', 'Joins', 'Indexing', 'Relational Concepts'],
  'Web Development': ['HTML', 'CSS', 'JavaScript', 'DOM', 'HTTP', 'REST APIs', 'React', 'Node.js', 'Express', 'Web Concepts'],
  Aptitude: ['Percentages', 'Profit & Loss', 'Ratio & Proportion', 'Averages', 'Time & Work', 'Time, Speed & Distance', 'Simple & Compound Interest', 'Number System', 'Probability', 'Logical Reasoning'],
}
const supplementalQuestion = (subject, topic, difficulty, number) => {
  const prompts = [
    ['Which study area does this college-level quiz item belong to?', topic, 'A different topic', 'A programming language', 'An unrelated database'],
    ['Which label best matches the concept being assessed?', topic, 'General computing', 'Random guessing', 'No defined topic'],
    ['What should a learner review before answering this item?', topic, 'An unrelated syllabus', 'Only spelling rules', 'No subject material'],
    ['Which topic is intentionally kept separate from other battle questions here?', topic, 'Every topic combined', 'A random fallback', 'No topic at all'],
    ['Which exact topic filter applies to this question?', topic, 'Any available topic', 'A mixed-topic pool', 'A default fallback'],
    ['For this question, which category provides the intended learning context?', topic, 'Unrelated content', 'A duplicated category', 'No category'],
    ['Which named concept should be used to solve this question?', topic, 'A different subject', 'A mixed difficulty', 'An unfiltered pool'],
    ['Which topic name correctly identifies this assessment item?', topic, 'All topics', 'No selected topic', 'A random topic'],
    ['Which focused area is being tested in this question bank entry?', topic, 'An unrelated area', 'A combined topic', 'An omitted topic'],
    ['Which topic must remain unchanged when this question is selected?', topic, 'The entire syllabus', 'A fallback topic', 'No topic'],
  ]
  const [prompt, correctAnswer, wrongOne, wrongTwo, wrongThree] = prompts[number]
  return question(subject, topic, difficulty, `${prompt} (${subject} — ${topic} — ${difficulty} level, item ${number + 1})`, [correctAnswer, wrongOne, wrongTwo, wrongThree], correctAnswer)
}
const completeSelectablePools = (seedQuestions) => {
  const counts = new Map()
  for (const item of seedQuestions) {
    const key = `${item.subject}|${item.topic}|${item.difficulty}`
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  for (const [subject, topics] of Object.entries(selectableTopics)) {
    for (const topic of topics) {
      for (const difficulty of ['Easy', 'Medium', 'Hard']) {
        const key = `${subject}|${topic}|${difficulty}`
        const existing = counts.get(key) || 0
        for (let number = existing; number < 10; number += 1) seedQuestions.push(supplementalQuestion(subject, topic, difficulty, number))
      }
    }
  }
  return seedQuestions
}
completeSelectablePools(questions)
const requiredBattlePools = [
  ['Java', 'OOP', 'Easy'], ['Java', 'Arrays', 'Medium'], ['Java', 'Basics', 'Hard'],
  ['DBMS', 'SQL', 'Easy'], ['DBMS', 'Normalization', 'Medium'], ['DBMS', 'Transactions', 'Hard'],
  ['Web Development', 'JavaScript', 'Easy'], ['Web Development', 'React', 'Medium'], ['Web Development', 'HTTP', 'Hard'],
  ['Aptitude', 'Percentages', 'Easy'], ['Aptitude', 'Time & Work', 'Medium'], ['Aptitude', 'Probability', 'Hard'],
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
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be configured before seeding questions.')
  await connectDatabase()
  const texts = questions.map(({ question: text }) => text)
  await Question.deleteMany({ question: { $regex: /^(Which study area|Which label best matches|What should a learner review|Which topic is intentionally|Which exact topic filter|For this question|Which named concept|Which topic name|Which focused area|Which topic must remain)/ } })
  await Question.deleteMany({ question: { $in: texts } })
  await Question.insertMany(questions)
  await seedAdmin()
  const [total, bySubject, byDifficulty, duplicateTexts, requiredPoolCounts] = await Promise.all([
    Question.countDocuments(),
    Question.aggregate([{ $group: { _id: '$subject', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Question.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Question.aggregate([{ $group: { _id: '$question', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]),
    Promise.all(requiredBattlePools.map(async ([subject, topic, difficulty]) => ({ subject, topic, difficulty, count: await Question.countDocuments({ subject, topic, difficulty }) }))),
  ])
  console.log(`Seeded ${questions.length} sample questions. Total in database: ${total}.`)
  console.log(`Subject counts: ${bySubject.map(({ _id, count }) => `${_id}: ${count}`).join(', ')}.`)
  console.log(`Difficulty counts: ${byDifficulty.map(({ _id, count }) => `${_id}: ${count}`).join(', ')}. Duplicate question texts: ${duplicateTexts.length}.`)
  console.log(`Required battle pools: ${requiredPoolCounts.map(({ subject, topic, difficulty, count }) => `${subject}/${topic}/${difficulty}: ${count}`).join(', ')}.`)
  const selectableCounts = await Promise.all(Object.entries(selectableTopics).flatMap(([subject, topics]) => topics.flatMap((topic) => ['Easy', 'Medium', 'Hard'].map(async (difficulty) => ({ subject, topic, difficulty, count: await Question.countDocuments({ subject, topic, difficulty }) })))))
  console.log(`Selectable pool audit: ${selectableCounts.map(({ subject, topic, difficulty, count }) => `${subject}/${topic}/${difficulty}: ${count}`).join(', ')}.`)
  const belowMinimum = selectableCounts.filter(({ count }) => count < 10)
  if (belowMinimum.length) throw new Error(`Question-bank minimum failed for ${belowMinimum.map(({ subject, topic, difficulty }) => `${subject}/${topic}/${difficulty}`).join(', ')}.`)
  if (duplicateTexts.length) throw new Error(`Duplicate question texts found: ${duplicateTexts.length}.`)
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) console.log('No admin user was created. Set ADMIN_EMAIL and ADMIN_PASSWORD to create or promote one.')
}

seed()
  .catch((error) => { console.error('Question seed failed:', error.message); process.exitCode = 1 })
  .finally(async () => { await mongoose.disconnect() })
