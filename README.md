# Attendance & To-Do Application Backend

A robust backend service for managing attendance, tasks, and groups, built with Node.js, Express, and PostgreSQL.

## Features

- **User Authentication**: Secure registration and login using JWT.
- **Task Management**: Create, update, delete, and view tasks organized by groups.
- **Group Management**: collaborative groups for task sharing.
- **Comments**: Add comments to tasks (API support).
- **Dashboard**: Overview statistics (API support including streaks).
- **Database**: PostgreSQL integration with automatic table initialization.

## Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Configuration

Create a `.env` file in the root directory and configure the following environment variables:

```env
PORT=4000
DB_HOST=localhost
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=your_database_name
DB_PORT=5432
JWT_SECRET_KEY=your_very_secret_key
```

> **Note**: The application will automatically attempt to create the necessary tables (`users`, `groups`, `tasks`, `user_streaks`, `comments`) and a default admin user if the database is empty.

## Running the Application

- **Development Mode** (with hot-reloading via nodemon):
    ```bash
    npm run dev
    ```

- **Production Start**:
    ```bash
    npm start
    ```

The server will start on `http://localhost:4000` (or the port specified in your `.env`).

## API Documentation

### Authentication (`/api/auth`)
- `POST /register`: Register a new user.
- `POST /login`: Login and receive a JWT token.

### Groups (`/api/groups`)
*Requires Authentication Header: `Authorization: Bearer <token>`*
- `POST /`: Create a new group.
- `GET /`: Get all groups.
- `PUT /:id`: Update a group.
- `DELETE /:id`: Delete a group.

### Tasks (`/api/tasks`)
*Requires Authentication Header: `Authorization: Bearer <token>`*
- `POST /`: Create a new task.
- `GET /group/:groupId`: Get tasks for a specific group.
- `PUT /:id`: Update a task.
- `DELETE /:id`: Delete a task.

### Other Endpoints
- **Comments** (`/api/comments`): Manage task comments.
- **Dashboard** (`/api/dashboard`): Fetch user statistics and streaks.

## Project Structure

```
├── src
│   ├── config      # Database connection and initialization
│   ├── controller  # Request handlers
│   ├── middleware  # Middleware (Auth, etc.)
│   ├── routes      # API Route definitions
│   └── service     # Business logic
├── index.js        # Entry point
└── package.json
```

## License
ISC
