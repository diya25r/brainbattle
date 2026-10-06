# BrainBattle --- Product Requirements Document (PRD)

## 1. Product Overview

**Product name:** BrainBattle

BrainBattle is a web-based 1v1 multiplayer quiz application.
Authenticated users can create a quiz battle, share a generated
six-character battle code with another player, and compete in real time.

The application combines subject-based multiple-choice questions with
real-time multiplayer synchronization, server-side answer validation,
score calculation, XP progression, battle history, and performance
statistics.

## 2. Problem Statement

Traditional quiz applications are often designed for individual
practice. They do not provide a simple way for two users to challenge
each other on a selected subject and topic while keeping the battle
state synchronized.

BrainBattle addresses this by allowing two authenticated users to enter
the same quiz battle using a shareable code and compete on the same set
of questions.

## 3. Product Goals

1.  Provide a simple 1v1 quiz experience.
2.  Allow users to choose a subject, topic, and number of questions.
3.  Allow one player to create a battle and another player to join using
    a code.
4.  Synchronize battle state between both players in real time.
5.  Keep answer validation and scoring on the server.
6.  Provide clear results after both players finish.
7.  Maintain XP, levels, battle history, and performance statistics.

## 4. Target Users

### Primary user

A student or learner who wants to test knowledge and compete with
another user.

### Secondary user

An administrator who manages the question bank through protected
question-management APIs.

## 5. Core User Journey

``` text
Register / Login
      |
      v
Dashboard
      |
      v
Create Battle
(subject + topic + 5/10 questions)
      |
      v
Battle Room
      |
      +---- Creator shares 6-character code
      |
      v
Opponent joins with code
      |
      v
Real-time Battle
      |
      v
Both players submit answers
      |
      v
Server calculates scores
      |
      v
Battle Result
      |
      +----> History
      |
      +----> Performance
      |
      +----> Dashboard / Battle Again
```

## 6. Functional Requirements

### FR-01: User Registration

The system shall allow a new user to register with: - Name - Email -
Password

The backend shall validate required fields, validate email format,
enforce a minimum password length of six characters, reject duplicate
email addresses, hash passwords using bcrypt, and return a JWT.

### FR-02: User Login

The system shall allow registered users to log in using email and
password.

The backend shall verify the password and return a seven-day JWT when
authentication succeeds.

### FR-03: Protected Access

Authenticated functionality shall require a valid Bearer JWT.

The server shall reject missing, invalid, expired, or unknown-user
tokens.

### FR-04: Dashboard

After authentication, users shall see: - Current level - XP - XP
progress - Quick battle subject choices - Access to the battle flow

### FR-05: Battle Creation

An authenticated user shall be able to create a battle by selecting: -
Subject - Topic - Number of questions

The implemented frontend provides 5 or 10 question choices.

Supported subjects and currently populated topics are:

  -----------------------------------------------------------------------
  Subject                             Topics
  ----------------------------------- -----------------------------------
  Java                                Basics, OOP, Arrays, Strings,
                                      Collections

  DBMS                                SQL, Keys, Normalization,
                                      Transactions, Joins

  Web Development                     HTML, CSS, JavaScript, HTTP, REST
                                      APIs

  Aptitude                            Percentages, Profit & Loss, Ratio,
                                      Time & Work, Probability
  -----------------------------------------------------------------------

The question bank contains 200 MCQs: 50 questions per subject and 10
questions per populated topic.

### FR-06: Random Question Selection

When a battle is created, the server shall select the requested number
of questions randomly from the selected subject and topic.

Question options shall be sent to players without exposing the correct
answer.

### FR-07: Battle Code

Each created battle shall receive a unique six-character code.

The code uses a restricted alphabet that avoids visually ambiguous
characters.

### FR-08: Join Battle

A second authenticated user shall be able to join using the
six-character battle code.

The system shall prevent: - Joining one's own battle - Joining a battle
that is already active - Joining a completed/unavailable battle -
Invalid battle codes

When a second player joins, the battle changes from `waiting` to
`active`.

### FR-09: Battle Room

The battle room shall show: - Both players - Subject - Topic - Number of
questions - Battle status - Connection status - Submission status

The creator can copy the battle code while waiting for an opponent.

### FR-10: Real-Time Multiplayer

The application shall use Socket.IO to synchronize: - Battle room
state - Opponent connection/disconnection - Opponent joining - Battle
start - Answer submission status - Battle completion

Socket authentication shall use the user's JWT.

### FR-11: Quiz Interaction

During an active battle, each player shall: - View one question at a
time - Select one of four options - Move forward/backward - Navigate
between questions - See answered questions - Submit only after all
questions are answered

