// FARMER QAZ v2.1 — Production Architecture Frontend
// Fixes all P0 & P1 audit findings:
// - P0 #1: Worker task completion field alignment (completedAtMs, updatedAtMs, _syncStatus)
// - P0 #2: Strict Vet vs Shepherd UI/Rule alignment (Shepherd: emergency alerts only; Owner/Vet: treatments)
// - P0 #3: Full-group veterinary treatment via server Cloud Function recordVetTreatment (300+ animals)
// - P0 #4: Merge server snapshot with pending IndexedDB outbox (zero offline data loss on reload/reconnect)
// - P1 #5: Strict (uid, farmId) isolation for IndexedDB cache, outbox, and conflicts + clean logout
// - P1 #6: Automatic periodic outbox retry scheduler (10s interval respecting exponential backoff)
// - P1 #7: Full Task Assignment Modal (assign to any active member, worker sees/completes own tasks)
// - P1 #8: AI quota display & graceful handling of resource-exhausted errors
// - P1 #9: Explicit staff role selection in approveMemberRole (never owner)

const I18N = {
  kk: {
    subtitle: "ҰЛТТЫҚ ЦИФРЛЫҚ МАЛ ШАРУАШЫЛЫҒЫ",
    cfgTitle: "Firebase конфигурациясы қосылмаған",
    cfgDesc: "Өндірістік режим үшін Firebase баптауларын енгізіңіз немесе жергілікті офлайн сынақ режимін таңдаңыз.",
    configureBtn: "Баптау",
    loginTab: "Кіру",
    registerTab: "Тіркелу",
    emailLabel: "Электрондық пошта",
    passLabel: "Құпиясөз",
    loginBtn: "Жүйеге кіру",
    fullNameLabel: "Аты-жөні",
    accountModeLabel: "Тіркелу түрі",
    modeCreateFarm: "Жаңа шаруашылық ашу (Фермер-иесі)",
    modeJoinFarm: "Шақыру токенімен қосылу (Фермер мақұлдауымен)",
    farmNameLabel: "Шаруашылық атауы",
    inviteTokenLabel: "Шақыру токені (FQ-XXXXXXXXXXXX)",
    registerBtn: "Тіркелу",
    sandboxNote: "Серверсіз тексеру (тек жергілікті IndexedDB):",
    sandboxBtn: "Жергілікті режим (Offline Sandbox)",
    navMain: "БАСҚАРУ",
    syncBtn: "Синхрондау",
    logoutBtn: "Шығу",
    sandboxActiveMsg: "Жергілікті офлайн сынақ режимі: деректер тек осы браузердің IndexedDB қорында сақталады.",
    pendingApprovalMsg: "Өтініміңіз фермер-иесінің мақұлдауын күтуде. Мақұлданғанға дейін деректер жабық.",
    cfgModalTitle: "Firebase өндірістік конфигурациясы",
    cfgModalHelp: "Firebase Web Config JSON-ды енгізіңіз. Gemini API кілті браузерге жазылмайды — ол тек Cloud Functions Secret Manager-де сақталады.",
    cancelBtn: "Болдырмау",
    saveBtn: "Сақтау",
    conflictTitle: "Синхрондау қақтығыстарын шешу",
    nav_dashboard: "Басты бет",
    nav_livestock: "Мал базасы (8 түр)",
    nav_ai: "AI мал тіркеу",
    nav_scanner: "Сырға сканері",
    nav_vet: "Ветеринария",
    nav_tasks: "Тапсырмалар",
    nav_staff: "Қызметкерлер & RBAC",
    nav_reports: "Есептер & CSV",
    addAnimal: "Мал қосу",
    species_cattle: "Ірі қара",
    species_sheep: "Қой",
    species_goat: "Ешкі",
    species_horse: "Жылқы",
    species_camel: "Түйе",
    species_poultry: "Құс",
    species_pig: "Шошқа",
    species_other: "Басқа жануарлар",
    role_owner: "Фермер-иесі",
    role_shepherd: "Малшы",
    role_vet: "Ветеринар",
    role_worker: "Жұмысшы",
    online: "● Онлайн",
    offline: "● Офлайн",
    queued: "⏳ Кезекте",
    synced: "✓ Синхрондалды",
    loadMore: "Тағы жүктеу (25)",
    exportCsv: "Қауіпсіз CSV экспорт",
    vetLockBanner: "ҚАУІПСІЗДІК БҰҒАТЫ: ҚР АШМ ресми ветеринарлық реестрімен расталмаған автоматты дозалау калькуляторы өшірілген. Емдеуді тек лицензияланған ветеринар тағайындауы бойынша тіркеңіз.",
    aiZeroFabNotice: "Қатаң саясат: AI белгісіз деректерді (сырға, салмақ, жыныс, туған күн) ешқашан ойдан толтырмайды — олар бос қалады. Сақтау алдында фермер растауы міндетті."
  },
  ru: {
    subtitle: "НАЦИОНАЛЬНАЯ ЦИФРОВАЯ ПЛАТФОРМА ЖИВОТНОВОДСТВА",
    cfgTitle: "Конфигурация Firebase не подключена",
    cfgDesc: "Для боевого режима укажите настройки Firebase или выберите локальный офлайн-режим тестирования.",
    configureBtn: "Настроить",
    loginTab: "Вход",
    registerTab: "Регистрация",
    emailLabel: "Электронная почта",
    passLabel: "Пароль",
    loginBtn: "Войти",
    fullNameLabel: "ФИО",
    accountModeLabel: "Тип регистрации",
    modeCreateFarm: "Создать новое хозяйство (Фермер-владелец)",
    modeJoinFarm: "Войти по токену приглашения (с одобрением владельца)",
    farmNameLabel: "Название хозяйства",
    inviteTokenLabel: "Токен приглашения (FQ-XXXXXXXXXXXX)",
    registerBtn: "Зарегистрироваться",
    sandboxNote: "Проверка без сервера (локальный IndexedDB):",
    sandboxBtn: "Локальный режим (Offline Sandbox)",
    navMain: "УПРАВЛЕНИЕ",
    syncBtn: "Синхронизация",
    logoutBtn: "Выйти",
    sandboxActiveMsg: "Локальный офлайн-режим: данные хранятся только в IndexedDB этого браузера.",
    pendingApprovalMsg: "Ваша заявка ожидает одобрения владельца хозяйства. Доступ ограничен.",
    cfgModalTitle: "Конфигурация Firebase",
    cfgModalHelp: "Вставьте Firebase Web Config JSON. Ключ Gemini API НЕ хранится в браузере — он задаётся в Secret Manager Cloud Functions.",
    cancelBtn: "Отмена",
    saveBtn: "Сохранить",
    conflictTitle: "Разрешение конфликтов синхронизации",
    nav_dashboard: "Главная",
    nav_livestock: "База животных (8 видов)",
    nav_ai: "AI-регистрация",
    nav_scanner: "Сканер бирок",
    nav_vet: "Ветеринария",
    nav_tasks: "Задачи",
    nav_staff: "Сотрудники и RBAC",
    nav_reports: "Отчёты и CSV",
    addAnimal: "Добавить животное",
    species_cattle: "Крупный рогатый скот",
    species_sheep: "Овцы",
    species_goat: "Козы",
    species_horse: "Лошади",
    species_camel: "Верблюды",
    species_poultry: "Птица",
    species_pig: "Свиньи",
    species_other: "Другие животные",
    role_owner: "Фермер-владелец",
    role_shepherd: "Чабан / Пастух",
    role_vet: "Ветеринар",
    role_worker: "Работник",
    online: "● Онлайн",
    offline: "● Офлайн",
    queued: "⏳ В очереди",
    synced: "✓ Синхронизировано",
    loadMore: "Загрузить ещё (25)",
    exportCsv: "Безопасный CSV-экспорт",
    vetLockBanner: "ЗАЩИТНАЯ БЛОКИРОВКА: Автоматический калькулятор дозировок отключён до интеграции с официальным реестром МСХ РК. Регистрируйте лечение только по назначению ветеринара.",
    aiZeroFabNotice: "Строгая политика: AI никогда не выдумывает неизвестные поля (бирку, вес, пол, дату рождения) — они остаются пустыми до подтверждения фермером."
  }
};

const SPECIES_KEYS = ["cattle", "sheep", "goat", "horse", "camel", "poultry", "pig", "other"];
const ASSIGNABLE_STAFF_ROLES = ["shepherd", "vet", "worker"];
const PAGE_SIZE = 25;

