/* Campus Life Simulator — game state and UI logic */
const STORAGE_KEY = "campusLifeSimulatorState";
const PROFILE_KEY = "campusLifeSimulatorProfile";
const AUTH_KEY = "campusLifeSimulatorAuth";
const USERS_KEY = "campusLifeSimulatorUsers";
const MAX_DAYS = 100;
const ACTIONS_PER_DAY = 3;

function getRegisteredUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    if (Array.isArray(users)) return users;
  } catch (e) {}
  return [];
}

function saveRegisteredUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function isLoggedIn() {
  try { return !!JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return false; }
}

function getAuthUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function setAuthSession(user) {
  const initialMoney = user.money !== undefined && user.money !== null ? Number(user.money) : (user.initialMoney !== undefined && user.initialMoney !== null ? Number(user.initialMoney) : 5000);
  const updatedUser = { ...user, money: initialMoney, initialMoney: initialMoney };
  localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
  localStorage.setItem(PROFILE_KEY, JSON.stringify({
    name: user.name,
    college: user.college || "Sunrise University",
    course: user.course || "B.Tech CSE",
    year: user.year || "1st year",
    money: initialMoney,
    initialMoney: initialMoney
  }));
}

function loginUser(email, password) {
  const users = getRegisteredUsers();
  const cleanEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (!found) {
    // Auto-create account if not found
    const parts = cleanEmail.split("@")[0].split(/[._-]/);
    const rawName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    const formattedName = rawName || "Student";
    const newUser = {
      email: cleanEmail,
      password: password,
      name: formattedName,
      college: "Sunrise University",
      course: "B.Tech CSE",
      year: "1st year",
      money: 5000,
      initialMoney: 5000
    };
    users.push(newUser);
    saveRegisteredUsers(users);
    setAuthSession(newUser);
    return { success: true, user: newUser, autoCreated: true };
  }
  if (found.password !== password) {
    return { success: false, message: "Incorrect password. Please try again." };
  }
  setAuthSession(found);
  return { success: true, user: found, autoCreated: false };
}

function registerUser(details) {
  const users = getRegisteredUsers();
  const email = details.email.trim().toLowerCase();
  if (users.some(u => u.email.toLowerCase() === email)) {
    return { success: false, message: "An account with this email already exists." };
  }
  const startingMoney = details.money !== undefined && details.money !== "" ? Math.max(0, Number(details.money)) : 5000;
  const newUser = {
    email: email,
    password: details.password,
    name: details.name.trim(),
    college: details.college ? details.college.trim() : "Sunrise University",
    course: details.course ? details.course.trim() : "General Studies",
    year: details.year || "1st year",
    money: startingMoney,
    initialMoney: startingMoney
  };
  users.push(newUser);
  saveRegisteredUsers(users);
  setAuthSession(newUser);
  return { success: true, user: newUser };
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = "login.html";
}

const defaultGameState = (customMoney) => {
  const profile = loadStudentProfile();
  let startMoney = 5000;
  if (customMoney !== undefined && customMoney !== null) {
    startMoney = Math.max(0, Number(customMoney));
  } else if (profile && profile.money !== undefined && profile.money !== null) {
    startMoney = Math.max(0, Number(profile.money));
  } else if (profile && profile.initialMoney !== undefined && profile.initialMoney !== null) {
    startMoney = Math.max(0, Number(profile.initialMoney));
  }
  return {
    day: 1, academics: 50, health: 70, happiness: 60, sleep: 60,
    energy: 70, social: 50, money: startMoney, initialMoney: startMoney, eventHistory: [], ended: false,
    endReason: "", daysSurvived: 0, actionsToday: 0
  };
};

const activities = {
  study: { name: "Study", effects: { academics: 10, energy: -15, happiness: -3, sleep: -5 } },
  sleep: { name: "Sleep in", effects: { sleep: 20, energy: 20, health: 2, academics: -2 } },
  exercise: { name: "Exercise", effects: { health: 10, energy: -10, happiness: 5, sleep: -3 } },
  hangout: { name: "Hang out", effects: { social: 15, happiness: 10, money: -250, energy: -5 } },
  work: { name: "Part-time work", effects: { money: 650, energy: -20, happiness: -5, sleep: -5 } },
  relax: { name: "Relax", effects: { happiness: 10, energy: 5, money: -150 } },
  class: { name: "Attend class", effects: { academics: 6, social: 3, energy: -8, sleep: -3 } },
  library: { name: "Visit the library", effects: { academics: 8, energy: -10, happiness: -2 } },
  club: { name: "Join a club activity", effects: { social: 10, happiness: 6, energy: -8, money: -100 } },
  gaming: { name: "Play games", effects: { happiness: 12, social: 5, energy: -8, sleep: -10, money: -50 } }
};

