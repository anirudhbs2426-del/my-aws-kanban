# EC2 Deployment Step by Step

This is the beginner-friendly guide for deploying the Flask backend to one EC2 server.

## Goal

By the end of this guide, your backend should be reachable from the internet using your EC2 public IP.

Example:

```text
http://YOUR-EC2-PUBLIC-IP/health
```

## What we are deploying in this phase

- one EC2 instance
- one Flask backend
- Gunicorn to run the Flask app
- Nginx in front of Gunicorn
- SQLite stored on the EC2 server itself

This is the simple learning version before we move to RDS, ELB, Auto Scaling, and the other AWS services.

## Before you start

Make sure you already have:

- an AWS account
- access to the AWS Management Console
- this project pushed to GitHub or available on your computer
- your Phase 1 app working locally

## Step 1: Launch the EC2 instance

In AWS Console:

1. Open `EC2`.
2. Click `Launch instance`.
3. Give it a name such as `kanban-backend-phase1`.
4. Choose `Ubuntu Server`.
5. Choose an instance type such as `t2.micro` or `t3.micro`.
6. Create or select a key pair.
7. In network settings, allow:
   - `SSH` from your IP address
   - `HTTP` from the internet
8. Launch the instance.

## Step 2: Connect to the EC2 instance

After the instance is running, connect using SSH.

On Windows PowerShell, the command looks like this:

```powershell
ssh -i C:\path\to\your-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

Replace:

- `C:\path\to\your-key.pem` with your key file path
- `YOUR-EC2-PUBLIC-IP` with the EC2 public IP shown in AWS

## Step 3: Install server software

Run these commands on the EC2 server:

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx git -y
```

## Step 4: Copy your project to EC2

If your code is on GitHub:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git AWS_Challenge
```

Then go into the project:

```bash
cd AWS_Challenge
```

If your repository is private, you can instead upload it manually or set up GitHub access on the server.

## Step 5: Set up the backend Python environment

Move into the backend folder:

```bash
cd backend
```

Create the virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

Install the packages:

```bash
pip install -r requirements.txt
```

## Step 6: Create the backend environment file

Copy the example file:

```bash
cp .env.example .env
```

Now open it:

```bash
nano .env
```

For the simple EC2 phase, you can use values like this:

```text
SECRET_KEY=replace-this-with-a-long-random-value
DATABASE_URL=sqlite:///kanban.db
FRONTEND_ORIGIN=*
```

For now, `FRONTEND_ORIGIN=*` keeps things simple.
Later, when Vercel is connected, you can lock this down to your Vercel URL.

## Step 7: Test Gunicorn manually

While still inside `backend/`, run:

```bash
.venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 wsgi:app
```

This starts the backend locally on the EC2 machine.

Open a second SSH session and test it:

```bash
curl http://127.0.0.1:8000/health
```

You should get a healthy response.

Press `Ctrl + C` in the first SSH window to stop Gunicorn after testing.

## Step 8: Create the systemd service

This makes the backend start automatically and stay running.

From the project root on EC2, copy the provided file:

```bash
sudo cp deploy/kanban-backend.service /etc/systemd/system/kanban-backend.service
```

Reload systemd:

```bash
sudo systemctl daemon-reload
```

Enable the service:

```bash
sudo systemctl enable kanban-backend
```

Start the service:

```bash
sudo systemctl start kanban-backend
```

Check status:

```bash
sudo systemctl status kanban-backend
```

If you want to view logs:

```bash
sudo journalctl -u kanban-backend -f
```

## Step 9: Configure Nginx

Nginx will listen on port 80 and forward requests to Gunicorn.

Copy the provided Nginx config:

```bash
sudo cp ../deploy/nginx-kanban.conf /etc/nginx/sites-available/kanban-backend
```

If you are already in the project root instead of `backend/`, use this instead:

```bash
sudo cp deploy/nginx-kanban.conf /etc/nginx/sites-available/kanban-backend
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/kanban-backend /etc/nginx/sites-enabled/kanban-backend
```

Remove the default site if needed:

```bash
sudo rm /etc/nginx/sites-enabled/default
```

Test the Nginx config:

```bash
sudo nginx -t
```

Restart Nginx:

```bash
sudo systemctl restart nginx
```

## Step 10: Test from your browser

Open this in your browser:

```text
http://YOUR-EC2-PUBLIC-IP/health
```

You should see a healthy JSON response.

You can also test:

```text
http://YOUR-EC2-PUBLIC-IP/api/tasks
```

## Step 11: Important EC2 notes

In this simple version:

- the backend is running on one EC2 instance
- SQLite is stored on the same server
- if the server is deleted, the local database is lost unless you back it up

This is why later we will move the database to `RDS`.

## Step 12: After backend success

Once EC2 backend works, the next steps are:

1. Update `frontend/api.js` so the API base URL points to your EC2 public IP or domain.
2. Deploy the frontend to Vercel.
3. Confirm the frontend can talk to the backend.
4. Then begin the AWS service upgrades one by one.

## Common problems and fixes

### Problem: `/health` does not open in browser

Check:

- EC2 instance is running
- security group allows port 80
- Nginx is running
- Gunicorn service is running

Useful commands:

```bash
sudo systemctl status kanban-backend
sudo systemctl status nginx
```

### Problem: CORS error in browser

Set `FRONTEND_ORIGIN` in `backend/.env`.

Example:

```text
FRONTEND_ORIGIN=http://localhost:5500,https://your-vercel-project.vercel.app
```

Then restart the backend service:

```bash
sudo systemctl restart kanban-backend
```

### Problem: package install failed

Make sure the virtual environment is active:

```bash
source .venv/bin/activate
```

Then try again:

```bash
pip install -r requirements.txt
```

## Files included in this repository for deployment

- `deploy/kanban-backend.service`
- `deploy/nginx-kanban.conf`
- `backend/.env.example`