// --- APPLICATION STATE ---
let state = {
  lang: localStorage.getItem("fq_lang") || "kk",
  mode: "sandbox", // "cloud" | "sandbox"
  page: "dashboard",
  user: null,
  farm: null,
  roles: [],
  memberStatus: "active",
  animals: [],
  animalsCursor: null,
  vetLogs: [],
  tasks: [],
  members: [],
  outboxCount: 0,
  conflicts: [],
  fb: null
};

let outboxRetryTimer = null;

function resetSessionState() {
  state.user = null;
  state.farm = null;
  state.roles = [];
  state.memberStatus = "pending";
  state.animals = [];
  state.animalsCursor = null;
  state.vetLogs = [];
  state.tasks = [];
  state.members = [];
  state.outboxCount = 0;
  state.conflicts = [];
  if (outboxRetryTimer) {
    clearInterval(outboxRetryTimer);
    outboxRetryTimer = null;
  }
}

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || key;
}

function localDateISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysLocalISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  return localDateISO(d);
}

// XSS-safe DOM builder
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, String(v));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

function showToast(msg) {
  const box = document.getElementById("toast");
  box.textContent = msg;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 3200);
}

function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}

function safeCsvCell(val) {
  let s = val === null || val === undefined ? "" : String(val);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadSafeCsv(filename, headers, rows) {
  const lines = [headers.map(safeCsvCell).join(",")];
  for (const r of rows) lines.push(r.map(safeCsvCell).join(","));
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function hasRole(...allowed) {
  return state.memberStatus === "active" && allowed.some((r) => state.roles.includes(r));
}

// --- INDEXEDDB LOCAL-FIRST ENGINE (Strictly scoped by uid + farmId) ---
const DB_NAME = "farmer_qaz_v2_1_db";
const DB_VERSION = 1;
let idbPromise = null;

function openLocalDB() {
  if (idbPromise) return idbPromise;
  idbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache", { keyPath: "key" });
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "opId" });
      if (!db.objectStoreNames.contains("conflicts")) db.createObjectStore("conflicts", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return idbPromise;
}

async function idbPut(store, value) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(store, key) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAll(store) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function idbDelete(store, key) {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function currentScopeFilter(item) {
  return Boolean(state.user && state.farm && item.uid === state.user.uid && item.farmId === state.farm.id);
}

async function getScopedOutbox() {
  const all = await idbGetAll("outbox");
  return all.filter(currentScopeFilter).sort((a, b) => a.createdAt - b.createdAt);
}

async function getScopedConflicts() {
  const all = await idbGetAll("conflicts");
  return all.filter(currentScopeFilter).sort((a, b) => b.detectedAt - a.detectedAt);
}

async function persistLocalSnapshot() {
  if (!state.user || !state.farm) return;
  await idbPut("cache", {
    key: `cache_${state.user.uid}_${state.farm.id}`,
    uid: state.user.uid,
    farmId: state.farm.id,
    animals: state.animals,
    vetLogs: state.vetLogs,
    tasks: state.tasks,
    members: state.members,
    updatedAt: Date.now()
  });
}

async function restoreLocalSnapshot(uid, farmId) {
  const snap = await idbGet("cache", `cache_${uid}_${farmId}`);
  if (snap) {
    state.animals = snap.animals || [];
    state.vetLogs = snap.vetLogs || [];
    state.tasks = snap.tasks || [];
    state.members = snap.members || [];
  }
}

// P0 #4 FIX: Merge server query results with pending outbox operations so offline data is NEVER lost
function mergeServerWithPendingOutbox(collectionName, serverDocs, pendingOps) {
  const mergedMap = new Map();
  for (const docItem of serverDocs) {
    mergedMap.set(docItem.id, docItem);
  }
  const relevantOps = pendingOps.filter((op) => op.collectionName === collectionName);
  for (const op of relevantOps) {
    const existing = mergedMap.get(op.docId) || { id: op.docId };
    mergedMap.set(op.docId, {
      ...existing,
      ...op.payload,
      id: op.docId,
      _syncStatus: "queued"
    });
  }
  return Array.from(mergedMap.values()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

async function enqueueOutbox(collectionName, docId, payload, fileBlob = null, filePath = null) {
  if (!state.user || !state.farm) return;
  const op = {
    opId: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    uid: state.user.uid,
    farmId: state.farm.id,
    collectionName,
    docId,
    payload,
    fileBlob,
    filePath,
    baseUpdatedAt: payload._baseUpdatedAt || null,
    retries: 0,
    nextRetryAt: Date.now(),
    createdAt: Date.now()
  };
  await idbPut("outbox", op);
  await refreshSyncCounters();
  if (navigator.onLine && state.mode === "cloud") {
    flushOutbox();
  }
}

async function refreshSyncCounters() {
  const ops = await getScopedOutbox();
  const conflicts = await getScopedConflicts();
  state.outboxCount = ops.length;
  state.conflicts = conflicts;
  const sideSync = document.getElementById("sideSyncStatus");
  if (sideSync) {
    sideSync.innerHTML = "";
    sideSync.appendChild(el("span", {
      class: ops.length > 0 ? "badge badge-amber" : "badge badge-green",
      text: ops.length > 0 ? `${t("queued")}: ${ops.length}` : t("synced")
    }));
  }
  const cBtn = document.getElementById("conflictsBtn");
  const cCnt = document.getElementById("conflictCount");
  if (cBtn && cCnt) {
    cCnt.textContent = String(conflicts.length);
    cBtn.classList.toggle("hidden", conflicts.length === 0);
  }
}

let syncRunning = false;
async function flushOutbox() {
  if (syncRunning || state.mode !== "cloud" || !state.fb || !navigator.onLine || !state.user || !state.farm) return;
  syncRunning = true;
  try {
    const ops = await getScopedOutbox();
    const { doc, getDoc, setDoc, ref, uploadBytes, getDownloadURL } = state.fb;
    for (const op of ops) {
      if (op.nextRetryAt > Date.now()) continue;
      try {
        const docRef = doc(state.fb.db, `farms/${op.farmId}/${op.collectionName}/${op.docId}`);
        if (op.baseUpdatedAt) {
          const existing = await getDoc(docRef);
          if (existing.exists() && existing.data().updatedAtMs && existing.data().updatedAtMs > op.baseUpdatedAt) {
            await idbPut("conflicts", {
              id: op.opId,
              uid: op.uid,
              farmId: op.farmId,
              collectionName: op.collectionName,
              docId: op.docId,
              localData: op.payload,
              serverData: existing.data(),
              detectedAt: Date.now()
            });
            await idbDelete("outbox", op.opId);
            continue;
          }
        }
        const finalPayload = { ...op.payload, _syncStatus: "synced", updatedAtMs: Date.now() };
        delete finalPayload._baseUpdatedAt;

        if (op.fileBlob && op.filePath) {
          const sRef = ref(state.fb.storage, op.filePath);
          await uploadBytes(sRef, op.fileBlob);
          finalPayload.photoProofUrl = await getDownloadURL(sRef);
        }
        await setDoc(docRef, finalPayload, { merge: true });
        await idbDelete("outbox", op.opId);
      } catch (err) {
        op.retries = (op.retries || 0) + 1;
        op.lastError = err?.message || "sync_failed";
        op.nextRetryAt = Date.now() + Math.min(60000, 1000 * Math.pow(2, op.retries));
        await idbPut("outbox", op);
      }
    }
  } finally {
    syncRunning = false;
    await refreshSyncCounters();
  }
}

// P1 #6 FIX: Automatic periodic retry scheduler (every 10s when online and queue non-empty)
function startOutboxRetryScheduler() {
  if (outboxRetryTimer) clearInterval(outboxRetryTimer);
  outboxRetryTimer = setInterval(() => {
    if (navigator.onLine && state.mode === "cloud" && state.outboxCount > 0) {
      flushOutbox();
    }
  }, 10000);
}

// --- FIREBASE LOADER ---
function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem("fq_firebase_config");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  if (typeof window.__firebase_config === "object" && window.__firebase_config?.apiKey) {
    return window.__firebase_config;
  }
  return null;
}

async function initFirebaseIfConfigured() {
  const cfg = getStoredFirebaseConfig();
  const warnBanner = document.getElementById("configWarningBanner");
  if (!cfg) {
    warnBanner?.classList.remove("hidden");
    return false;
  }
  warnBanner?.classList.add("hidden");
  try {
    const [{ initializeApp }, authMod, fsMod, stMod, fnMod] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js"),
      import("https://www.gstatic.com/firebasejs/10.13.2/firebase-functions.js")
    ]);
    const app = initializeApp(cfg);
    const auth = authMod.getAuth(app);
    const db = fsMod.initializeFirestore(app, {
      localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() })
    });
    const storage = stMod.getStorage(app);
    const functions = fnMod.getFunctions(app);
    state.fb = { app, auth, db, storage, functions, ...authMod, ...fsMod, ...stMod, ...fnMod };
    state.mode = "cloud";

    authMod.onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await loadCloudUserSession(fbUser);
      } else {
        resetSessionState();
        showAuthScreen();
      }
    });
    return true;
  } catch (err) {
    showToast("Firebase init error: " + err.message);
    return false;
  }
}