const eventDefinitions = [
  { id: "exam", icon: "📚", title: "Surprise Exam", description: "Your professor announced a surprise test. Your preparation makes all the difference.", getEffects: state => state.academics >= 65 && state.energy >= 45 ? { academics: 6, happiness: 3 } : { academics: -10, happiness: -5 } },
  { id: "fest", icon: "🎪", title: "College Fest", description: "The campus is buzzing. You spend the evening at the annual college fest.", effects: { happiness: 15, social: 15, energy: -10, money: -200 } },
  { id: "deadline", icon: "📝", title: "Assignment Deadline", description: "A deadline crept up faster than expected. You pull together a final submission.", effects: { academics: 8, energy: -12, sleep: -8 } },
  { id: "birthday", icon: "🎂", title: "Friend’s Birthday", description: "Your friend’s birthday turns into a warm, much-needed campus evening.", effects: { happiness: 10, social: 12, money: -250, energy: -5 } },
  { id: "project", icon: "🤝", title: "Group Project", description: "Your group finally gets momentum. Teamwork comes with a late working session.", effects: { academics: 7, social: 10, energy: -12, happiness: -2 } },
  { id: "expense", icon: "🧾", title: "Unexpected Expense", description: "A necessary expense appears out of nowhere. Good thing you have been saving.", effects: { money: -600, happiness: -4 } },
  { id: "scholarship", icon: "🏆", title: "Scholarship Opportunity", description: "An opportunity opens up for engaged students. Your academic record determines the result.", getEffects: state => state.academics >= 70 ? { money: 1200, happiness: 6, academics: 3 } : { academics: -3, happiness: -3 } },
  { id: "sports", icon: "🏅", title: "Sports Competition", description: "A friendly inter-college competition gets the campus moving.", effects: { health: 12, happiness: 8, social: 5, energy: -15 } },
  { id: "family", icon: "🏠", title: "Family Visit", description: "A family visit brings home-cooked food, perspective, and a chance to reset.", effects: { happiness: 12, health: 5, social: 4, sleep: 10, money: -100 } },
  { id: "sick", icon: "🤒", title: "Falling Sick", description: "You have been running on empty. Your body asks you to slow down.", effects: { health: -15, energy: -20, happiness: -5 } },
  { id: "mentor", icon: "💡", title: "Mentor’s Advice", description: "A professor notices your effort and shares advice that shifts your perspective.", effects: { academics: 5, happiness: 5, energy: 3 } },
  { id: "roommate", icon: "🛋️", title: "Roommate Movie Night", description: "A spontaneous movie night becomes an easy, cheerful break from routine.", effects: { happiness: 8, social: 8, sleep: -5, money: -80 } }
];

let gameState = loadGameState();
let toastTimer;

function loadGameState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") return sanitizeState({ ...defaultGameState(), ...saved });
  } catch (error) { console.warn("Could not restore saved game", error); }
  return defaultGameState();
}

function sanitizeState(state) {
  ["academics", "health", "happiness", "sleep", "energy", "social"].forEach(key => state[key] = clamp(Number(state[key]) || 0, 0, 100));
  state.money = Math.max(0, Number(state.money) || 0);
  if (!state.initialMoney || Number(state.initialMoney) <= 0) {
    state.initialMoney = Math.max(state.money, 5000);
  } else {
    state.initialMoney = Number(state.initialMoney);
  }
  state.day = clamp(Math.floor(Number(state.day) || 1), 1, MAX_DAYS + 1);
  state.daysSurvived = clamp(Math.floor(Number(state.daysSurvived) || 0), 0, MAX_DAYS);
  state.actionsToday = clamp(Math.floor(Number(state.actionsToday) || 0), 0, ACTIONS_PER_DAY - 1);
  state.eventHistory = Array.isArray(state.eventHistory) ? state.eventHistory : [];
  return state;
}

