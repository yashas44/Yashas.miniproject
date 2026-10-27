from flask import Flask, jsonify, render_template, request

from database import (
    add_student,
    delete_student,
    get_all_students,
    initialize_database,
    update_student,
)

app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/students")
def list_students():
    try:
        rows = get_all_students()
        students = [
            {
                "student_id": row[0],
                "name": row[1],
                "email": row[2],
                "course": row[3],
                "semester": row[4],
            }
            for row in rows
        ]
        return jsonify(students=students)
    except RuntimeError as exc:
        return jsonify(error=str(exc)), 503


@app.post("/api/students")
def create_student():
    data = request.get_json(silent=True) or {}
    try:
        add_student(
            data.get("student_id"),
            data.get("name"),
            data.get("email"),
            data.get("course"),
            data.get("semester"),
        )
        return jsonify(message="Student added successfully."), 201
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    except RuntimeError as exc:
        return jsonify(error=str(exc)), 503


@app.put("/api/students/<int:student_id>")
def edit_student(student_id):
    data = request.get_json(silent=True) or {}
    try:
        updated = update_student(
            student_id,
            data.get("name"),
            data.get("email"),
            data.get("course"),
            data.get("semester"),
        )
        if not updated:
            return jsonify(error="No student was found with that ID."), 404
        return jsonify(message="Student updated successfully.")
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    except RuntimeError as exc:
        return jsonify(error=str(exc)), 503


@app.delete("/api/students/<int:student_id>")
def remove_student(student_id):
    try:
        if not delete_student(student_id):
            return jsonify(error="No student was found with that ID."), 404
        return jsonify(message="Student deleted successfully.")
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    except RuntimeError as exc:
        return jsonify(error=str(exc)), 503


if __name__ == "__main__":
    try:
        initialize_database()
        print("MySQL database is ready.")
    except RuntimeError as exc:
        print(f"MySQL is not ready yet: {exc}")
        print("Start MySQL and check MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.")

    app.run(host="127.0.0.1", port=5000, debug=False)