async function loadCloudUserSession(fbUser) {
  const { doc, getDoc, collection, query, orderBy, limit, getDocs } = state.fb;
  state.user = { uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName || fbUser.email };

  const userSnap = await getDoc(doc(state.fb.db, `users/${fbUser.uid}`));
  const farmId = userSnap.exists() ? userSnap.data().defaultFarmId : null;
  if (!farmId) {
    state.farm = { id: "none", name: "Шаруашылық таңдалмаған" };
    state.memberStatus = "pending";
    state.roles = [];
    enterAppShell();
    return;
  }

  const [farmSnap, memSnap] = await Promise.all([
    getDoc(doc(state.fb.db, `farms/${farmId}`)),
    getDoc(doc(state.fb.db, `farms/${farmId}/members/${fbUser.uid}`))
  ]);

  state.farm = farmSnap.exists() ? { id: farmId, ...farmSnap.data() } : { id: farmId, name: farmId };
  state.memberStatus = memSnap.exists() ? memSnap.data().status : "pending";
  state.roles = memSnap.exists() ? (memSnap.data().roles || []) : [];

  await restoreLocalSnapshot(fbUser.uid, farmId);
  const pendingOps = await getScopedOutbox();

  if (state.memberStatus === "active") {
    const aQ = query(collection(state.fb.db, `farms/${farmId}/animals`), orderBy("createdAtMs", "desc"), limit(PAGE_SIZE));
    const aSnap = await getDocs(aQ);
    const serverAnimals = aSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    state.animalsCursor = aSnap.docs[aSnap.docs.length - 1] || null;

    const [vSnap, tSnap, mSnap] = await Promise.all([
      getDocs(query(collection(state.fb.db, `farms/${farmId}/vetLogs`), orderBy("createdAtMs", "desc"), limit(30))),
      getDocs(query(collection(state.fb.db, `farms/${farmId}/tasks`), orderBy("createdAtMs", "desc"), limit(30))),
      getDocs(collection(state.fb.db, `farms/${farmId}/members`))
    ]);
    const serverVetLogs = vSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const serverTasks = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Merge pending local outbox items on top of server docs so NOTHING is overwritten!
    state.animals = mergeServerWithPendingOutbox("animals", serverAnimals, pendingOps);
    state.vetLogs = mergeServerWithPendingOutbox("vetLogs", serverVetLogs, pendingOps);
    state.tasks = mergeServerWithPendingOutbox("tasks", serverTasks, pendingOps);
    state.members = mSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    await persistLocalSnapshot();
  }
  startOutboxRetryScheduler();
  enterAppShell();
  if (navigator.onLine) flushOutbox();
}

// --- LOCAL SANDBOX MODE ---
async function enterSandboxMode() {
  state.mode = "sandbox";
  state.user = { uid: "local_owner", email: "local@sandbox.kz", name: "Фермер (Local Sandbox)" };
  state.farm = { id: "sandbox_farm_01", name: "«Береке» ШҚ (Local Sandbox)" };
  state.roles = ["owner", "shepherd", "vet", "worker"];
  state.memberStatus = "active";
  await restoreLocalSnapshot(state.user.uid, state.farm.id);
  if (state.animals.length === 0) {
    state.animals = [
      { id: "an_1", earTag: "KZ-0248", species: "cattle", breed: "Голштин", sex: "female", weightKg: 480, birthDate: "2023-04-12", group: "№1 Табын", withdrawalMeatUntil: null, withdrawalMilkUntil: null, _syncStatus: "local", createdAtMs: Date.now() - 5000 },
      { id: "an_2", earTag: "KZ-0249", species: "sheep", breed: "Еділбай", sex: "female", weightKg: 62, birthDate: "2024-03-20", group: "№2 Отар", withdrawalMeatUntil: null, withdrawalMilkUntil: null, _syncStatus: "local", createdAtMs: Date.now() - 4000 },
      { id: "an_3", earTag: "KZ-0250", species: "camel", breed: "Қазақ бактрианы", sex: "male", weightKg: 610, birthDate: "2022-05-01", group: "Түйе тобы", withdrawalMeatUntil: null, withdrawalMilkUntil: null, _syncStatus: "local", createdAtMs: Date.now() - 3000 }
    ];
    state.members = [
      { id: "local_owner", name: "Мердан (Иесі)", email: "local@sandbox.kz", roles: ["owner"], status: "active" },
      { id: "local_worker_1", name: "Ержан (Жұмысшы)", email: "erzhan@example.kz", roles: ["worker"], status: "active" },
      { id: "local_pending_1", name: "Айдос (Өтінім)", email: "aidos@example.kz", requestedRole: "shepherd", roles: [], status: "pending" }
    ];
    await persistLocalSnapshot();
  }
  enterAppShell();
}

// --- NAVIGATION & SHELL ---
function showAuthScreen() {
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("appShell").classList.add("hidden");
}

function enterAppShell() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("modeBadgeText").textContent = state.mode === "cloud" ? "CLOUD v2.1" : "OFFLINE SANDBOX";
  document.getElementById("sandboxBanner").classList.toggle("hidden", state.mode !== "sandbox");
  document.getElementById("pendingBanner").classList.toggle("hidden", state.memberStatus !== "pending");
  document.getElementById("sideFarmName").textContent = state.farm?.name || "—";
  document.getElementById("sideUserRole").textContent = state.roles.map((r) => t(`role_${r}`)).join(", ") || state.memberStatus;
  renderNav();
  refreshSyncCounters();
  goToPage("dashboard");
}

function renderNav() {
  const nav = document.getElementById("navList");
  nav.innerHTML = "";
  const items = [
    { id: "dashboard", icon: "▦", roles: ["owner", "shepherd", "vet", "worker"] },
    { id: "livestock", icon: "🐄", roles: ["owner", "shepherd", "vet"] },
    { id: "ai", icon: "✧", roles: ["owner", "shepherd", "vet"] },
    { id: "scanner", icon: "⛨", roles: ["owner", "shepherd", "vet"] },
    { id: "vet", icon: "🩺", roles: ["owner", "vet", "shepherd"] },
    { id: "tasks", icon: "☑", roles: ["owner", "shepherd", "worker"] },
    { id: "staff", icon: "♙", roles: ["owner"] },
    { id: "reports", icon: "▥", roles: ["owner"] }
  ];
  for (const item of items) {
    if (!hasRole(...item.roles)) continue;
    const btn = el("button", {
      class: state.page === item.id ? "active" : "",
      onClick: () => {
        goToPage(item.id);
        document.getElementById("sidebar").classList.remove("open");
      }
    }, [el("span", { text: item.icon }), el("span", { text: t(`nav_${item.id}`) })]);
    nav.appendChild(btn);
  }
}

function goToPage(pageId) {
  state.page = pageId;
  document.getElementById("pageCrumb").textContent = t(`nav_${pageId}`);
  renderNav();
  const root = document.getElementById("pageRoot");
  root.innerHTML = "";
  if (state.memberStatus !== "active") {
    root.appendChild(el("div", { class: "panel", text: t("pendingApprovalMsg") }));
    return;
  }
  if (pageId === "dashboard") renderDashboard(root);
  else if (pageId === "livestock") renderLivestock(root);
  else if (pageId === "ai") renderAiPage(root);
  else if (pageId === "scanner") renderScannerPage(root);
  else if (pageId === "vet") renderVetPage(root);
  else if (pageId === "tasks") renderTasksPage(root);
  else if (pageId === "staff") renderStaffPage(root);
  else if (pageId === "reports") renderReportsPage(root);
}