function saveGameState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)); }
function loadStudentProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return profile && profile.name && profile.college && profile.course && profile.year ? profile : null;
  } catch (error) { return null; }
}
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function formatMoney(value) { return `₹${Math.round(value).toLocaleString("en-IN")}`; }
function statLabel(key) { return ({ academics:"Academics", health:"Health", happiness:"Happiness", sleep:"Sleep", energy:"Energy", social:"Social", money:"Money" })[key] || key; }

function applyEffects(effects) {
  const applied = {};
  Object.entries(effects).forEach(([stat, value]) => {
    const before = gameState[stat];
    const next = stat === "money" ? Math.max(0, before + value) : clamp(before + value, 0, 100);
    gameState[stat] = next;
    const actual = next - before;
    if (actual !== 0) applied[stat] = actual;
  });
  return applied;
}

function effectText(effects) {
  return Object.entries(effects).map(([key, value]) => {
    const sign = value > 0 ? "+" : "−";
    const amount = key === "money" ? formatMoney(Math.abs(value)) : Math.abs(value);
    return `${statLabel(key)} ${sign}${amount}`;
  });
}

function performActivity(activityKey) {
  const activity = activities[activityKey];
  if (!activity || gameState.ended || gameState.day > MAX_DAYS) return;
  if (activity.effects.money && activity.effects.money < 0 && gameState.money < Math.abs(activity.effects.money)) {
    showNotification("Not enough funds", `You need ${formatMoney(Math.abs(activity.effects.money))} to choose ${activity.name.toLowerCase()}.`);
    return;
  }
  const today = gameState.day;
  const applied = applyEffects(activity.effects);
  gameState.actionsToday += 1;
  const completedDay = gameState.actionsToday === ACTIONS_PER_DAY;
  if (completedDay) {
    gameState.daysSurvived = gameState.day;
    gameState.day += 1;
    gameState.actionsToday = 0;
  }
  const warnings = checkCriticalConditions();
  saveGameState();
  updateUI();
  const actionNumber = completedDay ? ACTIONS_PER_DAY : gameState.actionsToday;
  const actionTitle = completedDay ? `Day ${today} complete: ${activity.name}` : `Day ${today} · Action ${actionNumber} of ${ACTIONS_PER_DAY}: ${activity.name}`;
  showNotification(actionTitle, effectText(applied).join(" · ") || "You made space for what matters.");
  if (gameState.ended) {
    setTimeout(() => window.location.href = "results.html", 950);
    return;
  }
  if (completedDay && gameState.day > MAX_DAYS) {
    saveGameState();
    setTimeout(() => window.location.href = "results.html", 780);
    return;
  }
  if (!completedDay) {
    if (warnings.length) setTimeout(() => showNotification("Check-in", warnings.join(" ")), 420);
    return;
  }
  const event = generateEvent();
  if (event) setTimeout(() => showEvent(event), 350);
  else if (warnings.length) setTimeout(() => showNotification("Check-in", warnings.join(" ")), 420);
}

function checkCriticalConditions() {
  const warnings = [];
  let exhaustionHandled = false;
  if (gameState.health <= 0) {
    gameState.ended = true;
    gameState.endReason = "Your health reached a critical level. The semester had to end early so you could recover.";
    warnings.push(gameState.endReason);
    return warnings;
  }
  if (gameState.energy <= 0) {
    const exhaustion = applyEffects({ health: -5, happiness: -5, sleep: 10 });
    warnings.push(`You are exhausted. Rest caught up with you: ${effectText(exhaustion).join(" · ")}.`);
    exhaustionHandled = true;
  }
  if (gameState.happiness <= 0) {
    const burnout = applyEffects({ academics: -5, energy: -5 });
    warnings.push(`Your happiness is critically low. Burnout affects your focus: ${effectText(burnout).join(" · ")}.`);
  }
  if (gameState.energy <= 0 && !exhaustionHandled) {
    const exhaustion = applyEffects({ health: -5, happiness: -5, sleep: 10 });
    warnings.push(`You are exhausted. Rest caught up with you: ${effectText(exhaustion).join(" · ")}.`);
  }
  if (gameState.health <= 0) {
    gameState.ended = true;
    gameState.endReason = "Your health reached a critical level. The semester had to end early so you could recover.";
    warnings.push(gameState.endReason);
    return warnings;
  }
  if (gameState.academics < 20) warnings.push("Academic risk: your academics are below 20. Make focused study time soon.");
  if (gameState.health <= 20 && gameState.health > 0) warnings.push("Health warning: slow down and look after yourself.");
  return warnings;
}

