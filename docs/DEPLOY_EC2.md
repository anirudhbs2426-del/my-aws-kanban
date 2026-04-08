# Deploy Backend to EC2

If you want the full beginner-friendly walkthrough, use:

- `docs/EC2_DEPLOYMENT_STEP_BY_STEP.md`

This file is the short version.

## What EC2 does here

EC2 is your backend server. It runs the Flask API.

## Simple Phase 1 path

1. Launch one Ubuntu EC2 instance.
2. Install Python, Nginx, and Git.
3. Copy or clone this project to the server.
4. Create a Python virtual environment in `backend/`.
5. Install the packages from `requirements.txt`.
6. Run Gunicorn.
7. Add the `systemd` service from `deploy/kanban-backend.service`.
8. Add the Nginx config from `deploy/nginx-kanban.conf`.
9. Allow HTTP traffic in the EC2 security group.
10. Open the EC2 public IP in your browser and test `/health`.

## Files prepared for you

- `deploy/kanban-backend.service`
- `deploy/nginx-kanban.conf`
- `docs/EC2_DEPLOYMENT_STEP_BY_STEP.md`

## Reminder

This is still the simple version with SQLite on one server.
Later, we will upgrade this backend to use:

- RDS
- S3
- ELB
- Auto Scaling
- EFS
- CloudWatch
- IAM
- KMS
- CloudFormation