// --- PAGE 1: DASHBOARD ---
function renderDashboard(root) {
  const today = localDateISO();
  const activeWithdrawals = state.animals.filter(
    (a) => (a.withdrawalMeatUntil && a.withdrawalMeatUntil >= today) || (a.withdrawalMilkUntil && a.withdrawalMilkUntil >= today)
  ).length;

  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [
      el("h2", { text: `${state.farm.name}` }),
      el("span", { class: "muted", text: `${t("nav_dashboard")} · ${today}` })
    ]),
    hasRole("owner", "shepherd") ? el("button", { class: "btn btn-primary", text: "+ " + t("addAnimal"), onClick: () => openAnimalFormModal() }) : null
  ]));

  const cards = el("div", { class: "cards-4" }, [
    statCard("🐄", t("nav_livestock"), String(state.animals.length)),
    statCard("🩺", "Каренция (белсенді)", String(activeWithdrawals)),
    statCard("☑", t("nav_tasks"), String(state.tasks.filter((x) => x.status !== "done").length)),
    statCard("⏳", t("queued"), String(state.outboxCount))
  ]);
  root.appendChild(cards);

  const panel = el("div", { class: "panel" }, [
    el("div", { class: "panel-head" }, [el("h3", { text: "8 санат бойынша мал басы / Поголовье по 8 видам" })])
  ]);
  const grid = el("div", { class: "cards-4" });
  for (const sp of SPECIES_KEYS) {
    const cnt = state.animals.filter((a) => a.species === sp).length;
    grid.appendChild(el("div", { class: "card" }, [
      el("div", { class: "muted", text: t(`species_${sp}`) }),
      el("div", { class: "stat-num", text: String(cnt) })
    ]));
  }
  panel.appendChild(grid);
  root.appendChild(panel);
}

function statCard(icon, label, val) {
  return el("div", { class: "card" }, [
    el("div", { style: "display:flex;justify-content:space-between;align-items:center" }, [
      el("span", { class: "muted", text: label }),
      el("span", { text: icon })
    ]),
    el("div", { class: "stat-num", text: val })
  ]);
}

// --- PAGE 2: LIVESTOCK ---
function renderLivestock(root) {
  let searchQ = "";
  let filterSp = "";

  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [el("h2", { text: t("nav_livestock") })]),
    el("button", { class: "btn btn-primary", text: "+ " + t("addAnimal"), onClick: () => openAnimalFormModal() })
  ]));

  const panel = el("div", { class: "panel" });
  const searchIn = el("input", { class: "pill", placeholder: "Іздеу / Поиск (KZ-..., топ)..." });
  const spSel = el("select", { class: "pill" }, [
    el("option", { value: "", text: "Барлық 8 түр / Все 8 видов" }),
    ...SPECIES_KEYS.map((sp) => el("option", { value: sp, text: t(`species_${sp}`) }))
  ]);
  const tableWrap = el("div", { class: "table-wrap" });

  function drawTable() {
    tableWrap.innerHTML = "";
    const today = localDateISO();
    const list = state.animals.filter((a) => {
      if (filterSp && a.species !== filterSp) return false;
      if (searchQ && !`${a.earTag || ""} ${a.breed || ""} ${a.group || ""}`.toLowerCase().includes(searchQ)) return false;
      return true;
    });
    const tbl = el("table", {}, [
      el("thead", {}, [
        el("tr", {}, ["Сырға / Бирка", "Түрі / Вид", "Тұқымы / Порода", "Салмақ (кг)", "Топ / Группа", "Каренция", "Күйі"].map((h) => el("th", { text: h })))
      ]),
      el("tbody", {}, list.map((a) => {
        const meatLock = a.withdrawalMeatUntil && a.withdrawalMeatUntil >= today;
        const milkLock = a.withdrawalMilkUntil && a.withdrawalMilkUntil >= today;
        const karText = [meatLock ? `Ет: ${a.withdrawalMeatUntil}` : "", milkLock ? `Сүт: ${a.withdrawalMilkUntil}` : ""].filter(Boolean).join(" | ") || "—";
        return el("tr", {}, [
          el("td", {}, [el("strong", { text: a.earTag || "—" })]),
          el("td", { text: a.species ? t(`species_${a.species}`) : "—" }),
          el("td", { text: a.breed || "—" }),
          el("td", { text: a.weightKg ? String(a.weightKg) : "—" }),
          el("td", { text: a.group || "—" }),
          el("td", {}, [el("span", { class: (meatLock || milkLock) ? "badge badge-red" : "badge badge-green", text: karText })]),
          el("td", {}, [el("span", { class: a._syncStatus === "queued" ? "badge badge-amber" : "badge badge-green", text: a._syncStatus === "queued" ? t("queued") : t("synced") })])
        ]);
      }))
    ]);
    tableWrap.appendChild(tbl);
  }

  searchIn.addEventListener("input", (e) => { searchQ = e.target.value.toLowerCase(); drawTable(); });
  spSel.addEventListener("change", (e) => { filterSp = e.target.value; drawTable(); });

  panel.appendChild(el("div", { class: "toolbar" }, [searchIn, spSel]));
  panel.appendChild(tableWrap);

  if (state.mode === "cloud" && state.animalsCursor) {
    panel.appendChild(el("div", { style: "margin-top:12px" }, [
      el("button", {
        class: "btn btn-secondary",
        text: t("loadMore"),
        onClick: async () => {
          const { collection, query, orderBy, startAfter, limit, getDocs } = state.fb;
          const q = query(collection(state.fb.db, `farms/${state.farm.id}/animals`), orderBy("createdAtMs", "desc"), startAfter(state.animalsCursor), limit(PAGE_SIZE));
          const snap = await getDocs(q);
          if (snap.empty) { state.animalsCursor = null; showToast("Барлық жазбалар жүктелді"); return; }
          state.animalsCursor = snap.docs[snap.docs.length - 1];
          const pendingOps = await getScopedOutbox();
          const combined = [...state.animals, ...snap.docs.map((d) => ({ id: d.id, ...d.data() }))];
          state.animals = mergeServerWithPendingOutbox("animals", combined, pendingOps);
          await persistLocalSnapshot();
          drawTable();
        }
      })
    ]));
  }
  drawTable();
  root.appendChild(panel);
}