function generateEvent() {
  const shouldTrigger = gameState.health <= 25 ? Math.random() < 0.7 : Math.random() < 0.38;
  if (!shouldTrigger) return null;
  const recent = gameState.eventHistory.slice(-6);
  let candidates = eventDefinitions.filter(event => !recent.includes(event.id));
  if (gameState.health <= 25) {
    const sick = eventDefinitions.find(event => event.id === "sick");
    if (sick && !recent.includes("sick") && Math.random() < 0.55) candidates = [sick];
  }
  const event = candidates[Math.floor(Math.random() * candidates.length)];
  const effects = event.getEffects ? event.getEffects(gameState) : event.effects;
  const applied = applyEffects(effects);
  gameState.eventHistory.push(event.id);
  gameState.eventHistory = gameState.eventHistory.slice(-8);
  const warnings = checkCriticalConditions();
  saveGameState();
  updateUI();
  return { ...event, effects: applied, warnings };
}

function updateUI() {
  if (document.body.dataset.page !== "game") return;
  const visibleDay = Math.min(gameState.day, MAX_DAYS);
  const progress = clamp(((gameState.day - 1) / MAX_DAYS) * 100, 0, 100);
  const headerDay = document.getElementById("header-day");
  const largeDay = document.getElementById("large-day");
  const progressFill = document.getElementById("header-progress-fill");
  if (headerDay) headerDay.innerHTML = `Day ${visibleDay} <span>/ 100</span>`;
  if (largeDay) largeDay.textContent = String(visibleDay).padStart(2, "0");
  if (progressFill) progressFill.style.width = `${progress}%`;
  const actionsLeft = ACTIONS_PER_DAY - gameState.actionsToday;
  const actionsRemaining = document.getElementById("actions-remaining");
  const actionCount = document.getElementById("action-count");
  if (actionsRemaining) actionsRemaining.textContent = `${actionsLeft} action${actionsLeft === 1 ? "" : "s"} left today`;
  if (actionCount) actionCount.innerHTML = gameState.actionsToday === 0
    ? `Choose <strong>${ACTIONS_PER_DAY} activities</strong><br>to complete today`
    : `<strong>${actionsLeft} action${actionsLeft === 1 ? "" : "s"} left</strong><br>before Day ${visibleDay} ends`;
  const greetings = ["A fresh start", "Momentum is building", "Keep your balance", "Almost there", "The final stretch"];
  const greetingIndex = Math.min(4, Math.floor(progress / 20));
  const greeting = document.getElementById("day-greeting");
  const title = document.getElementById("game-title");
  const subtitle = document.getElementById("game-subtitle");
  if (greeting) greeting.textContent = greetings[greetingIndex];
  const profile = loadStudentProfile();
  if (title) title.textContent = visibleDay === 1 ? `Day 1 is yours${profile ? `, ${profile.name}` : ""}.` : `Day ${visibleDay}: make it count.`;
  if (subtitle) subtitle.textContent = visibleDay > 90 ? "You are nearly at the finish line. Make these final choices intentional." : `Choose ${actionsLeft} more ${actionsLeft === 1 ? "activity" : "activities"} to finish today. Balance is the real skill.`;
  document.querySelectorAll(".stat-row").forEach(row => {
    const stat = row.dataset.stat;
    const value = gameState[stat];
    row.querySelector("strong").textContent = value;
    row.querySelector(".stat-track i").style.width = `${value}%`;
    row.classList.toggle("critical", value <= 20);
  });
  const money = document.getElementById("money-value");
  const moneyNote = document.getElementById("money-note");
  if (money) money.textContent = formatMoney(gameState.money);
  if (moneyNote) moneyNote.textContent = gameState.money < 500 ? "Funds are low—consider a work shift." : "Keep a little aside for surprises.";
}

function showNotification(title, message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  document.getElementById("toast-title").textContent = title;
  document.getElementById("toast-message").textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 4800);
}

