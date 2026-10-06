# BrainBattle --- Low-Level Design (LLD)

## 1. LLD Purpose

This document describes the implementation-level structure of
BrainBattle: files, modules, data models, API contracts, authentication,
battle logic, socket events, scoring, and important validation rules.

## 2. Frontend Module Design

### 2.1 Application Entry

`src/main.jsx`

Responsibilities: - Start the React application - Mount the root
component - Provide application-level contexts

### 2.2 Routing

`src/layouts/AppShell.jsx`

Routes implemented:

``` text
/login
/signup
/dashboard
/battle
/battle/:battleId
/battle/:battleId/play
/battle/result/:battleId
/battle/:battleId/result
/history
/performance
/profile
```

Protected pages are wrapped by `ProtectedRoute` and `AppLayout`.

### 2.3 Authentication Context

`src/context/AuthContext.jsx`

Responsibilities: - Store `user` - Store JWT token - Login - Register -
Logout - Refresh profile - Maintain authentication state

Storage key:

``` text
brainbattle-auth
```

Authentication data is stored in browser `localStorage`.

### 2.4 Socket Context

`src/context/SocketContext.jsx`

Responsibilities: - Create Socket.IO client connection - Pass JWT
through Socket.IO authentication - Reconnect when necessary - Disconnect
when the user logs out

Socket URL is selected from:

``` text
VITE_SOCKET_URL
```

or derived from:

``` text
VITE_API_URL
```

### 2.5 API Service

`src/services/api.js`

Creates an Axios instance.

Default development API:

``` text
http://localhost:5000/api
```

Production can override this using `VITE_API_URL`.

### 2.6 Authentication Service

`src/services/authService.js`

Functions:

``` text
registerUser(userDetails)
loginUser(credentials)
getUserProfile(token)
```

### 2.7 Battle Service

`src/services/battleService.js`

Functions:

``` text
getBattleQuestions(token, setup)
submitBattle(token, questions)

createMultiplayerBattle(token, setup)
getAvailableBattles(token)
joinMultiplayerBattle(token, battleId)
joinMultiplayerBattleByCode(token, battleCode)
getMultiplayerBattle(token, battleId)
submitMultiplayerAnswer(token, battleId, questionId, answer)
getBattleResult(token, battleId)
```

### 2.8 User Service

`src/services/userService.js`

Functions:

``` text
getBattleHistory(token)
getPerformance(token)
```

## 3. Frontend Page Responsibilities

### AuthPage.jsx

Provides login/signup UI.

### Dashboard.jsx

Displays: - User greeting - Level - XP - XP progress - Quick subject
choices - Start Battle action

### BattleSetup.jsx

Allows: - Subject selection - Topic selection - 5/10 question
selection - Battle creation - Battle-code joining

### BattleRoom.jsx

Displays: - Players - Battle status - Subject/topic/count - Battle code
while waiting - Connection status - Submission status

### QuizBattle.jsx

Handles: - Question navigation - Option selection - Answer persistence
in session storage - Submission confirmation - REST answer submission -
Socket state synchronization - Waiting for opponent - Navigation to
results

### BattleResult.jsx

Displays: - Outcome - Player score - Opponent score - Accuracy - XP
earned - Navigation to another battle/history/dashboard

### History.jsx

Displays completed battle records.

### Performance.jsx

Displays calculated statistics and XP progress.

### Profile.jsx

Displays account and progression information.

## 4. Backend Entry Point

`backend/server.js`

### Initialization sequence

``` text
Load environment variables
        |
Create Express app
        |
Create HTTP server
        |
Create Socket.IO server
        |
Configure CORS
        |
Enable JSON parsing
        |
Configure battle sockets
        |
Register REST routes
        |
Register health endpoint
        |
Register 404 handler
        |
Register 500 handler
        |
Connect MongoDB
        |
Start HTTP server
```

Default port:

``` text
5000
```

## 5. Backend Route Mapping

