import os
import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "student_db"),
    "autocommit": True,
}


def get_connection():
    return mysql.connector.connect(**DB_CONFIG)


def initialize_database():
    try:
        connection = mysql.connector.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            autocommit=True,
        )
        cursor = connection.cursor()
        database_name = DB_CONFIG["database"].replace("`", "``")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{database_name}`")
        cursor.close()
        connection.close()

        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS students (
                student_id INT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(120) NOT NULL UNIQUE,
                course VARCHAR(80) NOT NULL,
                semester INT NOT NULL CHECK (semester > 0)
            )
            """
        )
        connection.commit()
        cursor.close()
        connection.close()
        return True
    except Error as exc:
        raise RuntimeError(f"Database setup failed: {exc}") from exc


def validate_student_data(student_id, name, email, course, semester):
    if not student_id or not name or not email or not course or not semester:
        raise ValueError("All fields are required.")

    try:
        student_id = int(student_id)
        semester = int(semester)
    except ValueError as exc:
        raise ValueError("Student ID and semester must be valid numbers.") from exc

    if student_id <= 0 or semester <= 0:
        raise ValueError("Student ID and semester must be greater than zero.")

    if "@" not in email or "." not in email:
        raise ValueError("Please enter a valid email address.")

    return student_id, name.strip(), email.strip(), course.strip(), semester


def add_student(student_id, name, email, course, semester):
    student_id, name, email, course, semester = validate_student_data(
        student_id, name, email, course, semester
    )

    query = """
        INSERT INTO students (student_id, name, email, course, semester)
        VALUES (%s, %s, %s, %s, %s)
    """
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(query, (student_id, name, email, course, semester))
        connection.commit()
        cursor.close()
        connection.close()
        return True
    except Error as exc:
        if "Duplicate entry" in str(exc):
            raise ValueError("A student with this ID or email already exists.") from exc
        raise RuntimeError(f"Error adding student: {exc}") from exc


def get_all_students():
    query = "SELECT student_id, name, email, course, semester FROM students ORDER BY student_id"
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        connection.close()
        return rows
    except Error as exc:
        raise RuntimeError(f"Error retrieving students: {exc}") from exc


def update_student(student_id, name, email, course, semester):
    student_id, name, email, course, semester = validate_student_data(
        student_id, name, email, course, semester
    )

    query = """
        UPDATE students
        SET name = %s, email = %s, course = %s, semester = %s
        WHERE student_id = %s
    """
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT student_id FROM students WHERE student_id = %s", (student_id,))
        if cursor.fetchone() is None:
            cursor.close()
            connection.close()
            return False
        cursor.execute(query, (name, email, course, semester, student_id))
        connection.commit()
        cursor.close()
        connection.close()
        return True
    except Error as exc:
        raise RuntimeError(f"Error updating student: {exc}") from exc


def delete_student(student_id):
    try:
        student_id = int(student_id)
    except ValueError as exc:
        raise ValueError("Student ID must be a valid number.") from exc

    if student_id <= 0:
        raise ValueError("Student ID must be greater than zero.")

    query = "DELETE FROM students WHERE student_id = %s"
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(query, (student_id,))
        connection.commit()
        row_count = cursor.rowcount
        cursor.close()
        connection.close()
        return row_count > 0
    except Error as exc:
        raise RuntimeError(f"Error deleting student: {exc}") from exc