function showEvent(event) {
  const modal = document.getElementById("event-modal");
  if (!modal) return;
  document.getElementById("event-icon").textContent = event.icon;
  document.getElementById("event-title").textContent = event.title;
  document.getElementById("event-description").textContent = event.description;
  const effects = document.getElementById("event-effects");
  effects.innerHTML = effectText(event.effects).map(text => {
    const isPositive = text.includes("+");
    return `<span class="effect-pill ${isPositive ? "positive" : "negative"}">${text}</span>`;
  }).join("") || "<span class=\"effect-pill\">A change of pace</span>";
  if (event.warnings && event.warnings.length) {
    effects.innerHTML += event.warnings.map(warning => `<span class="effect-pill negative">${warning}</span>`).join("");
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("event-continue").focus();
}

function closeEvent() {
  const modal = document.getElementById("event-modal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (gameState.ended) setTimeout(() => window.location.href = "results.html", 150);
}

function calculateScore(state = gameState) {
  const core = state.academics * 2.5 + state.health * 1.8 + state.happiness * 1.3 + state.energy * 1.2 + state.social * 1.1 + state.sleep * .6;
  const baseMoney = state.initialMoney || 5000;
  const moneyScore = clamp(state.money / baseMoney, 0, 1) * 100;
  const survivalScore = clamp(state.daysSurvived, 0, MAX_DAYS) * .5;
  return clamp(Math.round(core + moneyScore + survivalScore), 0, 1000);
}

function getRating(score) {
  if (score >= 900) return "🌟 Legendary Student";
  if (score >= 750) return "🏆 Excellent Student";
  if (score >= 600) return "🎓 Good Student";
  if (score >= 400) return "🙂 Average Student";
  if (score >= 200) return "😅 Struggling Student";
  return "💀 Semester Disaster";
}

function performanceSummary(state, score) {
  if (state.ended) return "College life was challenging. Prioritise recovery and build a more sustainable rhythm next semester.";
  if (state.academics >= 75 && state.health >= 65 && state.happiness >= 60) return "You achieved an excellent balance between academics and personal well-being.";
  if (state.academics >= 75 && state.happiness < 45) return "You focused heavily on academics but sacrificed your personal life. Make room for joy next time.";
  if (state.happiness >= 75 && state.academics < 45) return "You enjoyed college life, but your academic performance needs improvement.";
  if (score < 400) return "College life was challenging. Try making more balanced decisions next semester.";
  if (state.social >= 75 && state.money >= 2000) return "You built a lively campus life while keeping your future secure. That is a rare kind of balance.";
  return "You made it through the semester with a story that is completely your own. There is plenty to build on.";
}

function renderResults() {
  if (document.body.dataset.page !== "results") return;
  const score = calculateScore();
  const stats = ["academics", "health", "happiness", "energy", "social"];
  document.getElementById("final-score").textContent = score;
  document.querySelector(".score-ring").style.setProperty("--score-progress", `${score / 10}%`);
  document.getElementById("performance-rating").textContent = getRating(score);
  document.getElementById("performance-summary").textContent = performanceSummary(gameState, score);
  stats.forEach(stat => {
    document.getElementById(`result-${stat}`).textContent = gameState[stat];
    const bar = document.querySelector(`#result-${stat}`).parentElement.querySelector(".result-bar");
    bar.style.setProperty("--result-width", `${gameState[stat]}%`);
  });
  document.getElementById("result-money").textContent = formatMoney(gameState.money);
  const baseMoney = gameState.initialMoney || 5000;
  document.getElementById("result-money").parentElement.querySelector(".result-bar").style.setProperty("--result-width", `${clamp(gameState.money / baseMoney * 100, 0, 100)}%`);
  const survived = gameState.daysSurvived || (gameState.day > MAX_DAYS ? MAX_DAYS : Math.max(0, gameState.day - 1));
  document.getElementById("result-days").textContent = `${survived} / 100`;
  document.getElementById("result-days").parentElement.querySelector(".result-bar").style.setProperty("--result-width", `${survived}%`);
  const note = document.getElementById("days-survived-note");
  note.textContent = gameState.ended ? gameState.endReason : survived >= MAX_DAYS ? "You completed the full 100-day semester." : `You navigated ${survived} days of the semester.`;
}

function resetGame(redirect = true) {
  gameState = defaultGameState();
  saveGameState();
  if (redirect) window.location.href = "game.html";
}

function openProfileSetup() {
  const modal = document.getElementById("profile-modal");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("student-name")?.focus();
}

function startSimulation() {
  if (loadStudentProfile()) resetGame(true);
  else openProfileSetup();
}

function renderUserHeader() {
  const header = document.querySelector(".site-header, .game-header");
  if (!header) return;
  
  let authNav = header.querySelector(".header-user-nav");
  if (!authNav) {
    authNav = document.createElement("div");
    authNav.className = "header-user-nav";
    const actions = header.querySelector(".header-actions");
    if (actions) {
      header.insertBefore(authNav, actions);
    } else {
      header.appendChild(authNav);
    }
  }

  const user = getAuthUser();
  if (user) {
    authNav.innerHTML = `
      <div class="user-menu-wrapper">
        <button type="button" class="user-chip-btn" id="user-menu-toggle" aria-expanded="false" aria-label="User profile menu">
          <span class="user-avatar-badge">🎓</span>
          <span class="user-chip-name">${escapeHTML(user.name)}</span>
          <span class="user-chip-caret">▾</span>
        </button>
        <div class="user-dropdown-menu" id="user-dropdown-menu" hidden>
          <div class="user-dropdown-header">
            <strong>${escapeHTML(user.name)}</strong>
            <small>${escapeHTML(user.email)}</small>
            <span class="user-college-badge">${escapeHTML(user.college || "Student")}</span>
          </div>
          <div class="user-dropdown-divider"></div>
          <a href="game.html" class="user-dropdown-item">🎮 Simulation</a>
          <a href="activities.html" class="user-dropdown-item">📖 Activity Guide</a>
          <button type="button" class="user-dropdown-item danger" id="user-logout-btn">🚪 Sign Out</button>
        </div>
      </div>
    `;

    const toggleBtn = authNav.querySelector("#user-menu-toggle");
    const dropdown = authNav.querySelector("#user-dropdown-menu");
    const logoutBtn = authNav.querySelector("#user-logout-btn");

    toggleBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
      toggleBtn.setAttribute("aria-expanded", !isExpanded);
      dropdown.hidden = isExpanded;
    });

    document.addEventListener("click", () => {
      if (dropdown && !dropdown.hidden) {
        dropdown.hidden = true;
        toggleBtn?.setAttribute("aria-expanded", "false");
      }
    });

    dropdown?.addEventListener("click", (e) => e.stopPropagation());
    logoutBtn?.addEventListener("click", () => logoutUser());
  } else {
    if (document.body.dataset.page !== "login") {
      authNav.innerHTML = `
        <a href="login.html" class="btn btn-small btn-outline nav-login-btn">Sign In</a>
      `;
    } else {
      authNav.innerHTML = "";
    }
  }
}