### Auth routes

File:

`backend/routes/authRoutes.js`

``` text
POST /api/auth/register
 -> register()

POST /api/auth/login
 -> login()
```

### User routes

File:

`backend/routes/userRoutes.js`

All routes use `protect`.

``` text
GET /api/users/profile
 -> getProfile()

GET /api/users/performance
 -> getPerformance()
```

### Battle routes

File:

`backend/routes/battleRoutes.js`

All routes use `protect`.

``` text
POST /api/battles
 -> createBattle()

POST /api/battles/join
 -> joinBattleByCode()

GET /api/battles/available
 -> getAvailableBattles()

GET /api/battles/my
 -> getMyBattles()

GET /api/battles/history
 -> getBattleHistory()

POST /api/battles/:battleId/join
 -> joinBattle()

POST /api/battles/:battleId/answers
 -> submitBattleAnswers()

GET /api/battles/:battleId/result
 -> getBattleResult()

GET /api/battles/:battleId
 -> getBattle()
```

### Question routes

File:

`backend/routes/questionRoutes.js`

Publicly protected by authentication:

``` text
GET /api/questions/battle
 -> getBattleQuestions()

POST /api/questions/battle/submit
 -> submitBattle()
```

Admin-protected CRUD:

``` text
POST /api/questions
 -> createQuestion()

GET /api/questions
 -> getQuestions()

PUT /api/questions/:id
 -> updateQuestion()

DELETE /api/questions/:id
 -> deleteQuestion()
```

## 6. Authentication Implementation

### Registration

File:

`backend/controllers/authController.js`

Algorithm:

``` text
1. Read name, email, password.
2. Normalize email.
3. Validate required fields.
4. Validate email format.
5. Require password length >= 6.
6. Check duplicate email.
7. bcrypt.hash(password, 12).
8. Create User.
9. Create JWT.
10. Return safe user data + token.
```

### Login

``` text
1. Read email/password.
2. Normalize email.
3. Find user by email.
4. bcrypt.compare(password, storedHash).
5. Reject invalid credentials.
6. Create JWT.
7. Return safe user data + token.
```

### JWT

Token payload:

``` json
{
  "id": "<userId>"
}
```

Expiration:

``` text
7 days
```

## 7. Auth Middleware

File:

`backend/middleware/authMiddleware.js`

Algorithm:

``` text
Read Authorization header
        |
Check "Bearer " prefix
        |
Extract token
        |
jwt.verify()
        |
Find User by decoded.id
        |
Exclude password
        |
request.user = user
        |
next()
```

Failure: - No token -\> 401 - Invalid/expired token -\> 401 - User not
found -\> 401

## 8. Admin Middleware

File:

`backend/middleware/adminMiddleware.js`

``` text
if request.user.role !== "admin"
    return 403
else
    next()
```

It is applied after `protect` to question-management CRUD routes.

## 9. User Model

File:

`backend/models/User.js`

``` text
User {
    name: String, required
    email: String, required, unique
    password: String, required
    xp: Number, default 0
    level: Number, default 1
    role: "user" | "admin"
    createdAt
    updatedAt
}
```

## 10. Question Model

File:

`backend/models/Question.js`

``` text
Question {
    subject: String
    topic: String
    question: String
    options: [String]    // exactly 4
    correctAnswer: String
    createdAt
    updatedAt
}
```

Validation: - Exactly four options - Every option must be non-empty -
`correctAnswer` must match one option

The schema also validates this relationship in a Mongoose pre-validation
hook.

## 11. Battle Model

File:

`backend/models/Battle.js`

``` text
Battle {
    battleCode: String, unique, indexed
    creator: ObjectId -> User
    opponent: ObjectId -> User | null
    questions: [ObjectId -> Question]

    subject: String
    topic: String
    questionCount: Number

    status: "waiting" | "active" | "completed"

    creatorAnswers: Answer[]
    opponentAnswers: Answer[]

    creatorSubmittedAt: Date | null
    opponentSubmittedAt: Date | null

    creatorScore: Number
    opponentScore: Number

    winner: ObjectId -> User | null
    completedAt: Date | null

    rewardsGranted: Boolean
    creatorXpEarned: Number
    opponentXpEarned: Number

    createdAt
    updatedAt
}
```