function openAnimalFormModal(prefill = {}) {
  document.getElementById("dynamicModalTitle").textContent = t("addAnimal");
  const body = document.getElementById("dynamicModalBody");
  body.innerHTML = "";

  const form = el("form", { class: "form-grid" });
  const earIn = el("input", { value: prefill.earTag || "", placeholder: "KZ-XXXX (бос қалдыруға болады)" });
  const spSel = el("select", { required: "true" }, [
    el("option", { value: "", text: "— Таңдаңыз / Выберите —" }),
    ...SPECIES_KEYS.map((sp) => {
      const opt = el("option", { value: sp, text: t(`species_${sp}`) });
      if (prefill.species === sp) opt.selected = true;
      return opt;
    })
  ]);
  const breedIn = el("input", { value: prefill.breed || "", placeholder: "Белгісіз болса бос қалдырыңыз" });
  const sexSel = el("select", {}, [
    el("option", { value: "", text: "Белгісіз / Неизвестно" }),
    el("option", { value: "female", text: "Ұрғашы / Самка" }),
    el("option", { value: "male", text: "Еркек / Самец" })
  ]);
  if (prefill.sex) sexSel.value = prefill.sex;
  const weightIn = el("input", { type: "number", step: "0.1", value: prefill.weightKg || "", placeholder: "Белгісіз болса бос" });
  const birthIn = el("input", { type: "date", value: prefill.birthDate || "" });
  const groupIn = el("input", { value: prefill.group || "", placeholder: "№1 Отар / №1 Табын" });

  form.appendChild(fieldWrap("Сырға нөмірі / Бирка", earIn));
  form.appendChild(fieldWrap("Мал түрі (8 санат) *", spSel));
  form.appendChild(fieldWrap("Тұқымы / Порода", breedIn));
  form.appendChild(fieldWrap("Жынысы / Пол", sexSel));
  form.appendChild(fieldWrap("Салмағы (кг)", weightIn));
  form.appendChild(fieldWrap("Туған күні", birthIn));
  form.appendChild(fieldWrap("Топ / Отар", groupIn, true));

  form.appendChild(el("div", { class: "field full", style: "display:flex;justify-content:flex-end;gap:8px;margin-top:8px" }, [
    el("button", { type: "button", class: "btn btn-secondary", text: t("cancelBtn"), onClick: () => closeModal("dynamicModal") }),
    el("button", { type: "submit", class: "btn btn-primary", text: t("saveBtn") })
  ]));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = `an_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const record = {
      id,
      earTag: earIn.value.trim() || null,
      species: spSel.value || null,
      breed: breedIn.value.trim() || null,
      sex: sexSel.value || null,
      weightKg: weightIn.value ? Number(weightIn.value) : null,
      birthDate: birthIn.value || null,
      group: groupIn.value.trim() || null,
      withdrawalMeatUntil: null,
      withdrawalMilkUntil: null,
      aiSuggested: prefill.aiSuggested || null,
      farmerConfirmed: { confirmedBy: state.user.uid, confirmedAt: new Date().toISOString() },
      _syncStatus: state.mode === "cloud" ? "queued" : "local",
      createdAtMs: Date.now(),
      updatedAtMs: Date.now()
    };
    state.animals.unshift(record);
    await persistLocalSnapshot();
    if (state.mode === "cloud") {
      await enqueueOutbox("animals", id, record);
    }
    closeModal("dynamicModal");
    showToast("Мал карточкасы сақталды");
    goToPage(state.page);
  });

  body.appendChild(form);
  openModal("dynamicModal");
}

function fieldWrap(labelText, inputEl, full = false) {
  return el("div", { class: full ? "field full" : "field" }, [el("label", { text: labelText }), inputEl]);
}

// --- PAGE 3: AI LIVESTOCK REGISTRATION ---
function renderAiPage(root) {
  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [el("h2", { text: t("nav_ai") })])
  ]));
  root.appendChild(el("div", { class: "banner banner-info", text: t("aiZeroFabNotice") }));

  const panel = el("div", { class: "panel" });
  const fileInput = el("input", { type: "file", accept: "image/*,video/*", multiple: "true" });
  const previewBox = el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin:12px 0" });
  const resultBox = el("div", { style: "margin-top:16px" });
  let extractedFrames = [];

  fileInput.addEventListener("change", async (e) => {
    extractedFrames = [];
    previewBox.innerHTML = "";
    const files = Array.from(e.target.files || []).slice(0, 6);
    for (const file of files) {
      if (file.type.startsWith("video/")) {
        const frames = await extractVideoFrames(file, 6);
        extractedFrames.push(...frames);
      } else if (file.type.startsWith("image/")) {
        const b64 = await resizeImageToBase64(file, 1024);
        extractedFrames.push(b64);
      }
    }
    extractedFrames = extractedFrames.slice(0, 6);
    for (const b64 of extractedFrames) {
      previewBox.appendChild(el("img", { src: b64, class: "thumb" }));
    }
  });

  const analyzeBtn = el("button", {
    class: "btn btn-primary",
    text: "✧ Cloud Function арқылы AI талдау",
    onClick: async () => {
      if (!extractedFrames.length) { showToast("Фото немесе видео таңдаңыз"); return; }
      resultBox.innerHTML = "";
      if (state.mode !== "cloud" || !state.fb) {
        resultBox.appendChild(el("div", {
          class: "banner banner-warn",
          text: "Қауіпсіздік талабы: Gemini API кілті браузерде сақталмайды. Нақты AI талдау үшін Firebase Cloud Functions (analyzeLivestockAI) қосылған болуы керек."
        }));
        return;
      }
      analyzeBtn.disabled = true;
      try {
        const fn = state.fb.httpsCallable(state.fb.functions, "analyzeLivestockAI");
        const res = await fn({
          farmId: state.farm.id,
          imagesBase64: extractedFrames,
          mode: extractedFrames.length > 1 ? "multi" : "single",
          language: state.lang === "ru" ? "ru" : "kk"
        });
        renderAiResultsSafely(resultBox, res.data);
      } catch (err) {
        resultBox.appendChild(el("div", { class: "banner banner-danger", text: "AI қатесі: " + err.message }));
      } finally {
        analyzeBtn.disabled = false;
      }
    }
  });

  panel.appendChild(el("div", { class: "field full" }, [
    el("label", { text: "1–6 фото немесе қысқа видео (6 кадр бөлінеді)" }),
    fileInput
  ]));
  panel.appendChild(previewBox);
  panel.appendChild(analyzeBtn);
  panel.appendChild(resultBox);
  root.appendChild(panel);
}

function renderAiResultsSafely(container, data) {
  container.innerHTML = "";
  if (data.quota) {
    container.appendChild(el("div", {
      class: "banner banner-info",
      text: `Күндік AI квота қалдығы — Пайдаланушы: ${data.quota.remainingUser}, Шаруашылық: ${data.quota.remainingFarm}`
    }));
  }
  if (data.aiDisclaimer) {
    container.appendChild(el("div", { class: "banner banner-warn", text: data.aiDisclaimer }));
  }
  const list = data.individuals || [];
  if (!list.length) {
    container.appendChild(el("p", { class: "muted", text: "Жануар анықталмады." }));
    return;
  }
  for (const [idx, ind] of list.entries()) {
    const card = el("div", { class: "card", style: "margin-bottom:12px" }, [
      el("strong", { text: `#${idx + 1} AI болжамы (Белгісіз өрістер бос)` }),
      el("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0;font-size:12px" }, [
        aiFieldBadge("Түрі", ind.species?.value ? t(`species_${ind.species.value}`) : null, ind.species?.confidence),
        aiFieldBadge("Тұқымы", ind.breed?.value, ind.breed?.confidence),
        aiFieldBadge("Түсі", ind.color?.value, ind.color?.confidence),
        aiFieldBadge("Жынысы", ind.sex?.value, ind.sex?.confidence),
        aiFieldBadge("Сырға", ind.earTag?.value, ind.earTag?.confidence),
        aiFieldBadge("Салмақ (кг)", ind.estimatedWeightKg?.value, ind.estimatedWeightKg?.confidence)
      ]),
      el("button", {
        class: "btn btn-primary",
        text: "Фермер ретінде тексеру және сақтау",
        onClick: () => openAnimalFormModal({
          species: ind.species?.value || "",
          breed: ind.breed?.value || "",
          sex: ind.sex?.value || "",
          earTag: ind.earTag?.value || "",
          weightKg: ind.estimatedWeightKg?.value || "",
          aiSuggested: ind
        })
      })
    ]);
    container.appendChild(card);
  }
}

function aiFieldBadge(label, val, conf) {
  const pct = Math.round((Number(conf) || 0) * 100);
  return el("div", {}, [
    el("div", { class: "muted", text: label }),
    el("strong", { text: val !== null && val !== undefined ? String(val) : "— (бос)" }),
    el("div", { class: "muted", text: `Сенімділік: ${pct}%` })
  ]);
}

function resizeImageToBase64(file, maxDim = 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractVideoFrames(file, count = 6) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = URL.createObjectURL(file);
    const frames = [];
    video.onloadedmetadata = async () => {
      const dur = video.duration || 1;
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = Math.round((video.videoHeight / (video.videoWidth || 1)) * 640) || 360;
      const ctx = c.getContext("2d");
      for (let i = 0; i < count; i++) {
        const ts = (dur * (i + 0.5)) / count;
        await new Promise((res) => {
          video.currentTime = Math.min(dur - 0.05, ts);
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, c.width, c.height);
            frames.push(c.toDataURL("image/jpeg", 0.78));
            res();
          };
        });
      }
      URL.revokeObjectURL(video.src);
      resolve(frames);
    };
  });
}

// --- PAGE 4: EAR TAG SCANNER ---
function renderScannerPage(root) {
  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [el("h2", { text: t("nav_scanner") })])
  ]));
  root.appendChild(el("div", {
    class: "banner banner-info",
    text: "QR/штрихкод браузердің BarcodeDetector API арқылы оқылады. RFID оқу үшін Bluetooth/USB RFID оқырман шлюзі қажет (веб-браузер RFID-ді тікелей оқымайды)."
  }));

  const panel = el("div", { class: "panel" });
  const tagIn = el("input", { class: "pill", placeholder: "Сырға нөмірі: KZ-0248", style: "min-width:240px" });
  const resBox = el("div", { style: "margin-top:14px" });

  function lookupTag(raw) {
    resBox.innerHTML = "";
    const clean = raw.trim();
    if (!clean) return;
    const found = state.animals.find((a) => (a.earTag || "").toLowerCase() === clean.toLowerCase());
    if (found) {
      resBox.appendChild(el("div", { class: "card" }, [
        el("strong", { text: `Табылды: ${found.earTag}` }),
        el("div", { class: "muted", text: `${t(`species_${found.species}`)} · ${found.breed || "—"} · ${found.group || "—"}` })
      ]));
    } else {
      resBox.appendChild(el("div", { class: "card" }, [
        el("div", { text: `«${clean}» нөмірі базада табылмады.` }),
        el("button", {
          class: "btn btn-primary",
          style: "margin-top:10px",
          text: "Осы нөмірмен жаңа мал тіркеу",
          onClick: () => openAnimalFormModal({ earTag: clean })
        })
      ]));
    }
  }

  panel.appendChild(el("div", { class: "toolbar" }, [
    tagIn,
    el("button", { class: "btn btn-primary", text: "Іздеу / Найти", onClick: () => lookupTag(tagIn.value) })
  ]));
  panel.appendChild(resBox);
  root.appendChild(panel);
}

