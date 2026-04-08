// 1. This part makes the "Drag and Drop" visually work
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    var targetColumn = ev.target;

    // Ensure we are dropping on a column, not another card
    if (targetColumn.classList.contains('column')) {
        targetColumn.appendChild(document.getElementById(data));
        
        // After dropping, tell the AWS Backend about the move
        saveTaskMovement(data, targetColumn.id);
    }
}

// 2. This part sends the data to your EC2 Server
async function saveTaskMovement(taskId, newState) {
    // IMPORTANT: Replace the IP below with your EC2 Public IP address
    const ec2Ip = "13.48.4.202"; 
    
    try {
        const response = await fetch(`http://${ec2Ip}:5000/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: taskId,
                status: newState
            })
        });

        const result = await response.json();
        console.log("Success:", result.message);
    } catch (error) {
        console.error("Error connecting to EC2:", error);
        alert("Could not connect to the Backend. Check if your EC2 is running and Port 5000 is open!");
    }
}