### Answer subdocument

``` text
Answer {
    questionId: ObjectId -> Question
    answer: String
    isCorrect: Boolean
    answeredAt: Date
}
```

The answer subdocument does not create its own MongoDB `_id`.

## 12. Battle Submission Model

File:

`backend/models/BattleSubmission.js`

``` text
BattleSubmission {
    user: ObjectId -> User
    answers: [
        {
            questionId: ObjectId -> Question
            answer: String
        }
    ]
    createdAt
    updatedAt
}
```

This model supports the separate question-battle submission endpoint.

## 13. Question Bank

File:

`brainbattle_200_questions.js`

The implemented question bank contains exactly 200 MCQs.

``` text
Java              50
DBMS              50
Web Development   50
Aptitude          50
--------------------
Total            200
```

Each populated topic contains 10 questions.

Each question has:

``` text
subject
topic
question
options[4]
correctAnswer
```

No `difficulty` field is used in the question-bank schema.

## 14. Battle Setup Validation

File:

`backend/controllers/battleController.js`

The server validates: - Subject exists - Topic belongs to subject -
Question count is an integer - Question count is between 1 and 20 -
Enough questions exist

The frontend currently exposes only:

``` text
5
10
```

## 15. Battle Code Generation

Battle codes are generated with Node's cryptographic random bytes.

Allowed alphabet:

``` text
ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

The generated code is six characters long.

Ambiguous characters such as `I`, `O`, `0`, and `1` are excluded.

A unique database index protects against duplicate codes. The creation
code retries when a duplicate-key conflict occurs.

## 16. Battle Creation Algorithm

``` text
createBattle()

1. Validate subject/topic/questionCount.
2. Count matching Question documents.
3. Reject if insufficient questions.
4. Randomly sample requested number of questions.
5. Generate six-character battle code.
6. Create Battle:
      creator = current user
      opponent = null
      status = waiting
      questions = sampled IDs
7. Populate creator/opponent information.
8. Return safe battle data.
```

## 17. Battle Join Algorithm

``` text
joinBattleByCode()

1. Normalize code to uppercase.
2. Validate six-character format.
3. Find a waiting battle with:
      matching battleCode
      opponent = null
      creator != current user
4. Atomically set:
      opponent = current user
      status = active
5. Populate battle.
6. Emit battle-start event.
7. Return safe battle data.
```

This atomic update prevents two users from successfully claiming the
same waiting slot under normal concurrent requests.

## 18. Safe Battle Response

The controller uses `safeBattle()` to control what is returned to
clients.

A normal battle response contains: - IDs - Player names - Subject -
Topic - Question count - Status - Submission counts/status - Battle code
for participants

When questions are requested for an active battle, the response
includes: - Question ID - Subject - Topic - Question text - Four options

The `correctAnswer` is intentionally excluded.

## 19. Answer Submission Algorithm

Endpoint:

``` text
POST /api/battles/:battleId/answers
```

Request:

``` json
{
  "questionId": "<questionId>",
  "answer": "<selected option>"
}
```

Algorithm:

``` text
1. Validate battle ID.
2. Find battle and its question options/correct answers.
3. Confirm current user is creator or opponent.
4. Confirm battle.status == active.
5. Validate question ID.
6. Confirm question belongs to this battle.
7. Confirm answer is one of the four options.
8. Determine creatorAnswers or opponentAnswers.
9. Determine isCorrect by comparing with correctAnswer.
10. Atomically append the answer only if that question
    has not already been submitted by this player.
11. Mark submittedAt when the player has answered
    questionCount questions.