// --- PAGE 5: VETERINARY (P0 #2 Role Alignment + P0 #3 Server-Side Full-Group Treatment) ---
function renderVetPage(root) {
  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [el("h2", { text: t("nav_vet") })])
  ]));
  root.appendChild(el("div", { class: "banner banner-danger", text: t("vetLockBanner") }));

  // 1) Emergency Alert Form (Available to Shepherd, Vet, and Owner — matches firestore.rules!)
  const alertPanel = el("div", { class: "panel" }, [
    el("div", { class: "panel-head" }, [el("h3", { text: "🚨 Ветеринарға шұғыл дабыл жіберу (Малшы / Ветеринар / Иесі)" })])
  ]);
  const alertForm = el("form", { class: "form-grid" });
  const alertAnimalSel = el("select", {}, [
    el("option", { value: "", text: "— Мал таңдау (міндетті емес) —" }),
    ...state.animals.map((a) => el("option", { value: a.id, text: `${a.earTag || a.id} (${a.group || "—"})` }))
  ]);
  const sevSel = el("select", {}, [
    el("option", { value: "high", text: "Жоғары / Высокий" }),
    el("option", { value: "critical", text: "Шұғыл / Критический" }),
    el("option", { value: "medium", text: "Орташа / Средний" })
  ]);
  const sympIn = el("textarea", { rows: "2", required: "true", placeholder: "Белгілерін сипаттаңыз (қызу, ақсау, тәбеттің жоқтығы...)" });
  alertForm.appendChild(fieldWrap("Мал", alertAnimalSel));
  alertForm.appendChild(fieldWrap("Қауіп деңгейі", sevSel));
  alertForm.appendChild(fieldWrap("Ауру белгілері *", sympIn, true));
  alertForm.appendChild(el("div", { class: "field full" }, [
    el("button", { type: "submit", class: "btn btn-danger", text: "🚨 Шұғыл дабыл жіберу" })
  ]));

  alertForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      type: "emergency_alert",
      animalId: alertAnimalSel.value || null,
      symptoms: sympIn.value.trim(),
      severity: sevSel.value,
      reportedBy: state.user.uid,
      createdAtMs: Date.now()
    };
    if (state.mode === "cloud" && state.fb && navigator.onLine) {
      try {
        const fn = state.fb.httpsCallable(state.fb.functions, "dispatchVetEmergency");
        const res = await fn({ farmId: state.farm.id, ...payload });
        state.vetLogs.unshift({ id: res.data.alertId, ...payload });
        await persistLocalSnapshot();
        showToast(res.data.message);
        goToPage("vet");
      } catch (err) {
        showToast("Дабыл қатесі: " + err.message);
      }
    } else {
      const id = `alert_${Date.now()}`;
      state.vetLogs.unshift({ id, ...payload, _syncStatus: state.mode === "cloud" ? "queued" : "local" });
      await persistLocalSnapshot();
      if (state.mode === "cloud") await enqueueOutbox("vetLogs", id, payload);
      showToast("Дабыл тіркелді (Офлайн кезекке қойылды)");
      goToPage("vet");
    }
  });
  alertPanel.appendChild(alertForm);
  root.appendChild(alertPanel);

  // 2) Treatment Registration Form — STRICTLY Owner & Vet ONLY (P0 #2 FIX!)
  if (hasRole("owner", "vet")) {
    const panel = el("div", { class: "panel" }, [
      el("div", { class: "panel-head" }, [el("h3", { text: "💉 Ветеринарлық емдеу журналы (Топтық емдеу серверде толық орындалады)" })])
    ]);

    const form = el("form", { class: "form-grid" });
    const targetMode = el("select", {}, [
      el("option", { value: "single", text: "Жеке мал / Одно животное" }),
      el("option", { value: "group", text: "Бүкіл топ / Вся группа (серверлік толық қамту — 300+ мал)" })
    ]);
    const animalSel = el("select", {}, state.animals.map((a) => el("option", { value: a.id, text: `${a.earTag || a.id} (${a.group || "—"})` })));
    const groups = [...new Set(state.animals.map((a) => a.group).filter(Boolean))];
    const groupInput = el("input", { class: "hidden", list: "vetGroupList", placeholder: "Топ атауы (мысалы: №2 Отар)" });
    const dataList = el("datalist", { id: "vetGroupList" }, groups.map((g) => el("option", { value: g })));

    targetMode.addEventListener("change", () => {
      const isGrp = targetMode.value === "group";
      animalSel.classList.toggle("hidden", isGrp);
      groupInput.classList.toggle("hidden", !isGrp);
    });

    const drugIn = el("input", { required: "true", placeholder: "Препарат атауы (ресми нұсқаулық бойынша)" });
    const batchIn = el("input", { required: "true", placeholder: "Серия / Партия нөмірі" });
    const expIn = el("input", { type: "date", required: "true" });
    const doseIn = el("input", { required: "true", placeholder: "Нақты доза (мл) + енгізу жолы (б/е, т/а)" });
    const vetNameIn = el("input", { required: "true", value: state.user?.name || "", placeholder: "Ветеринар аты-жөні / лицензия" });
    const meatDaysIn = el("input", { type: "number", min: "0", value: "0", placeholder: "Ет каренциясы (күн)" });
    const milkDaysIn = el("input", { type: "number", min: "0", value: "0", placeholder: "Сүт каренциясы (күн)" });

    form.appendChild(fieldWrap("Емдеу түрі", targetMode));
    form.appendChild(fieldWrap("Мал немесе Топ", el("div", {}, [animalSel, groupInput, dataList])));
    form.appendChild(fieldWrap("Препарат атауы *", drugIn));
    form.appendChild(fieldWrap("Серия / Партия *", batchIn));
    form.appendChild(fieldWrap("Жарамдылық мерзімі *", expIn));
    form.appendChild(fieldWrap("Нақты доза және енгізу жолы *", doseIn));
    form.appendChild(fieldWrap("Ет каренциясы (күн)", meatDaysIn));
    form.appendChild(fieldWrap("Сүт каренциясы (күн)", milkDaysIn));
    form.appendChild(fieldWrap("Тағайындаған ветеринар *", vetNameIn, true));
    const submitBtn = el("button", { type: "submit", class: "btn btn-primary", text: "Емдеуді тіркеу және каренция қою" });
    form.appendChild(el("div", { class: "field full" }, [submitBtn]));

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const isGroup = targetMode.value === "group";
      const meatDays = Number(meatDaysIn.value) || 0;
      const milkDays = Number(milkDaysIn.value) || 0;

      // P0 #3 FIX: Cloud Group Treatment MUST execute on server (recordVetTreatment) to cover ALL animals (300+)
      if (state.mode === "cloud" && isGroup) {
        if (!navigator.onLine || !state.fb) {
          showToast("Топтық емдеу барлық малды қамту үшін интернет байланысы мен серверлік орындауды талап етеді.");
          return;
        }
        submitBtn.disabled = true;
        try {
          const fn = state.fb.httpsCallable(state.fb.functions, "recordVetTreatment");
          const res = await fn({
            farmId: state.farm.id,
            targetMode: "group",
            groupName: groupInput.value.trim(),
            drugName: drugIn.value.trim(),
            batchNumber: batchIn.value.trim(),
            expiryDate: expIn.value,
            doseAndRoute: doseIn.value.trim(),
            vetName: vetNameIn.value.trim(),
            meatWithdrawalDays: meatDays,
            milkWithdrawalDays: milkDays
          });
          // Also update locally cached animals matching this group
          const meatUntil = res.data.withdrawalMeatUntil;
          const milkUntil = res.data.withdrawalMilkUntil;
          for (const a of state.animals.filter((x) => x.group === groupInput.value.trim())) {
            if (meatUntil && (!a.withdrawalMeatUntil || meatUntil > a.withdrawalMeatUntil)) a.withdrawalMeatUntil = meatUntil;
            if (milkUntil && (!a.withdrawalMilkUntil || milkUntil > a.withdrawalMilkUntil)) a.withdrawalMilkUntil = milkUntil;
          }
          await persistLocalSnapshot();
          showToast(`Сервер растады: ${res.data.affectedCount} малға каренция қойылды (verifiedComplete: ${res.data.verifiedComplete}).`);
          goToPage("vet");
        } catch (err) {
          showToast("Серверлік қате: " + err.message);
        } finally {
          submitBtn.disabled = false;
        }
        return;
      }

      // Single animal treatment (Cloud online -> Cloud Function; Cloud offline -> Outbox; Sandbox -> Local)
      const meatUntil = meatDays > 0 ? addDaysLocalISO(meatDays) : null;
      const milkUntil = milkDays > 0 ? addDaysLocalISO(milkDays) : null;
      const affected = isGroup
        ? state.animals.filter((a) => a.group === groupInput.value.trim())
        : state.animals.filter((a) => a.id === animalSel.value);

      for (const a of affected) {
        if (meatUntil && (!a.withdrawalMeatUntil || meatUntil > a.withdrawalMeatUntil)) a.withdrawalMeatUntil = meatUntil;
        if (milkUntil && (!a.withdrawalMilkUntil || milkUntil > a.withdrawalMilkUntil)) a.withdrawalMilkUntil = milkUntil;
        a.updatedAtMs = Date.now();
        if (state.mode === "cloud") await enqueueOutbox("animals", a.id, a);
      }

      const logId = `vet_${Date.now()}`;
      const logEntry = {
        id: logId,
        type: "treatment",
        targetMode: targetMode.value,
        affectedCount: affected.length,
        affectedAnimalIds: affected.map((a) => a.id),
        drugName: drugIn.value.trim(),
        batchNumber: batchIn.value.trim(),
        expiryDate: expIn.value,
        doseAndRoute: doseIn.value.trim(),
        vetName: vetNameIn.value.trim(),
        withdrawalMeatUntil: meatUntil,
        withdrawalMilkUntil: milkUntil,
        createdAtMs: Date.now()
      };
      state.vetLogs.unshift(logEntry);
      await persistLocalSnapshot();
      if (state.mode === "cloud") await enqueueOutbox("vetLogs", logId, logEntry);

      showToast(`Емдеу тіркелді. Каренция ${affected.length} малға қойылды.`);
      goToPage("vet");
    });

    panel.appendChild(form);
    root.appendChild(panel);
  } else {
    root.appendChild(el("div", {
      class: "banner banner-info",
      text: "Сіздің рөліңіз (Малшы) тек шұғыл дабыл жіберуге арналған. Емдеу және каренцияны тек Ветеринар немесе Фермер-иесі тіркейді."
    }));
  }
}