The selected answers are temporarily stored in browser session storage
so navigation or a refresh within the session can preserve the current
answer selections.

### FR-12: Server-Side Answer Validation

The server shall verify that: - The battle exists - The user belongs to
the battle - The battle is active - The question belongs to that
battle - The answer is one of the question's valid options - The same
question has not already been submitted by that player

The server determines whether an answer is correct.

### FR-13: Score Calculation

Each correct answer is worth 10 points.

``` text
Score = Number of correct answers × 10
```

The player with the higher score wins.

Equal scores produce a draw.

### FR-14: XP and Levels

The implemented XP rules are:

  Outcome     Base XP
  --------- ---------
  Win             100
  Draw             75
  Loss             50

Additionally:

``` text
XP earned = outcome XP + (correct answers × 10)
```

Every 500 XP advances the player by one level.

### FR-15: Results

After both players complete the battle, the system shall show: - Winner
/ loser / draw - Player scores - Accuracy - Questions answered
correctly - XP earned

### FR-16: Battle History

Authenticated users shall be able to view completed battles including: -
Result - Subject - Topic - Opponent - Scores - Date - Battle code

### FR-17: Performance

The system shall calculate: - Total battles - Wins - Losses - Draws -
Win rate - Total questions answered - Total correct answers - Accuracy -
Total XP - Current level - XP remaining to next level

### FR-18: Profile

The profile page shall display: - Name - Email - Current level - Total
XP - XP progress

### FR-19: Question Administration

The backend contains protected admin-only question APIs for: - Creating
questions - Listing questions - Updating questions - Deleting questions

Question creation/update validation requires: - Valid subject - Valid
topic - Non-empty question text - Exactly four non-empty options -
Correct answer matching one option

## 7. Non-Functional Requirements

### NFR-01: Security

-   Passwords shall not be stored in plain text.
-   Authentication shall use JWT.
-   Password verification shall use bcrypt.
-   Protected endpoints shall validate authentication.
-   Admin question-management endpoints shall require the admin role.
-   Correct answers shall not be exposed in battle question responses.

### NFR-02: Data Integrity

-   Battle participation shall be checked on the server.
-   A player cannot submit the same question twice.
-   A question must belong to the current battle.
-   Battle completion shall occur only after both players answer all
    questions.
-   Rewards are guarded so they are granted only once.

### NFR-03: Availability

The frontend shall handle server/API failures with user-visible error
states.

Socket.IO shall support reconnection.

### NFR-04: Performance

Questions are randomly sampled from MongoDB rather than loading the
entire question bank for every battle.

Database indexes are used on battle code and battle status/user-history
access patterns.

### NFR-05: Usability

The application shall provide: - Clear authentication screens - Simple
battle setup - Copyable battle code - Question progress - Clear
submission confirmation - Clear result states - Responsive layouts

## 8. Data Requirements

### User

-   Name
-   Email
-   Hashed password
-   XP
-   Level
-   Role
-   Timestamps

### Question

-   Subject
-   Topic
-   Question text
-   Four options
-   Correct answer
-   Timestamps

### Battle

-   Battle code
-   Creator
-   Opponent
-   Question references
-   Subject
-   Topic
-   Question count
-   Status
-   Both players' answers
-   Scores
-   Winner
-   Completion time
-   XP rewards

### Battle Submission

A separate submission model exists for the non-multiplayer question
submission endpoint and stores a user plus submitted question/answer
pairs.

## 9. Battle States

``` text
WAITING
  |
  | second player joins
  v
ACTIVE
  |
  | both players answer all questions
  v
COMPLETED
```

## 10. Out of Scope / Not Required

The current implemented product does not require: - Coding questions -
Difficulty selection - Leaderboards - Voice/video calling - Chat between
players - Timed per-question rounds - More than two players in one
battle - Payment features

## 11. Success Criteria

The product is successful when: 1. A user can register/login. 2. A user
can create a battle with a valid subject/topic/question count. 3. A
second user can join with the battle code. 4. Both users receive the
same battle questions. 5. Answers are validated by the server. 6. The
battle completes after both players finish. 7. Scores and winner are
calculated correctly. 8. XP and level are updated. 9. Results and
history are accessible.

## 12. Technology Summary

-   Frontend: React 19, Vite, React Router
-   HTTP client: Axios
-   Real-time communication: Socket.IO client/server
-   Backend: Node.js, Express
-   Database: MongoDB with Mongoose
-   Authentication: JWT
-   Password hashing: bcryptjs
-   Frontend deployment configuration: Vercel
-   Backend deployment target used by the project: Render