12. Attempt battle completion.
13. Emit Socket.IO state/submission events.
14. Return updated battle status.
```

## 20. Battle Completion Algorithm

Function:

``` text
completeIfReady(battleId)
```

Completion requires:

``` text
creatorAnswers.length == questionCount
AND
opponentAnswers.length == questionCount
```

Then:

``` text
creatorScore  = correct creator answers × 10
opponentScore = correct opponent answers × 10
```

Winner:

``` text
creatorScore > opponentScore
    -> creator wins

opponentScore > creatorScore
    -> opponent wins

otherwise
    -> draw
```

The battle is then changed to:

``` text
status = completed
completedAt = current time
winner = calculated winner
```

## 21. Reward Algorithm

Function:

``` text
grantRewards(battle)
```

The battle is first claimed using:

``` text
rewardsGranted: false
```

and atomically changed to true.

This prevents duplicate reward granting.

Base XP:

``` text
WIN  = 100
DRAW = 75
LOSS = 50
```

Additional XP:

``` text
correctAnswers × 10
```

Level:

``` text
floor(totalXP / 500) + 1
```

## 22. Socket Authentication

File:

`backend/socket/battleSocket.js`

On connection:

``` text
Read socket.handshake.auth.token
        |
Verify JWT
        |
Find user
        |
socket.data.userId = user ID
socket.data.userName = user name
```

Invalid authentication rejects the socket connection.

## 23. Socket Battle Room

Room naming function:

``` text
battle:<battleId>
```

A socket can join a room only when: - Battle exists - User is a
participant

The server sends a sanitized state using `safeState()`.

## 24. Socket Events

### Client -\> Server

``` text
battle:join
```

Payload:

``` json
{
  "battleId": "<battleId>"
}
```

### Server -\> Client

``` text
battle:state
battle:opponent_joined
battle:started
battle:player_submitted
battle:player_connected
battle:player_disconnected
battle:completed
```

## 25. Safe Socket State

Socket state contains:

``` text
battleId
status
creator {
    id
    name
    connected
}
opponent {
    id
    name
    connected
}
subject
topic
questionCount
creatorSubmitted
opponentSubmitted
creatorAnsweredCount
opponentAnsweredCount
```

Correct answers are never included.

## 26. Frontend Quiz State

`QuizBattle.jsx` maintains:

``` text
battle
currentIndex
answers
showConfirmation
error
isSubmitting
liveState
hasSubmitted
```

Answers are stored in:

``` text
sessionStorage
```

using a battle-specific key:

``` text
brainbattle-battle-<battleId>
```

## 27. Battle Submission Flow

The frontend waits until all questions have an answer.

On final submission:

``` text
for each question:
    if not already submitted:
        POST answer to backend
```

After submission: - The answer cache is removed. - The user sees a
waiting state. - The client listens for battle completion. - A fallback
polling request is used while waiting for completion.

## 28. Result Calculation

The result endpoint returns:

``` text
battleId
creator {
    id
    name
    score
    accuracy
}
opponent {
    id
    name
    score
    accuracy
}
winner
questionCount
xpEarned
completedAt
```

Accuracy:

``` text
(correct answers / question count) × 100
```

Rounded to the nearest whole percentage for battle results.

## 29. History Calculation

For each completed battle, the backend determines the requesting user's
perspective:

``` text
If current user = creator:
    myScore = creatorScore
    opponentScore = opponentScore

Else:
    myScore = opponentScore
    opponentScore = creatorScore
```

Result:

``` text
winner == current user -> WIN
winner == null         -> DRAW
otherwise              -> LOSS
```

## 30. Performance Calculation

The backend loads completed battles involving the current user.

It calculates:

``` text
totalBattles
wins
losses
draws
winRate
totalQuestions
totalCorrect
accuracy
totalXP
level
currentLevelXP
nextLevelXP
```

Percentages are calculated safely with zero-denominator handling.

## 31. Error Handling Contract

### REST errors

``` text
400 Bad Request
Invalid input.