// --- PAGE 6: TASKS (P0 #1 completedAtMs Alignment + P1 #7 Proper Assignee Selection) ---
function renderTasksPage(root) {
  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [el("h2", { text: t("nav_tasks") })]),
    hasRole("owner", "shepherd") ? el("button", {
      class: "btn btn-primary",
      text: "+ Тапсырма тағайындау",
      onClick: openTaskCreateModal
    }) : null
  ]));

  const panel = el("div", { class: "panel" });
  const visibleTasks = hasRole("owner", "shepherd")
    ? state.tasks
    : state.tasks.filter((tk) => tk.assignedTo === state.user.uid);

  if (!visibleTasks.length) {
    panel.appendChild(el("p", { class: "muted", text: "Тапсырмалар жоқ." }));
  }

  for (const task of visibleTasks) {
    const canComplete = hasRole("owner", "shepherd") || task.assignedTo === state.user.uid;
    const fileIn = el("input", { type: "file", accept: "image/*" });
    const completeBtn = el("button", {
      class: "btn btn-soft",
      text: "Фото-дәлелмен аяқтау",
      onClick: async () => {
        const file = fileIn.files?.[0];
        if (!file) { showToast("Алдымен нақты фото таңдаңыз!"); return; }
        const b64Preview = await resizeImageToBase64(file, 900);
        const nowMs = Date.now();
        task.status = "done";
        task.photoProofUrl = b64Preview;
        task.completedAtMs = nowMs;
        task.updatedAtMs = nowMs;
        await persistLocalSnapshot();
        if (state.mode === "cloud") {
          const storagePath = `farms/${state.farm.id}/task_proofs/${task.id}_${nowMs}.jpg`;
          // P0 #1 FIX: Exact keys allowed by firestore.rules: status, photoProofUrl, completedAtMs, updatedAtMs, _syncStatus
          await enqueueOutbox(
            "tasks",
            task.id,
            { status: "done", completedAtMs: nowMs, updatedAtMs: nowMs },
            file,
            storagePath
          );
        }
        showToast("Тапсырма нақты фото-дәлелмен аяқталды!");
        goToPage("tasks");
      }
    });

    panel.appendChild(el("div", { class: "card", style: "margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap" }, [
      el("div", {}, [
        el("strong", { text: task.title }),
        el("div", { class: "muted", text: `Орындаушы: ${task.assignedToName || task.assignedTo || "—"} · Мерзімі: ${task.dueDate || "—"} · Күйі: ${task.status}` })
      ]),
      task.photoProofUrl
        ? el("img", { src: task.photoProofUrl, class: "thumb" })
        : (canComplete ? el("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, [fileIn, completeBtn]) : el("span", { class: "badge badge-amber", text: task.status }))
    ]));
  }
  root.appendChild(panel);
}

// P1 #7 FIX: Task Creation Modal with active member assignee picker
function openTaskCreateModal() {
  document.getElementById("dynamicModalTitle").textContent = "Жаңа тапсырма тағайындау";
  const body = document.getElementById("dynamicModalBody");
  body.innerHTML = "";

  const activeMembers = state.members.filter((m) => m.status === "active");
  const form = el("form", { class: "form-grid" });
  const titleIn = el("input", { required: "true", placeholder: "Мысалы: №2 қорадағы жем-шөпті тексеру" });
  const assigneeSel = el("select", { required: "true" }, activeMembers.map((m) =>
    el("option", { value: m.id, text: `${m.name} (${(m.roles || []).map((r) => t(`role_${r}`)).join(", ")})` })
  ));
  const dueIn = el("input", { type: "date", value: localDateISO() });

  form.appendChild(fieldWrap("Тапсырма атауы *", titleIn, true));
  form.appendChild(fieldWrap("Жауапты қызметкер *", assigneeSel));
  form.appendChild(fieldWrap("Орындау мерзімі", dueIn));
  form.appendChild(el("div", { class: "field full", style: "display:flex;justify-content:flex-end;gap:8px" }, [
    el("button", { type: "button", class: "btn btn-secondary", text: t("cancelBtn"), onClick: () => closeModal("dynamicModal") }),
    el("button", { type: "submit", class: "btn btn-primary", text: "Тағайындау" })
  ]));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const chosen = activeMembers.find((m) => m.id === assigneeSel.value);
    const id = `task_${Date.now()}`;
    const nowMs = Date.now();
    const task = {
      id,
      title: titleIn.value.trim(),
      status: "open",
      assignedTo: assigneeSel.value,
      assignedToName: chosen ? chosen.name : assigneeSel.value,
      dueDate: dueIn.value || null,
      createdBy: state.user.uid,
      photoProofUrl: null,
      createdAtMs: nowMs,
      updatedAtMs: nowMs
    };
    state.tasks.unshift(task);
    await persistLocalSnapshot();
    if (state.mode === "cloud") await enqueueOutbox("tasks", id, task);
    closeModal("dynamicModal");
    showToast(`Тапсырма ${task.assignedToName} атына тағайындалды`);
    goToPage("tasks");
  });

  body.appendChild(form);
  openModal("dynamicModal");
}

