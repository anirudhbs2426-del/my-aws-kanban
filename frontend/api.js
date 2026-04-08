(function attachApiClient(windowObject) {
  const isLocalDevelopment =
    windowObject.location.hostname === "localhost" ||
    windowObject.location.hostname === "127.0.0.1";
  const fallbackLocalApi = "http://localhost:5000";
  const fallbackProductionApi = windowObject.location.origin;
  const configuredApiBase =
    windowObject.KANBAN_API_BASE_URL ||
    (isLocalDevelopment ? fallbackLocalApi : fallbackProductionApi);

  async function request(path, options = {}) {
    const url = new URL(path, configuredApiBase).toString();
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      const message =
        payload?.message || "The server returned an unexpected response.";
      throw new Error(message);
    }

    return payload;
  }

  windowObject.kanbanApi = {
    baseUrl: configuredApiBase,
    getHealth() {
      return request("/health");
    },
    listTasks() {
      return request("/api/tasks");
    },
    createTask(task) {
      return request("/api/tasks", {
        method: "POST",
        body: JSON.stringify(task),
      });
    },
    updateTask(taskId, task) {
      return request(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(task),
      });
    },
    updateTaskStatus(taskId, status) {
      return request(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    deleteTask(taskId) {
      return request(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    },
  };
})(window);