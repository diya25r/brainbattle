# BrainBattle --- High-Level Design (HLD)

## 1. System Overview

BrainBattle follows a client-server architecture.

The React frontend provides the user interface and communicates with the
Node.js/Express backend using REST APIs. Socket.IO provides real-time
communication for active battles. MongoDB stores users, questions,
battles, and submission records.

``` text
                         +----------------------+
                         |      Browser         |
                         |  React + Vite        |
                         +----------+-----------+
                                    |
                 +------------------+------------------+
                 |                                     |
              REST API                              Socket.IO
                 |                                     |
                 v                                     v
        +--------+-------------------------------------+--------+
        |                 Node.js Backend                        |
        |                  Express + Socket.IO                    |
        |                                                         |
        |  Auth   Users   Questions   Battles   Battle Sockets   |
        +---------------------------+-----------------------------+
                                    |
                                    | Mongoose
                                    v
                         +----------+-----------+
                         |       MongoDB        |
                         | Users                 |
                         | Questions             |
                         | Battles               |
                         | BattleSubmissions    |
                         +----------------------+
```

## 2. Main Components

### 2.1 Frontend

The frontend is implemented using React and Vite.

Important areas:

``` text
src/
├── components/
│   ├── AuthField.jsx
│   ├── ProtectedRoute.jsx
│   └── dashboard/
├── context/
│   ├── AuthContext.jsx
│   └── SocketContext.jsx
├── layouts/
│   ├── AppLayout.jsx
│   └── AppShell.jsx
├── pages/
│   ├── AuthPage.jsx
│   ├── Dashboard.jsx
│   ├── BattleSetup.jsx
│   ├── BattleRoom.jsx
│   ├── QuizBattle.jsx
│   ├── BattleResult.jsx
│   ├── History.jsx
│   ├── Performance.jsx
│   └── Profile.jsx
└── services/
    ├── api.js
    ├── authService.js
    ├── battleService.js
    └── userService.js
```

### 2.2 Backend

``` text
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── battleController.js
│   ├── questionController.js
│   └── userController.js
├── middleware/
│   ├── authMiddleware.js
│   └── adminMiddleware.js
├── models/
│   ├── User.js
│   ├── Question.js
│   ├── Battle.js
│   └── BattleSubmission.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── questionRoutes.js
│   └── battleRoutes.js
├── socket/
│   └── battleSocket.js
├── utils/
│   └── scoring.js
└── server.js
```

## 3. Architectural Responsibilities

### Frontend responsibilities

-   Render UI
-   Manage route navigation
-   Store authentication state
-   Send REST requests
-   Maintain Socket.IO connection
-   Temporarily retain selected answers
-   Display battle state and results

### Backend responsibilities

-   Authenticate users
-   Validate requests
-   Create/join battles
-   Select questions
-   Validate submitted answers
-   Calculate scores
-   Calculate XP and levels
-   Persist battle state
-   Authorize participants
-   Synchronize active battle state

### Database responsibilities

MongoDB persists: - User accounts - Question bank - Battle records -
Battle submissions

## 4. Authentication Architecture

``` text
User
 |
 | email + password
 v
POST /api/auth/login
 |
 v
authController
 |
 | bcrypt.compare()
 | JWT sign
 v
JWT + safe user data
 |
 v
Frontend localStorage
 |
 | Bearer token
 v
Protected API
 |
 v
authMiddleware
 |
 | jwt.verify()
 | User.findById()
 v
request.user
```

Passwords are hashed using bcryptjs before storage.

JWTs are configured with a seven-day expiration.

## 5. Battle Creation Architecture

``` text
Creator
  |
  | subject + topic + count
  v
POST /api/battles
  |
  v
Validate setup
  |
  v
MongoDB: count matching questions
  |
  v
MongoDB: random sample
  |
  v
Generate unique 6-character code
  |
  v
Create Battle
(status = waiting)
  |
  v
Return battle details
```

The correct answers remain in the database and are not included in the
question payload sent to the client.

## 6. Battle Join Architecture

``` text
Opponent
   |
   | 6-character code
   v
POST /api/battles/join
   |
   v
Validate code + battle state
   |
   v
Atomically attach opponent
   |
   v
status = active
   |
   +------------------------+
   |                        |
   v                        v
REST response          Socket.IO event
                        battle:started
```

## 7. Real-Time Architecture

Socket.IO is used only after authentication.

The frontend creates a Socket.IO connection with:

``` text
auth: { token }
```

The backend Socket.IO middleware verifies the JWT and associates the
socket with a user ID.

Each battle uses a room:

``` text
battle:<battleId>
```

Only participants can join that room.

### Main socket events

  Event                          Purpose
  ------------------------------ ----------------------------------
  `battle:join`                  Join a battle room
  `battle:state`                 Synchronize current state
  `battle:opponent_joined`       Notify that the opponent joined
  `battle:started`               Notify that the battle is active
  `battle:player_submitted`      Notify opponent submission
  `battle:player_connected`      Notify connection
  `battle:player_disconnected`   Notify disconnection
  `battle:completed`             Notify battle completion

## 8. Quiz Submission Architecture

``` text
Player selects answers
        |
        v
Frontend keeps selections
        |
        v
POST /api/battles/:battleId/answers
        |
        v
Authenticate user
        |
        v
Verify participant
        |
        v
Verify battle is active
        |
        v
Verify question belongs to battle
        |
        v
Verify answer is one of four options
        |
        v
Compare answer with stored correctAnswer
        |
        v
Store answer + isCorrect
        |
        v
If both players finished:
        |
        v
Calculate scores
        |
        v
Set winner
        |
        v
Grant XP once
        |
        v
Emit battle:completed
```