401 Unauthorized
Missing/invalid authentication.

403 Forbidden
Authenticated but not allowed.

404 Not Found
Resource does not exist.

409 Conflict
Current resource state prevents the operation.

422 Unprocessable Entity
Valid request, but insufficient question availability.

500 Internal Server Error
Unexpected server failure.
```

### Frontend behavior

API errors are converted into readable messages and displayed inside the
relevant page state.

## 32. Database Connection

File:

`backend/config/db.js`

The backend reads:

``` text
MONGO_URI
```

and connects using Mongoose.

The application uses MongoDB Atlas in the deployed configuration.

## 33. Environment Configuration

Important variables:

``` text
MONGO_URI
JWT_SECRET
CLIENT_URL
PORT
```

Frontend:

``` text
VITE_API_URL
VITE_SOCKET_URL
```

Secrets are kept in environment variables and are not part of the
application logic.

## 34. Question Seeding

File:

`backend/scripts/seedQuestions.js`

The seed script: 1. Loads the question bank. 2. Validates total count.
3. Validates subject counts. 4. Validates topic counts. 5. Validates
four options. 6. Validates correct answer membership. 7. Rejects
duplicate questions. 8. Rejects a `difficulty` field. 9. Deletes
existing questions. 10. Inserts all 200 questions. 11. Verifies the
resulting document count.

## 35. Implementation Note

The runtime battle setup intentionally exposes five populated topics per
subject because the bundled 200-question bank contains those topics.

The controller contains a broader subject/topic validation list, but
battle creation can only succeed when enough matching questions exist in
MongoDB. Therefore, the five populated topics per subject are the
practical supported battle topics in the current build.

## 36. File-to-Responsibility Map

  File                                          Responsibility
  --------------------------------------------- -----------------------------------
  `src/main.jsx`                                React entry
  `src/layouts/AppShell.jsx`                    Routing
  `src/layouts/AppLayout.jsx`                   Authenticated layout
  `src/context/AuthContext.jsx`                 Authentication state
  `src/context/SocketContext.jsx`               Socket connection
  `src/services/api.js`                         Axios client
  `src/services/authService.js`                 Auth requests
  `src/services/battleService.js`               Battle requests
  `src/services/userService.js`                 User/history/performance requests
  `src/pages/BattleSetup.jsx`                   Create/join setup
  `src/pages/BattleRoom.jsx`                    Waiting/active room
  `src/pages/QuizBattle.jsx`                    Quiz interaction
  `src/pages/BattleResult.jsx`                  Results
  `src/pages/History.jsx`                       History
  `src/pages/Performance.jsx`                   Statistics
  `backend/server.js`                           Server bootstrap
  `backend/controllers/authController.js`       Registration/login
  `backend/controllers/battleController.js`     Battle lifecycle
  `backend/controllers/questionController.js`   Question operations
  `backend/controllers/userController.js`       Profile/performance
  `backend/middleware/authMiddleware.js`        JWT protection
  `backend/middleware/adminMiddleware.js`       Admin authorization
  `backend/socket/battleSocket.js`              Real-time battle events
  `backend/models/User.js`                      User schema
  `backend/models/Question.js`                  Question schema
  `backend/models/Battle.js`                    Battle schema
  `backend/models/BattleSubmission.js`          Submission schema
  `backend/utils/scoring.js`                    Score/XP/level rules

## 37. LLD Summary

The implementation separates responsibilities into:

``` text
React Pages / Components
        |
        v
Frontend Services / Context
        |
        +------ REST ------> Express Routes
        |                       |
        |                       v
        |                  Controllers
        |                       |
        |                       v
        |                    Mongoose
        |                       |
        |                       v
        |                    MongoDB
        |
        +--- Socket.IO ------> Battle Socket Layer
```

This separation keeps UI state, API access, business logic, persistence,
and real-time communication in distinct modules.
