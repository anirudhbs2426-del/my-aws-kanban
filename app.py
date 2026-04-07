from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3  # This is the tool Python uses to talk to AWS
import os

app = Flask(__name__)
CORS(app)  # This allows your Vercel frontend to talk to this EC2 backend

# 1. Setup AWS Connections
# In a real scenario, IAM Roles (which we'll set up) give the EC2 permission
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
log_table = dynamodb.Table('KanbanLogs') 

@app.route('/')
def home():
    return "The Kanban Backend is Running on EC2!"

# 2. This endpoint handles moving a card
@app.route('/update', methods=['POST'])
def update_task():
    try:
        data = request.json
        task_id = data.get('id')
        new_status = data.get('status')

        # LOGIC FOR RDS (Relational Database)
        # Usually, you'd run a SQL command here to update the task position
        print(f"RDS Action: Updating Task {task_id} to {new_status}")

        # LOGIC FOR DYNAMODB (Non-Relational)
        # We will log every move here to satisfy the DynamoDB requirement
        log_table.put_item(
           Item={
                'logId': os.urandom(8).hex(),
                'taskId': task_id,
                'movement': f"Moved to {new_status}"
            }
        )

        return jsonify({"status": "success", "message": f"Task {task_id} moved to {new_status}"}), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # We run on port 5000 - we will need to open this in AWS Security Groups
    app.run(host='0.0.0.0', port=5000)