## 9. Battle State Machine

``` text
                  +---------+
                  | WAITING |
                  +----+----+
                       |
              opponent joins
                       |
                       v
                  +---------+
                  | ACTIVE  |
                  +----+----+
                       |
          both submit all answers
                       |
                       v
                +--------------+
                |  COMPLETED   |
                +--------------+
```

Invalid transitions are rejected by the backend.

## 10. Scoring and XP Architecture

The scoring utility contains centralized constants/functions.

``` text
Correct answer = 10 score points

Win  = 100 base XP
Draw = 75 base XP
Loss = 50 base XP

Additional XP = correct answers × 10

Total XP earned =
    outcome base XP + correct answers × 10
```

Level calculation:

``` text
Level = floor(total XP / 500) + 1
```

## 11. Database Design

### User

``` text
User
 ├── _id
 ├── name
 ├── email
 ├── password
 ├── xp
 ├── level
 ├── role
 ├── createdAt
 └── updatedAt
```

### Question

``` text
Question
 ├── _id
 ├── subject
 ├── topic
 ├── question
 ├── options[4]
 ├── correctAnswer
 ├── createdAt
 └── updatedAt
```

### Battle

``` text
Battle
 ├── _id
 ├── battleCode
 ├── creator -> User
 ├── opponent -> User
 ├── questions[] -> Question
 ├── subject
 ├── topic
 ├── questionCount
 ├── status
 ├── creatorAnswers[]
 ├── opponentAnswers[]
 ├── creatorSubmittedAt
 ├── opponentSubmittedAt
 ├── creatorScore
 ├── opponentScore
 ├── winner -> User
 ├── completedAt
 ├── rewardsGranted
 ├── creatorXpEarned
 ├── opponentXpEarned
 ├── createdAt
 └── updatedAt
```

### BattleSubmission

``` text
BattleSubmission
 ├── _id
 ├── user -> User
 ├── answers[]
 │    ├── questionId -> Question
 │    └── answer
 ├── createdAt
 └── updatedAt
```

## 12. Database Indexing

The Battle model uses indexes for: - Battle status + completion date -
Creator + status + completion date - Opponent + status + completion date

Battle code is unique and indexed.

These indexes support battle lookup and user-history queries.

## 13. API Layer

### Authentication

``` text
POST /api/auth/register
POST /api/auth/login
```

### Users

``` text
GET /api/users/profile
GET /api/users/performance
```

### Battles

``` text
POST /api/battles
POST /api/battles/join
GET  /api/battles/available
GET  /api/battles/my
GET  /api/battles/history
POST /api/battles/:battleId/join
POST /api/battles/:battleId/answers
GET  /api/battles/:battleId/result
GET  /api/battles/:battleId
```

### Questions

``` text
GET  /api/questions/battle
POST /api/questions/battle/submit

POST   /api/questions
GET    /api/questions
PUT    /api/questions/:id
DELETE /api/questions/:id
```

The question-management CRUD routes are protected by both authentication
and admin-role middleware.

## 14. Error Handling

The backend provides: - 400 for invalid request data - 401 for
missing/invalid authentication - 403 for unauthorized access - 404 for
missing resources - 409 for conflicting battle state - 422 when there
are insufficient questions for a requested setup - 500 for unexpected
server errors

The frontend converts API errors into user-visible messages.

## 15. Deployment Architecture

``` text
User Browser
    |
    +----> Vercel / React frontend
    |
    +----> Render / Node.js + Express + Socket.IO backend
                       |
                       v
                 MongoDB Atlas
```

The frontend can use: - `VITE_API_URL` for the backend API -
`VITE_SOCKET_URL` for Socket.IO

If the socket URL is not explicitly provided, the frontend derives it
from the API URL.

## 16. Security Design

1.  Passwords are bcrypt-hashed.
2.  JWT is required for protected REST routes.
3.  JWT is also required for Socket.IO connections.
4.  Battle participation is checked before exposing battle data.
5.  Correct answers are omitted from question responses.
6.  Admin endpoints require `role === "admin"`.
7.  Answer values are validated against the question's options.
8.  Duplicate question submissions are prevented.
9.  Rewards use a `rewardsGranted` guard to avoid duplicate XP awards.

## 17. Key Design Decisions

### REST + Socket.IO

REST is used for durable operations such as creating battles and
submitting answers. Socket.IO is used for events that need immediate
synchronization.

### Server-side scoring

The client never decides whether an answer is correct. The backend
compares the submitted answer against the stored correct answer.

### Battle code instead of direct invitation

A short six-character code makes it easy for a creator to share a battle
with another player without requiring a friend system.

### Random server-side question selection

The server selects questions from MongoDB so both players receive the
same persisted question set and the correct answer remains protected.

## 18. HLD Summary

``` text
React UI
   |
   +--> Axios REST --------------------+
   |                                   |
   +--> Socket.IO ---------------------+--> Node/Express
                                       |
                                       +--> Auth middleware
                                       +--> Battle controllers
                                       +--> Question controllers
                                       +--> User controllers
                                       +--> Socket.IO battle rooms
                                       |
                                       +--> Mongoose
                                              |
                                              v
                                         MongoDB Atlas
```
