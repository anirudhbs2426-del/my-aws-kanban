(function kanbanApp(windowObject, documentObject) {
  const STATUSES = ["To Do", "In Progress", "Done"];
  const state = {
    tasks: [],
    editingTaskId: null,
    draggedTaskId: null,
  };

  const elements = {
    taskForm: documentObject.getElementById("taskForm"),
    taskId: documentObject.getElementById("taskId"),
    title: documentObject.getElementById("title"),
    description: documentObject.getElementById("description"),
    priority: documentObject.getElementById("priority"),
    status: documentObject.getElementById("status"),
    dueDate: documentObject.getElementById("dueDate"),
    formTitle: documentObject.getElementById("formTitle"),
    submitButton: documentObject.getElementById("submitButton"),
    resetButton: documentObject.getElementById("resetButton"),
    healthStatus: documentObject.getElementById("healthStatus"),
    apiBaseLabel: documentObject.getElementById("apiBaseLabel"),
    messageBanner: documentObject.getElementById("messageBanner"),
    totalTasks: documentObject.getElementById("totalTasks"),
    todoCount: documentObject.getElementById("todoCount"),
    inProgressCount: documentObject.getElementById("inProgressCount"),
    doneCount: documentObject.getElementById("doneCount"),
    todoBadge: documentObject.getElementById("todoBadge"),
    inProgressBadge: documentObject.getElementById("inProgressBadge"),
    doneBadge: documentObject.getElementById("doneBadge"),
    todoColumn: documentObject.getElementById("todoColumn"),
    inProgressColumn: documentObject.getElementById("inProgressColumn"),
    doneColumn: documentObject.getElementById("doneColumn"),
    taskCardTemplate: documentObject.getElementById("taskCardTemplate"),
  };

  function showMessage(message, type = "info") {
    elements.messageBanner.textContent = message;
    elements.messageBanner.className = `message-banner message-${type}`;
  }

  function clearMessage() {
    elements.messageBanner.textContent = "";
    elements.messageBanner.className = "message-banner hidden";
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "No due date";
    }

    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function normalizePriority(priority) {
    return `priority-${priority.toLowerCase()}`;
  }

  function getColumnElement(status) {
    if (status === "To Do") return elements.todoColumn;
    if (status === "In Progress") return elements.inProgressColumn;
    return elements.doneColumn;
  }

  function getColumnPanel(status) {
    return getColumnElement(status).closest(".board-column");
  }

  function getTaskById(taskId) {
    return state.tasks.find((task) => task.id === taskId);
  }

  function clearDropzoneStates() {
    STATUSES.forEach((status) => {
      getColumnElement(status).classList.remove("is-drop-target");
      getColumnPanel(status).classList.remove("column-active");
    });
  }

  function setDropzoneState(status) {
    clearDropzoneStates();
    getColumnElement(status).classList.add("is-drop-target");
    getColumnPanel(status).classList.add("column-active");
  }

  function setHealthStatus(isHealthy, label) {
    elements.healthStatus.textContent = label;
    elements.healthStatus.className = `status-pill ${
      isHealthy ? "status-success" : "status-error"
    }`;
  }

  function updateSummary() {
    const counts = {
      "To Do": 0,
      "In Progress": 0,
      Done: 0,
    };

    state.tasks.forEach((task) => {
      counts[task.status] += 1;
    });

    elements.totalTasks.textContent = String(state.tasks.length);
    elements.todoCount.textContent = String(counts["To Do"]);
    elements.inProgressCount.textContent = String(counts["In Progress"]);
    elements.doneCount.textContent = String(counts.Done);
    elements.todoBadge.textContent = String(counts["To Do"]);
    elements.inProgressBadge.textContent = String(counts["In Progress"]);
    elements.doneBadge.textContent = String(counts.Done);
  }

  function renderEmptyState(columnElement, status) {
    const empty = documentObject.createElement("div");
    empty.className = "empty-state";
    empty.textContent = `No tasks in ${status}.`;
    columnElement.appendChild(empty);
  }

  function handleDragStart(event, taskId) {
    state.draggedTaskId = taskId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(taskId));
    event.currentTarget.classList.add("dragging");
  }

  function handleDragEnd(event) {
    state.draggedTaskId = null;
    event.currentTarget.classList.remove("dragging");
    clearDropzoneStates();
  }

  function renderTaskCard(task) {
    const fragment = elements.taskCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".task-card");
    const priorityPill = fragment.querySelector(".priority-pill");
    const taskDate = fragment.querySelector(".task-date");
    const taskTitle = fragment.querySelector(".task-title");
    const taskDescription = fragment.querySelector(".task-description");
    const statusSelect = fragment.querySelector(".task-status-select");
    const editButton = fragment.querySelector(".edit-button");
    const deleteButton = fragment.querySelector(".delete-button");

    priorityPill.textContent = task.priority;
    priorityPill.classList.add(normalizePriority(task.priority));
    taskDate.textContent = formatDate(task.due_date);
    taskTitle.textContent = task.title;
    taskDescription.textContent = task.description || "No description provided.";
    statusSelect.value = task.status;

    card.dataset.taskId = String(task.id);
    card.setAttribute("draggable", "true");
    card.addEventListener("dragstart", (event) => handleDragStart(event, task.id));
    card.addEventListener("dragend", handleDragEnd);

    statusSelect.addEventListener("change", async (event) => {
      await handleStatusChange(task.id, event.target.value);
    });

    editButton.addEventListener("click", () => populateForm(task));
    deleteButton.addEventListener("click", async () => {
      const confirmed = windowObject.confirm(
        `Delete the task "${task.title}"?`
      );

      if (!confirmed) {
        return;
      }

      try {
        await windowObject.kanbanApi.deleteTask(task.id);
        state.tasks = state.tasks.filter((item) => item.id !== task.id);
        renderBoard();
        showMessage("Task deleted successfully.");
        if (state.editingTaskId === task.id) {
          resetForm();
        }
      } catch (error) {
        showMessage(error.message, "error");
      }
    });

    return fragment;
  }

  function renderBoard() {
    STATUSES.forEach((status) => {
      const column = getColumnElement(status);
      column.innerHTML = "";

      const tasksForStatus = state.tasks.filter((task) => task.status === status);
      if (tasksForStatus.length === 0) {
        renderEmptyState(column, status);
        return;
      }

      tasksForStatus.forEach((task) => {
        column.appendChild(renderTaskCard(task));
      });
    });

    updateSummary();
  }

  function populateForm(task) {
    state.editingTaskId = task.id;
    elements.taskId.value = task.id;
    elements.title.value = task.title;
    elements.description.value = task.description || "";
    elements.priority.value = task.priority;
    elements.status.value = task.status;
    elements.dueDate.value = task.due_date || "";
    elements.formTitle.textContent = "Edit Task";
    elements.submitButton.textContent = "Update Task";
    windowObject.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    state.editingTaskId = null;
    elements.taskForm.reset();
    elements.taskId.value = "";
    elements.priority.value = "Medium";
    elements.status.value = "To Do";
    elements.formTitle.textContent = "Create a New Task";
    elements.submitButton.textContent = "Add Task";
  }

  function getFormPayload() {
    return {
      title: elements.title.value.trim(),
      description: elements.description.value.trim(),
      priority: elements.priority.value,
      status: elements.status.value,
      due_date: elements.dueDate.value || null,
    };
  }

  async function loadTasks() {
    try {
      const payload = await windowObject.kanbanApi.listTasks();
      state.tasks = payload.tasks || [];
      renderBoard();
      clearMessage();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function handleStatusChange(taskId, newStatus, options = {}) {
    const task = getTaskById(taskId);
    if (!task) {
      return;
    }

    if (task.status === newStatus) {
      clearDropzoneStates();
      if (options.fromDrag) {
        showMessage(`Task is already in ${newStatus}.`);
      }
      return;
    }

    try {
      const payload = await windowObject.kanbanApi.updateTaskStatus(
        taskId,
        newStatus
      );
      state.tasks = state.tasks.map((item) =>
        item.id === taskId ? payload.task : item
      );
      renderBoard();
      clearDropzoneStates();
      showMessage(`Task moved to ${newStatus}.`);
    } catch (error) {
      clearDropzoneStates();
      showMessage(error.message, "error");
      await loadTasks();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = getFormPayload();

    if (!payload.title) {
      showMessage("Task title is required.", "error");
      return;
    }

    try {
      if (state.editingTaskId) {
        const response = await windowObject.kanbanApi.updateTask(
          state.editingTaskId,
          payload
        );
        state.tasks = state.tasks.map((task) =>
          task.id === state.editingTaskId ? response.task : task
        );
        showMessage("Task updated successfully.");
      } else {
        const response = await windowObject.kanbanApi.createTask(payload);
        state.tasks = [response.task, ...state.tasks];
        showMessage("Task created successfully.");
      }

      resetForm();
      renderBoard();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function checkHealth() {
    elements.apiBaseLabel.textContent = `API Base URL: ${windowObject.kanbanApi.baseUrl}`;

    try {
      const payload = await windowObject.kanbanApi.getHealth();
      setHealthStatus(true, payload.status || "Healthy");
    } catch (error) {
      setHealthStatus(false, "Unavailable");
      showMessage(
        "The backend could not be reached. Start Flask locally or update the API base URL before deploying.",
        "error"
      );
    }
  }

  function registerDropzones() {
    STATUSES.forEach((status) => {
      const column = getColumnElement(status);

      column.addEventListener("dragenter", (event) => {
        if (state.draggedTaskId === null) {
          return;
        }

        event.preventDefault();
        setDropzoneState(status);
      });

      column.addEventListener("dragover", (event) => {
        if (state.draggedTaskId === null) {
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDropzoneState(status);
      });

      column.addEventListener("drop", async (event) => {
        event.preventDefault();

        const taskId = Number(event.dataTransfer.getData("text/plain")) || state.draggedTaskId;
        if (!taskId) {
          clearDropzoneStates();
          return;
        }

        await handleStatusChange(taskId, status, { fromDrag: true });
      });
    });
  }

  function registerEvents() {
    elements.taskForm.addEventListener("submit", handleSubmit);
    elements.resetButton.addEventListener("click", () => {
      resetForm();
      clearMessage();
    });
    registerDropzones();
  }

  async function initialize() {
    registerEvents();
    renderBoard();
    await checkHealth();
    await loadTasks();
  }

  initialize();
})(window, document);