# Phase 1 Architecture

## Simple view

In Phase 1, the application has three main parts:

1. Frontend on Vercel
2. Backend on EC2
3. Database inside the backend server as SQLite

## User flow

1. The user opens the frontend in a browser.
2. The frontend sends requests to the Flask backend.
3. The Flask backend reads and writes task data in SQLite.
4. The frontend shows the latest task list.

## Why this is good for Phase 1

- Easy to understand
- Easy to run locally
- Easy to deploy
- Easy to upgrade later to real AWS-managed services

## What changes in later phases

- SQLite will be replaced by RDS
- file storage will move to S3
- multiple backend servers will be added with ELB and Auto Scaling
- shared storage can move to EFS
- logs and monitoring can move to CloudWatch
- the infrastructure can be created using CloudFormation