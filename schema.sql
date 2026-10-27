CREATE DATABASE IF NOT EXISTS student_db;
USE student_db;

CREATE TABLE IF NOT EXISTS students (
    student_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    course VARCHAR(80) NOT NULL,
    semester INT NOT NULL CHECK (semester > 0)
);

INSERT INTO students (student_id, name, email, course, semester)
VALUES
    (101, 'Aisha Khan', 'aisha.khan@example.com', 'Computer Science', 5),
    (102, 'Rahul Mehta', 'rahul.mehta@example.com', 'Information Technology', 4),
    (103, 'Sneha Nair', 'sneha.nair@example.com', 'Electronics', 6)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    course = VALUES(course),
    semester = VALUES(semester);
