# Student Record Management System

A responsive browser-based student directory built with HTML, CSS, JavaScript, Python Flask, and MySQL. Student records are stored in MySQL; the browser is only the user interface.

## Features
- Responsive dashboard with student totals and course/semester summaries
- Search student records by name, email, course, ID, or semester
- Add, view, update, and delete records directly in MySQL
- Input validation, duplicate-record feedback, confirmation before deletion, and database connection status
- Flask JSON API connects the browser interface to MySQL

## Project Structure
- `student_app.py` – Flask app and student CRUD API
- `database.py` – MySQL connection, validation, and CRUD functions
- `templates/index.html` – Dashboard markup
- `static/styles.css` – Responsive interface styling
- `static/app.js` – Search, form, and API interaction
- `schema.sql` – Database/table creation and sample data
- `requirements.txt` – Python dependencies

## Requirements
1. Python 3.10 or later
2. A running MySQL Server instance

## Database Setup
Run `schema.sql` in MySQL Workbench or a MySQL client. It creates `student_db`, the `students` table, and sample student records. The app can create the database and table at startup if the configured MySQL user has permission to create databases.

Configure the connection using environment variables (defaults are `localhost`, port `3306`, user `root`, empty password, database `student_db`):

```powershell
$env:MYSQL_HOST = "localhost"
$env:MYSQL_PORT = "3306"
$env:MYSQL_USER = "root"
$env:MYSQL_PASSWORD = "your_mysql_password"
$env:MYSQL_DATABASE = "student_db"
```

The password is supplied through your local environment and is not saved in this project.

## Install and Run

```powershell
pip install -r requirements.txt
python student_app.py
```

Open `http://127.0.0.1:5000` in a browser. Start MySQL before adding, viewing, updating, or deleting records.

## Demo Checklist
1. Show the student dashboard and MySQL connection status.
2. Add a record and verify it with `SELECT * FROM student_db.students;`.
3. Search for the record, then edit it and verify the updated values in MySQL.
4. Delete the record and verify it is no longer returned by the query.
5. Try invalid input or a duplicate student ID/email to demonstrate validation.

## Database Operations
- `INSERT` adds a student.
- `SELECT` loads all students for the dashboard.
- `UPDATE` edits student information by ID.
- `DELETE` removes a student by ID.

The HTML frontend sends requests to Flask; Flask uses parameterized SQL statements to communicate with MySQL. No student records are persisted in browser local storage.
