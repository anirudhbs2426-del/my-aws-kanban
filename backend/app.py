from datetime import datetime
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import Config
from database import db
from models import Task, VALID_PRIORITIES, VALID_STATUSES


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(
        app,
        resources={r"/*": {"origins": app.config["FRONTEND_ORIGIN"]}},
        supports_credentials=False,
    )

    with app.app_context():
        db.create_all()

    register_routes(app)
    return app


def parse_due_date(date_value):
    if not date_value:
        return None

    try:
        return datetime.strptime(date_value, "%Y-%m-%d").date()
    except ValueError as error:
        raise ValueError("Due date must be in YYYY-MM-DD format.") from error


def validate_task_payload(payload):
    errors = []
    title = (payload.get("title") or "").strip()
    description = (payload.get("description") or "").strip()
    status = payload.get("status")
    priority = payload.get("priority")
    due_date = payload.get("due_date")

    if not title:
        errors.append("Task title is required.")

    if status is not None and status not in VALID_STATUSES:
        errors.append("Status must be To Do, In Progress, or Done.")

    if priority is not None and priority not in VALID_PRIORITIES:
        errors.append("Priority must be Low, Medium, or High.")

    parsed_due_date = None
    if "due_date" in payload:
        try:
            parsed_due_date = parse_due_date(due_date)
        except ValueError as error:
            errors.append(str(error))

    return {
        "errors": errors,
        "data": {
            "title": title,
            "description": description,
            "status": status,
            "priority": priority,
            "due_date": parsed_due_date,
        },
    }


def register_routes(app):
    @app.get("/health")
    def health():
        return jsonify({"status": "healthy", "service": "kanban-backend"}), 200

    @app.get("/api/tasks")
    def list_tasks():
        tasks = Task.query.order_by(Task.created_at.desc()).all()
        return jsonify({"tasks": [task.to_dict() for task in tasks]}), 200

    @app.post("/api/tasks")
    def create_task():
        payload = request.get_json(silent=True) or {}
        result = validate_task_payload(payload)

        if result["errors"]:
            return jsonify({"message": " ".join(result["errors"])}), 400

        task = Task(
            title=result["data"]["title"],
            description=result["data"]["description"],
            status=result["data"]["status"] or "To Do",
            priority=result["data"]["priority"] or "Medium",
            due_date=result["data"]["due_date"],
        )
        db.session.add(task)
        db.session.commit()
        return jsonify({"message": "Task created.", "task": task.to_dict()}), 201

    @app.put("/api/tasks/<int:task_id>")
    def update_task(task_id):
        task = Task.query.get_or_404(task_id)
        payload = request.get_json(silent=True) or {}
        result = validate_task_payload(payload)

        if result["errors"]:
            return jsonify({"message": " ".join(result["errors"])}), 400

        task.title = result["data"]["title"]
        task.description = result["data"]["description"]
        task.status = result["data"]["status"] or task.status
        task.priority = result["data"]["priority"] or task.priority
        task.due_date = result["data"]["due_date"]
        db.session.commit()
        return jsonify({"message": "Task updated.", "task": task.to_dict()}), 200

    @app.patch("/api/tasks/<int:task_id>/status")
    def update_task_status(task_id):
        task = Task.query.get_or_404(task_id)
        payload = request.get_json(silent=True) or {}
        status = payload.get("status")

        if status not in VALID_STATUSES:
            return (
                jsonify({"message": "Status must be To Do, In Progress, or Done."}),
                400,
            )

        task.status = status
        db.session.commit()
        return jsonify({"message": "Task status updated.", "task": task.to_dict()}), 200

    @app.delete("/api/tasks/<int:task_id>")
    def delete_task(task_id):
        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted."}), 200


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
