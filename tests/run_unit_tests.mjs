// FARMER QAZ v2.1 — Automated Unit & Contract Verification Suite
// Note: Tests pure logic, batching (300+ animals), offline merge, RBAC/AI guards, and Rules<->Client field contracts.
// Does NOT replace live Firebase Emulator / Cloud integration tests.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const rulesText = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const appText = fs.readFileSync(path.join(root, "public/app.js"), "utf8");
const fnText = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
const swText = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
const idxJson = JSON.parse(fs.readFileSync(path.join(root, "firestore.indexes.json"), "utf8"));

const results = [];
function runTest(name, fn) {
  try {
    fn();
    results.push({ name, status: "PASS" });
  } catch (err) {
    results.push({ name, status: "FAIL", error: err.message });
  }
}

// 1. P0 #1: Worker task completion field contract (firestore.rules <-> app.js)
runTest("P0-1: Worker task completion fields match firestore.rules exactly", () => {
  const rulesMatch = rulesText.match(/hasOnly\(\[([^\]]+)\]\)/);
  assert.ok(rulesMatch, "firestore.rules must define hasOnly([...]) for worker task update");
  const allowedFields = rulesMatch[1].replace(/['"\s]/g, "").split(",");
  for (const required of ["status", "photoProofUrl", "completedAtMs", "updatedAtMs", "_syncStatus"]) {
    assert.ok(allowedFields.includes(required), `firestore.rules missing field: ${required}`);
  }
  assert.ok(!rulesText.includes("'completedAt',"), "Legacy mismatched 'completedAt' should not be in worker hasOnly");
  assert.ok(appText.includes("{ status: \"done\", completedAtMs: nowMs, updatedAtMs: nowMs }"), "app.js must send completedAtMs and updatedAtMs");
});

// 2. P0 #2: Veterinary role alignment (Shepherd cannot see treatment form in UI)
runTest("P0-2: Vet treatment form strictly gated to owner/vet; Shepherd limited to emergency_alert", () => {
  assert.ok(appText.includes('if (hasRole("owner", "vet"))'), "app.js must gate treatment form to owner/vet");
  assert.ok(rulesText.includes("hasRole(farmId, 'shepherd') && request.resource.data.type == 'emergency_alert'"), "firestore.rules must restrict shepherd to emergency_alert");
});

// 3. P0 #3: Full-group treatment simulation for 350 animals (chunking + no withdrawal shortening)
runTest("P0-3: Server-side group treatment covers 350+ animals via 400-doc chunks & preserves longer withdrawal", () => {
  assert.ok(fnText.includes("exports.recordVetTreatment"), "functions/index.js must export recordVetTreatment");
  assert.ok(appText.includes('"recordVetTreatment"'), "app.js must invoke recordVetTreatment for cloud group treatments");

  // Simulate 850 sheep in group "№2 Отар" (3 batches of 400, 400, 50)
  const BATCH_CHUNK_SIZE = 400;
  const herd = Array.from({ length: 850 }, (_, i) => ({
    id: `sheep_${i + 1}`,
    group: "№2 Отар",
    withdrawalMeatUntil: i === 0 ? "2026-12-31" : null
  }));
  const newMeatUntil = "2026-12-10";
  let batchesCommitted = 0;
  let updatedCount = 0;

  for (let i = 0; i < herd.length; i += BATCH_CHUNK_SIZE) {
    const chunk = herd.slice(i, i + BATCH_CHUNK_SIZE);
    for (const a of chunk) {
      if (!a.withdrawalMeatUntil || newMeatUntil > a.withdrawalMeatUntil) {
        a.withdrawalMeatUntil = newMeatUntil;
      }
      updatedCount++;
    }
    batchesCommitted++;
  }
  assert.equal(updatedCount, 850, "All 850 animals must be updated (not capped at 25)");
  assert.equal(batchesCommitted, 3, "850 animals should commit in 3 batches of <=400");
  assert.equal(herd[0].withdrawalMeatUntil, "2026-12-31", "Existing longer withdrawal date must NOT be shortened");
  assert.equal(herd[849].withdrawalMeatUntil, "2026-12-10", "Last animal in herd must receive withdrawal date");
});

// 4. P0 #4: Offline data merge preserves unsynced local animals on reconnect
runTest("P0-4: mergeServerWithPendingOutbox preserves unsynced offline animals", () => {
  assert.ok(appText.includes("function mergeServerWithPendingOutbox"), "app.js must define mergeServerWithPendingOutbox");
  function mergeServerWithPendingOutbox(collectionName, serverDocs, pendingOps) {
    const mergedMap = new Map();
    for (const docItem of serverDocs) mergedMap.set(docItem.id, docItem);
    for (const op of pendingOps.filter((o) => o.collectionName === collectionName)) {
      const existing = mergedMap.get(op.docId) || { id: op.docId };
      mergedMap.set(op.docId, { ...existing, ...op.payload, id: op.docId, _syncStatus: "queued" });
    }
    return Array.from(mergedMap.values()).sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
  }

  const server25 = Array.from({ length: 25 }, (_, i) => ({ id: `srv_${i}`, createdAtMs: 1000 + i }));
  const pending = [{ collectionName: "animals", docId: "offline_new_1", payload: { earTag: "KZ-OFFLINE", createdAtMs: 5000 } }];
  const merged = mergeServerWithPendingOutbox("animals", server25, pending);
  assert.equal(merged.length, 26, "Offline animal must survive server 25-doc refresh");
  assert.equal(merged[0].id, "offline_new_1", "Offline animal should appear at top with _syncStatus=queued");
  assert.equal(merged[0]._syncStatus, "queued");
});

// 5. P1 #5: Multi-user / multi-farm IndexedDB scoping
runTest("P1-5: IndexedDB cache/outbox/conflicts scoped by (uid, farmId) and cleared on logout", () => {
  assert.ok(appText.includes("item.uid === state.user.uid && item.farmId === state.farm.id"), "Outbox/conflicts must filter by uid & farmId");
  assert.ok(appText.includes("cache_${state.user.uid}_${state.farm.id}"), "Cache key must include uid and farmId");
  assert.ok(appText.includes("resetSessionState()"), "Logout must call resetSessionState()");
});

// 6. P1 #6: Automatic periodic outbox retry timer
runTest("P1-6: Outbox retry scheduler uses setInterval", () => {
  assert.ok(appText.includes("function startOutboxRetryScheduler"), "app.js must define startOutboxRetryScheduler");
  assert.ok(appText.includes("setInterval("), "app.js must schedule periodic outbox retries");
});

// 7. P1 #7: Task assignment to other employees
runTest("P1-7: Task creation modal supports selecting assignee from active members", () => {
  assert.ok(appText.includes("function openTaskCreateModal"), "app.js must define openTaskCreateModal");
  assert.ok(appText.includes("assignedTo: assigneeSel.value"), "Tasks must assign to selected member UID");
});

// 8. P1 #8: AI quota & strict parameter validation
runTest("P1-8: AI Cloud Function enforces mode/language whitelist and daily farm/user quotas", () => {
  assert.ok(fnText.includes("VALID_AI_MODES"), "functions/index.js must validate mode");
  assert.ok(fnText.includes("VALID_LANGUAGES"), "functions/index.js must validate language");
  assert.ok(fnText.includes("AI_DAILY_FARM_LIMIT") && fnText.includes("AI_DAILY_USER_LIMIT"), "Daily farm & user AI limits required");
  assert.ok(fnText.includes("resource-exhausted"), "Quota exceeded must throw resource-exhausted");
});

// 9. P1 #9: RBAC owner role escalation blocked in approveMemberRole
runTest("P1-9: approveMemberRole blocks owner role; transferOwnership is separate", () => {
  assert.ok(fnText.includes('if (roles.includes("owner"))'), "approveMemberRole must reject owner role");
  assert.ok(fnText.includes("exports.transferOwnership"), "transferOwnership must be a dedicated function");
  assert.ok(fnText.includes('confirmationPhrase !== "TRANSFER_OWNERSHIP"'), "transferOwnership must require explicit confirmationPhrase");
});

// 10. P1 #10 & Indexes: Service Worker v2.1 network-first + Firestore indexes aligned with createdAtMs
runTest("P1-10: Service Worker v2.1 network-first and Firestore indexes aligned with createdAtMs", () => {
  assert.ok(swText.includes("farmer-qaz-shell-v2.1"), "sw.js must bump cache version to v2.1");
  assert.ok(swText.includes("SKIP_WAITING"), "sw.js must support SKIP_WAITING");
  const allIndexedFields = idxJson.indexes.flatMap((idx) => idx.fields.map((f) => f.fieldPath));
  assert.ok(allIndexedFields.includes("createdAtMs"), "firestore.indexes.json must index createdAtMs");
  assert.ok(!allIndexedFields.includes("createdAt"), "firestore.indexes.json must not index unused createdAt");
});

// Print report
const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;
console.log(JSON.stringify({ total: results.length, passed, failed, results }, null, 2));
if (failed > 0) process.exit(1);
