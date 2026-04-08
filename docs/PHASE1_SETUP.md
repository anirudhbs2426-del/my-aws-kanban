# Phase 1 Local Setup Guide

This guide helps you run the Kanban app on your own computer before deploying it.

## What you need

- Python 3.11 or later installed
- A code editor such as VS Code
- A web browser

## Step 1: Open the project folder

Open this repository in your editor or terminal.

## Step 2: Create a Python virtual environment

From the `backend/` folder, run:

```powershell
python -m venv .venv
```

## Step 3: Activate the virtual environment

```powershell
.venv\Scripts\Activate.ps1
```

## Step 4: Install backend packages

```powershell
pip install -r requirements.txt
```

## Step 5: Start the Flask backend

Still inside `backend/`, run:

```powershell
python app.py
```

The backend will start at:

```text
http://localhost:5000
```

## Step 6: Start a simple frontend server

Open a second terminal, move to the `frontend/` folder, and run:

```powershell
python -m http.server 5500
```

Then open this address in your browser:

```text
http://localhost:5500
```

## Step 7: Confirm it works

You should see:

- the Kanban dashboard page
- backend status showing healthy
- the ability to create, edit, delete, and move tasks
- drag-and-drop working between columns

## Notes

- The Phase 1 database is `SQLite`, stored in `backend/kanban.db`.
- This is only the starter version.
- Later, we will replace SQLite with AWS RDS.