function escapeHTML(str) {
  return String(str || "").replace(/[&<>"']/g, match => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[match]);
}

function setupLoginPage() {
  if (isLoggedIn()) {
    const redirect = new URLSearchParams(window.location.search).get("redirect") || "game.html";
    window.location.replace(redirect);
    return;
  }

  const tabBtns = document.querySelectorAll(".auth-tab");
  const signinForm = document.getElementById("signin-form");
  const signupForm = document.getElementById("signup-form");
  const authFeedback = document.getElementById("auth-feedback");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.tab;
      if (target === "signin") {
        signinForm.hidden = false;
        signupForm.hidden = true;
      } else {
        signinForm.hidden = true;
        signupForm.hidden = false;
      }
      if (authFeedback) authFeedback.hidden = true;
    });
  });

  signinForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;
    const res = loginUser(email, password);
    if (res.success) {
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "game.html";
      window.location.href = redirect;
    } else {
      showAuthError(res.message);
    }
  });

  signupForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const college = document.getElementById("signup-college").value;
    const course = document.getElementById("signup-course").value;
    const year = document.getElementById("signup-year").value;
    const money = document.getElementById("signup-money")?.value;
    const res = registerUser({ name, email, password, college, course, year, money });
    if (res.success) {
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "game.html";
      window.location.href = redirect;
    } else {
      showAuthError(res.message);
    }
  });


}

function showAuthError(msg) {
  const authFeedback = document.getElementById("auth-feedback");
  if (!authFeedback) return;
  authFeedback.textContent = msg;
  authFeedback.hidden = false;
  authFeedback.className = "auth-feedback error";
}

