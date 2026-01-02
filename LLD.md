# Low Level Design (LLD): Attendance & To-Do Application Backend

## 1. Introduction
This document provides the low-level design for the backend of the Attendance & To-Do Application. It details the system architecture, database schema, component design, and data flow.

## 2. System Architecture
The application follows the **Model-View-Controller (MVC)** architectural pattern (specifically Controller-Service-Repository layers), built using **Node.js** and **Express**.

*   **Presentation Layer (Routes)**: Defines API endpoints and routes requests to the appropriate controllers.
*   **Controller Layer**: Handles incoming HTTP requests, validates input, and orchestrates calls to the service layer.
*   **Service Layer**: Contains the core business logic. It interacts with the database via the connection pool.
*   **Data Access Layer**: Direct database interactions using `pg` (node-postgres).
*   **Database**: PostgreSQL relational database.

## 3. Tech Stack
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL
*   **Authentication**: JWT (JSON Web Tokens)
*   **Security**: bcrypt (Password hashing), cors (Cross-Origin Resource Sharing)

## 4. Database Design (Schema)

The database consists of the following key tables:

### 4.1. `users`
Stores user account information.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR(100) | NOT NULL | User's full name |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | User's email address |
| `password` | TEXT | NOT NULL | Hashed password |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation time |

### 4.2. `groups`
Represents user-created groups for organizing tasks.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique group identifier |
| `user_id` | INT | FK -> users(id) | Owner of the group |
| `name` | VARCHAR(100) | NOT NULL | Group name |
| `description` | TEXT | | Optional description |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

### 4.3. `tasks`
Stores individual tasks associated with groups.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique task identifier |
| `group_id` | INT | FK -> groups(id) | Parent group |
| `title` | TEXT | NOT NULL | Task title |
| `description` | TEXT | | Detailed description |
| `status` | VARCHAR | | Task status (TODO, DONE, etc.) |
| `priority` | VARCHAR | DEFAULT 'MEDIUM' | Task priority (LOW, MEDIUM, HIGH) |
| `progress` | INT | | Progress percentage (0-100) |
| `completed` | BOOLEAN | DEFAULT FALSE | Completion flag |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | | Last update time |

### 4.4. `streaks` / `user_streaks`
Tracks user activity streaks.
*Note: `user_streaks` is initialized in default config, but `streaks` is used in service logic.*
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | INT | FK -> users(id) | User identifier |
| `current_streak` | INT | | Current active streak count |
| `last_active_date` | DATE | | Date of last registered activity |

### 4.5. `comments`
Stores comments on tasks.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL | PRIMARY KEY | Unique comment identifier |
| `task_id` | INT | FK -> tasks(id) | Parent task |
| `user_id` | INT | FK -> users(id) | Author of the comment |
| `comment` | TEXT | NOT NULL | Comment content |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

## 5. Component Design

### 5.1. Authentication Module
*   **Auth Controller**: 
    *   `registerController`: Hashes password, creates user.
    *   `loginController`: Verifies credentials, issues JWT.
*   **Auth Service**: 
    *   `registerService`: DB insertion logic.
    *   `loginService`: DB lookup and bcrypt comparison.

### 5.2. Task Management Module
*   **Task Controller**: 
    *   `createTask`: Calls service to add task.
    *   `updateTask`: Updates task details and triggers streak update.
    *   `deleteTask`: Removes task.
*   **Task Service**: 
    *   `createTaskService`: Validates group ownership, inserts task.
    *   `updateTaskService`: Syncs `status` <-> `progress`, updates DB.
    *   `deleteTaskService`: Removes task belonging to user's group.

### 5.3. Dashboard & Analytics Module
*   **Dashboard Controller**: 
    *   `getDashboard`: Aggregates stats.
    *   `getStreak`: Fetches streak info.
*   **Dashboard Service**: 
    *   `getDashboardService`: Complex SQL queries to fetch:
        *   Group counts
        *   Task completion stats
        *   Priority distribution
        *   Recent tasks
        *   Weekly activity graph values
*   **Streak Service**:
    *   `updateStreakService`: Logic to increment streak if active today vs yesterday.

## 6. Sequence Diagrams

### 6.1. User Login Flow
```mermaid
sequenceDiagram
    participant Client
    participant AuthController
    participant AuthService
    participant Database

    Client->>AuthController: POST /login {email, password}
    AuthController->>AuthService: loginService(email, password)
    AuthService->>Database: SELECT * FROM users WHERE email...
    Database-->>AuthService: User Record
    AuthService->>AuthService: bcrypt.compare(password, hash)
    
    alt Invalid Credentials
        AuthService-->>AuthController: Throw Error (401)
        AuthController-->>Client: 401 Unauthorized
    else Valid Credentials
        AuthService->>AuthService: Generate JWT
        AuthService-->>AuthController: {token, userData}
        AuthController-->>Client: 200 OK + Token
    end
```

### 6.2. Create Task Flow
```mermaid
sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant TaskController
    participant TaskService
    participant Database

    Client->>AuthMiddleware: POST /tasks (Header: Bearer Token)
    AuthMiddleware->>AuthMiddleware: Verify JWT
    AuthMiddleware-->>TaskController: Request (with req.user)
    TaskController->>TaskService: createTaskService(userId, body)
    TaskService->>Database: SELECT FROM groups WHERE id=groupId AND user_id=userId
    
    alt Group Access Denied
        Database-->>TaskService: Empty result
        TaskService-->>TaskController: Throw Error (403)
        TaskController-->>Client: 403 Forbidden
    else Group Valid
        Database-->>TaskService: Group Record
        TaskService->>Database: INSERT INTO tasks...
        Database-->>TaskService: New Task Data
        TaskService-->>TaskController: Task Object
        TaskController-->>Client: 201 Created
    end
```

### 6.3. Task Completion & Streak Update
```mermaid
sequenceDiagram
    participant Client
    participant TaskController
    participant TaskService
    participant StreakService
    participant Database

    Client->>TaskController: PUT /tasks/:id {status: "DONE"}
    TaskController->>TaskService: updateTaskService(...)
    TaskService->>Database: UPDATE tasks...
    Database-->>TaskService: Updated Task
    TaskService-->>TaskController: Task Object
    
    rect rgb(200, 255, 200)
    Note right of TaskController: Updates Streak Sychronously
    TaskController->>StreakService: updateStreakService(userId)
    StreakService->>Database: SELECT streak FROM streaks...
    StreakService->>StreakService: Calculate new streak logic
    StreakService->>Database: UPDATE streaks...
    end
    
    TaskController-->>Client: 200 OK (Task Updated)
```
