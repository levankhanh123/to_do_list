const state = {
  view: "today",
  filter: "all",
  imageDraft: "",
  tasks: [],
  moods: [],
};

const storageKey = "daily-corner-state-v1";
const todayISO = toLocalISO(new Date());

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  taskTitle: document.querySelector("#taskTitle"),
  taskForm: document.querySelector("#taskForm"),
  taskName: document.querySelector("#taskName"),
  taskCategory: document.querySelector("#taskCategory"),
  taskPriority: document.querySelector("#taskPriority"),
  taskDate: document.querySelector("#taskDate"),
  taskList: document.querySelector("#taskList"),
  progressPercent: document.querySelector("#progressPercent"),
  progressText: document.querySelector("#progressText"),
  moodForm: document.querySelector("#moodForm"),
  moodPhoto: document.querySelector("#moodPhoto"),
  photoPreview: document.querySelector("#photoPreview"),
  photoPlaceholder: document.querySelector("#photoPlaceholder"),
  moodCaption: document.querySelector("#moodCaption"),
  timeline: document.querySelector("#timeline"),
  quickDialog: document.querySelector("#quickDialog"),
};

const viewTitles = {
  today: "Danh sách hôm nay",
  week: "Việc trong tuần",
  month: "Việc trong tháng",
  mood: "Việc gắn với mood",
};

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      Object.assign(state, JSON.parse(saved));
      return;
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  state.tasks = [
    createTask("Uống nước và ăn sáng đàng hoàng", "Sức khỏe", "normal", todayISO),
    createTask("Hoàn thành một việc quan trọng nhất", "Dự án", "high", todayISO),
    createTask("Dọn góc học tập 10 phút", "Việc nhà", "low", todayISO),
  ];
  state.moods = [
    {
      id: crypto.randomUUID(),
      date: todayISO,
      mood: "Chill",
      caption: "Ngày đầu setup lại nhịp sống, làm từng việc nhỏ trước.",
      image: "",
    },
  ];
  saveState();
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({
    tasks: state.tasks,
    moods: state.moods,
  }));
}

function toLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromISO(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function createTask(name, category, priority, date) {
  return {
    id: crypto.randomUUID(),
    name,
    category,
    priority,
    date,
    done: false,
    createdAt: new Date().toISOString(),
  };
}

function sameWeek(dateString) {
  const now = fromISO(todayISO);
  const date = fromISO(dateString);
  const start = new Date(now);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function sameMonth(dateString) {
  const now = fromISO(todayISO);
  const date = fromISO(dateString);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function visibleTasks() {
  let tasks = [...state.tasks];
  if (state.view === "today" || state.view === "mood") tasks = tasks.filter((task) => task.date === todayISO);
  if (state.view === "week") tasks = tasks.filter((task) => sameWeek(task.date));
  if (state.view === "month") tasks = tasks.filter((task) => sameMonth(task.date));
  if (state.filter === "open") tasks = tasks.filter((task) => !task.done);
  if (state.filter === "done") tasks = tasks.filter((task) => task.done);
  return tasks.sort((a, b) => a.done - b.done || a.date.localeCompare(b.date) || b.createdAt.localeCompare(a.createdAt));
}

function priorityText(priority) {
  return {
    high: "Quan trọng",
    low: "Nhẹ nhàng",
    normal: "Bình thường",
  }[priority];
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(fromISO(dateString));
}

function renderTasks() {
  els.taskTitle.textContent = viewTitles[state.view];
  const tasks = visibleTasks();
  if (!tasks.length) {
    els.taskList.innerHTML = `<div class="empty-state">Chưa có việc nào trong mục này.</div>`;
    return;
  }

  els.taskList.innerHTML = tasks
    .map((task) => `
      <article class="task-item ${task.done ? "done" : ""}">
        <input type="checkbox" ${task.done ? "checked" : ""} data-toggle="${task.id}" aria-label="Đánh dấu hoàn thành" />
        <div>
          <span class="task-name">${escapeHTML(task.name)}</span>
          <div class="task-meta">
            <span class="pill">${escapeHTML(task.category)}</span>
            <span class="pill priority-${task.priority}">${priorityText(task.priority)}</span>
            <span>${formatDate(task.date)}</span>
          </div>
        </div>
        <button class="delete-btn" data-delete="${task.id}" type="button" aria-label="Xóa việc">-</button>
      </article>
    `)
    .join("");
}

function renderProgress() {
  const todayTasks = state.tasks.filter((task) => task.date === todayISO);
  const done = todayTasks.filter((task) => task.done).length;
  const percent = todayTasks.length ? Math.round((done / todayTasks.length) * 100) : 0;
  els.progressPercent.textContent = `${percent}%`;
  els.progressText.textContent = todayTasks.length
    ? `Bạn đã xong ${done}/${todayTasks.length} việc hôm nay.`
    : "Chưa có việc nào hôm nay.";
}

function renderTimeline() {
  const moods = [...state.moods].sort((a, b) => b.date.localeCompare(a.date));
  if (!moods.length) {
    els.timeline.innerHTML = `<div class="empty-state">Chưa có mood nào. Đăng một ảnh hoặc caption để lưu ngày hôm nay.</div>`;
    return;
  }

  els.timeline.innerHTML = moods
    .map((entry) => `
      <article class="mood-card">
        ${entry.image ? `<img src="${entry.image}" alt="Ảnh mood ngày ${formatDate(entry.date)}" />` : `<div class="mood-fallback">Chưa có ảnh</div>`}
        <div class="mood-body">
          <div class="mood-title">
            <span>${escapeHTML(entry.mood)}</span>
            <small>${formatDate(entry.date)}</small>
          </div>
          <p>${escapeHTML(entry.caption || "Không có caption.")}</p>
        </div>
      </article>
    `)
    .join("");
}

function renderDate() {
  els.todayLabel.textContent = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function render() {
  renderDate();
  renderTasks();
  renderProgress();
  renderTimeline();
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function bindEvents() {
  document.querySelectorAll(".nav-tab").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      render();
    });
  });

  els.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.tasks.push(createTask(
      els.taskName.value.trim(),
      els.taskCategory.value,
      els.taskPriority.value,
      els.taskDate.value,
    ));
    els.taskName.value = "";
    saveState();
    render();
  });

  els.taskList.addEventListener("click", (event) => {
    const toggleId = event.target.dataset.toggle;
    const deleteId = event.target.dataset.delete;
    if (toggleId) {
      const task = state.tasks.find((item) => item.id === toggleId);
      task.done = event.target.checked;
    }
    if (deleteId) {
      state.tasks = state.tasks.filter((item) => item.id !== deleteId);
    }
    saveState();
    render();
  });

  els.moodPhoto.addEventListener("change", () => {
    const file = els.moodPhoto.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      state.imageDraft = reader.result;
      els.photoPreview.src = state.imageDraft;
      els.photoPreview.hidden = false;
      els.photoPlaceholder.hidden = true;
    });
    reader.readAsDataURL(file);
  });

  els.moodForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const mood = new FormData(els.moodForm).get("mood");
    const existingToday = state.moods.find((entry) => entry.date === todayISO);
    const entry = {
      id: existingToday?.id || crypto.randomUUID(),
      date: todayISO,
      mood,
      caption: els.moodCaption.value.trim(),
      image: state.imageDraft || existingToday?.image || "",
    };
    state.moods = [entry, ...state.moods.filter((item) => item.date !== todayISO)];
    els.moodCaption.value = "";
    state.imageDraft = "";
    saveState();
    render();
  });

  document.querySelector("#openComposer").addEventListener("click", () => els.quickDialog.showModal());
  document.querySelector("#focusTask").addEventListener("click", () => setTimeout(() => els.taskName.focus(), 0));
  document.querySelector("#focusMood").addEventListener("click", () => setTimeout(() => els.moodCaption.focus(), 0));
  document.querySelector("#clearDemo").addEventListener("click", () => {
    localStorage.removeItem(storageKey);
    state.tasks = [];
    state.moods = [];
    saveState();
    render();
  });
}

loadState();
els.taskDate.value = todayISO;
bindEvents();
render();