function initializePage() {
  renderUserHeader();

  if (document.body.dataset.page === "login") {
    setupLoginPage();
  }

  document.querySelectorAll("[data-start-game]").forEach(button => button.addEventListener("click", startSimulation));
  document.querySelectorAll("[data-play-again]").forEach(button => button.addEventListener("click", () => resetGame(true)));

  if (document.body.dataset.page === "home") {
    document.getElementById("profile-form")?.addEventListener("submit", event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const userMoney = Math.max(0, Number(formData.get("money")) || 5000);
      const profile = {
        name: formData.get("name").trim(),
        college: formData.get("college").trim(),
        course: formData.get("course").trim(),
        year: formData.get("year"),
        money: userMoney,
        initialMoney: userMoney
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      const authUser = getAuthUser();
      if (authUser) {
        authUser.money = userMoney;
        authUser.initialMoney = userMoney;
        setAuthSession(authUser);
      }
      resetGame(true);
    });
    if (new URLSearchParams(window.location.search).get("setup") === "1" && !loadStudentProfile()) openProfileSetup();
  }
  if (document.body.dataset.page === "game") {
    if (!isLoggedIn()) {
      window.location.replace("login.html?redirect=game.html");
      return;
    }
    if (!loadStudentProfile()) {
      const authUser = getAuthUser();
      if (authUser) {
        setAuthSession(authUser);
      } else {
        window.location.replace("index.html?setup=1");
        return;
      }
    }
    if (gameState.ended || gameState.day > MAX_DAYS) { window.location.replace("results.html"); return; }
    updateUI();
    document.querySelectorAll("[data-activity]").forEach(button => button.addEventListener("click", () => performActivity(button.dataset.activity)));
    document.querySelector(".restart-button")?.addEventListener("click", () => {
      const modal = document.getElementById("restart-modal"); modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    });
    document.getElementById("confirm-restart")?.addEventListener("click", () => resetGame(true));
    document.querySelectorAll("[data-close-restart]").forEach(button => button.addEventListener("click", () => {
      const modal = document.getElementById("restart-modal"); modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
    }));
    document.getElementById("event-close")?.addEventListener("click", closeEvent);
    document.getElementById("event-continue")?.addEventListener("click", closeEvent);
    document.getElementById("toast-close")?.addEventListener("click", () => document.getElementById("toast").classList.remove("visible"));

    // Edit available amount handlers
    const openEditMoneyBtn = document.getElementById("open-edit-money-btn");
    const editMoneyModal = document.getElementById("edit-money-modal");
    const closeEditMoneyBtn = document.getElementById("close-edit-money");
    const cancelEditMoneyBtn = document.getElementById("cancel-edit-money");
    const editMoneyForm = document.getElementById("edit-money-form");
    const inputCustomMoney = document.getElementById("input-custom-money");

    if (openEditMoneyBtn && editMoneyModal) {
      openEditMoneyBtn.addEventListener("click", () => {
        if (inputCustomMoney) inputCustomMoney.value = gameState.money;
        editMoneyModal.classList.add("open");
        editMoneyModal.setAttribute("aria-hidden", "false");
        inputCustomMoney?.focus();
      });
    }

    const closeMoneyModal = () => {
      if (editMoneyModal) {
        editMoneyModal.classList.remove("open");
        editMoneyModal.setAttribute("aria-hidden", "true");
      }
    };

    closeEditMoneyBtn?.addEventListener("click", closeMoneyModal);
    cancelEditMoneyBtn?.addEventListener("click", closeMoneyModal);

    editMoneyForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newAmount = Math.max(0, Number(inputCustomMoney.value) || 0);
      gameState.money = newAmount;
      if (!gameState.initialMoney || gameState.initialMoney <= 0) {
        gameState.initialMoney = newAmount;
      }
      const profile = loadStudentProfile() || {};
      profile.money = newAmount;
      if (!profile.initialMoney) profile.initialMoney = newAmount;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

      saveGameState();
      updateUI();
      closeMoneyModal();
      showNotification("Available Funds Updated", `Your available amount is now ${formatMoney(newAmount)}.`);
    });
  }
  renderResults();
}

document.addEventListener("DOMContentLoaded", initializePage);