// --- PAGE 7: STAFF & RBAC (P1 #9: Only staff roles assignable; owner transfer isolated) ---
function renderStaffPage(root) {
  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [el("h2", { text: t("nav_staff") })]),
    el("button", {
      class: "btn btn-primary",
      text: "+ Шақыру токенін жасау (48 сағ)",
      onClick: async () => {
        if (state.mode === "cloud" && state.fb) {
          const fn = state.fb.httpsCallable(state.fb.functions, "createInviteToken");
          const res = await fn({ farmId: state.farm.id, suggestedRole: "worker", expiresHours: 48 });
          showToast(`Токен жасалды: ${res.data.token}`);
        } else {
          const mockTok = "FQ-" + Math.random().toString(16).slice(2, 14).toUpperCase();
          showToast(`Sandbox токен: ${mockTok}`);
        }
      }
    })
  ]));

  const panel = el("div", { class: "panel" });
  const tbl = el("table", {}, [
    el("thead", {}, [el("tr", {}, ["Қызметкер", "Рөлдер", "Мәртебе", "Әрекет"].map((h) => el("th", { text: h })))]),
    el("tbody", {}, state.members.map((m) => {
      const actionCell = el("td");
      if (m.status === "pending") {
        const rolePick = el("select", { class: "pill", style: "margin-right:6px" }, ASSIGNABLE_STAFF_ROLES.map((r) => {
          const opt = el("option", { value: r, text: t(`role_${r}`) });
          if (m.requestedRole === r) opt.selected = true;
          return opt;
        }));
        actionCell.appendChild(rolePick);
        actionCell.appendChild(el("button", {
          class: "btn btn-primary",
          text: "Мақұлдау",
          onClick: async () => {
            const chosenRole = rolePick.value;
            if (state.mode === "cloud" && state.fb) {
              const fn = state.fb.httpsCallable(state.fb.functions, "approveMemberRole");
              await fn({ farmId: state.farm.id, targetUid: m.id, roles: [chosenRole], status: "active" });
            }
            m.status = "active";
            m.roles = [chosenRole];
            await persistLocalSnapshot();
            showToast(`${m.name} (${t(`role_${chosenRole}`)}) мақұлданды`);
            goToPage("staff");
          }
        }));
      } else {
        actionCell.textContent = "—";
      }
      return el("tr", {}, [
        el("td", { text: `${m.name} (${m.email || ""})` }),
        el("td", { text: (m.roles || []).map((r) => t(`role_${r}`)).join(", ") || "Рөлсіз" }),
        el("td", {}, [el("span", { class: m.status === "active" ? "badge badge-green" : "badge badge-amber", text: m.status })]),
        actionCell
      ]);
    }))
  ]);
  panel.appendChild(el("div", { class: "table-wrap" }, [tbl]));
  root.appendChild(panel);
}

// --- PAGE 8: REPORTS & SAFE CSV ---
function renderReportsPage(root) {
  root.appendChild(el("div", { class: "page-head" }, [
    el("div", {}, [el("h2", { text: t("nav_reports") })]),
    el("button", {
      class: "btn btn-primary",
      text: t("exportCsv"),
      onClick: () => {
        const headers = ["ID", "EarTag", "Species", "Breed", "Sex", "WeightKg", "Group", "MeatWithdrawalUntil", "MilkWithdrawalUntil"];
        const rows = state.animals.map((a) => [a.id, a.earTag, a.species, a.breed, a.sex, a.weightKg, a.group, a.withdrawalMeatUntil, a.withdrawalMilkUntil]);
        downloadSafeCsv(`farmer_qaz_livestock_${localDateISO()}.csv`, headers, rows);
        showToast("Қауіпсіз CSV жүктелді");
      }
    })
  ]));
  root.appendChild(el("div", { class: "panel", text: `Жалпы тіркелген мал саны: ${state.animals.length}. Ветеринарлық жазбалар: ${state.vetLogs.length}.` }));
}

// --- CONFLICT RESOLUTION MODAL (Strictly scoped to current uid + farmId) ---
async function openConflictsModal() {
  const list = document.getElementById("conflictList");
  list.innerHTML = "";
  const conflicts = await getScopedConflicts();
  if (!conflicts.length) {
    list.appendChild(el("p", { class: "muted", text: "Қақтығыс жоқ." }));
  }
  for (const c of conflicts) {
    list.appendChild(el("div", { class: "card", style: "margin-bottom:12px" }, [
      el("strong", { text: `${c.collectionName} / ${c.docId}` }),
      el("pre", { style: "font-size:11px;overflow:auto;background:#f5f8f6;padding:8px;border-radius:8px", text: "LOCAL: " + JSON.stringify(c.localData, null, 2) }),
      el("pre", { style: "font-size:11px;overflow:auto;background:#fff8e8;padding:8px;border-radius:8px", text: "SERVER: " + JSON.stringify(c.serverData, null, 2) }),
      el("div", { style: "display:flex;gap:8px" }, [
        el("button", {
          class: "btn btn-primary",
          text: "Жергілікті нұсқаны сақтау",
          onClick: async () => {
            await idbDelete("conflicts", c.id);
            await enqueueOutbox(c.collectionName, c.docId, { ...c.localData, _baseUpdatedAt: null });
            openConflictsModal();
          }
        }),
        el("button", {
          class: "btn btn-secondary",
          text: "Сервер нұсқасын қабылдау",
          onClick: async () => {
            await idbDelete("conflicts", c.id);
            await refreshSyncCounters();
            openConflictsModal();
          }
        })
      ])
    ]));
  }
  openModal("conflictModal");
}

// --- LANGUAGE & GLOBAL EVENTS ---
function applyStaticI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
}

function updateNetworkBadge() {
  const b = document.getElementById("netStatusBadge");
  if (!b) return;
  b.textContent = navigator.onLine ? t("online") : t("offline");
  b.className = navigator.onLine ? "badge badge-green" : "badge badge-amber";
  if (navigator.onLine) flushOutbox();
}

function wireEvents() {
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close-modal")));
  });

  const toggleLang = () => {
    state.lang = state.lang === "kk" ? "ru" : "kk";
    localStorage.setItem("fq_lang", state.lang);
    applyStaticI18n();
    updateNetworkBadge();
    if (!document.getElementById("appShell").classList.contains("hidden")) goToPage(state.page);
  };
  document.getElementById("langBtn").addEventListener("click", toggleLang);
  document.getElementById("authLangBtn").addEventListener("click", toggleLang);

  document.getElementById("mobileMenuBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  document.getElementById("openConfigBtn").addEventListener("click", () => openModal("configModal"));
  document.getElementById("bannerConfigBtn").addEventListener("click", () => openModal("configModal"));
  document.getElementById("saveConfigBtn").addEventListener("click", () => {
    try {
      const parsed = JSON.parse(document.getElementById("firebaseConfigInput").value);
      if (!parsed.apiKey || !parsed.projectId) throw new Error("apiKey және projectId міндетті");
      localStorage.setItem("fq_firebase_config", JSON.stringify(parsed));
      location.reload();
    } catch (err) {
      showToast("JSON қатесі: " + err.message);
    }
  });

  document.getElementById("tabLoginBtn").addEventListener("click", () => {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("registerForm").classList.add("hidden");
  });
  document.getElementById("tabRegBtn").addEventListener("click", () => {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("registerForm").classList.remove("hidden");
  });
  document.getElementById("regMode").addEventListener("change", (e) => {
    const isJoin = e.target.value === "join_farm";
    document.getElementById("createFarmFields").classList.toggle("hidden", isJoin);
    document.getElementById("joinFarmFields").classList.toggle("hidden", !isJoin);
  });

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.fb) { showToast("Алдымен Firebase конфигурациясын қосыңыз немесе Sandbox таңдаңыз"); return; }
    try {
      await state.fb.signInWithEmailAndPassword(state.fb.auth, document.getElementById("loginEmail").value, document.getElementById("loginPass").value);
    } catch (err) { showToast(err.message); }
  });

  document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.fb) { showToast("Алдымен Firebase конфигурациясын қосыңыз"); return; }
    try {
      const cred = await state.fb.createUserWithEmailAndPassword(state.fb.auth, document.getElementById("regEmail").value, document.getElementById("regPass").value);
      const name = document.getElementById("regName").value.trim();
      await state.fb.updateProfile(cred.user, { displayName: name });
      const mode = document.getElementById("regMode").value;
      if (mode === "create_farm") {
        const fn = state.fb.httpsCallable(state.fb.functions, "createFarm");
        await fn({ farmName: document.getElementById("regFarmName").value.trim(), ownerName: name });
      } else {
        const fn = state.fb.httpsCallable(state.fb.functions, "joinFarmWithToken");
        await fn({ token: document.getElementById("regInviteToken").value.trim(), displayName: name });
      }
      await loadCloudUserSession(cred.user);
    } catch (err) { showToast(err.message); }
  });

  document.getElementById("enterSandboxBtn").addEventListener("click", enterSandboxMode);
  document.getElementById("syncNowBtn").addEventListener("click", () => {
    if (state.mode === "cloud") flushOutbox();
    else showToast("Sandbox режимі: деректер IndexedDB-де сақталған");
  });
  document.getElementById("conflictsBtn").addEventListener("click", openConflictsModal);
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    if (state.mode === "cloud" && state.fb) await state.fb.signOut(state.fb.auth);
    resetSessionState();
    showAuthScreen();
  });

  window.addEventListener("online", updateNetworkBadge);
  window.addEventListener("offline", updateNetworkBadge);
}

// --- BOOT ---
// Native Android builds ship the web assets inside the APK; do not register the PWA
// service worker inside the Capacitor WebView. Browser/PWA deployments keep normal SW behavior.
const isNativeCapacitor = Boolean(window.Capacitor?.isNativePlatform?.());
if (!isNativeCapacitor && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
wireEvents();
applyStaticI18n();
updateNetworkBadge();
initFirebaseIfConfigured();
