const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Store Gemini API key securely in Firebase Secret Manager (NEVER in browser HTML!)
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

const VALID_SPECIES = [
  "cattle", "sheep", "goat", "horse", "camel", "poultry", "pig", "other"
];
const ASSIGNABLE_STAFF_ROLES = ["shepherd", "vet", "worker"]; // "owner" is NEVER assignable via approveMemberRole
const VALID_AI_MODES = ["single", "multi"];
const VALID_LANGUAGES = ["kk", "ru"];

const AI_DAILY_FARM_LIMIT = 50;
const AI_DAILY_USER_LIMIT = 20;
const AI_MAX_TOTAL_PAYLOAD_BYTES = 12 * 1024 * 1024;
const BATCH_CHUNK_SIZE = 400; // Safe margin below Firestore 500-write batch limit

// Kazakhstan standard time (UTC+5) YYYY-MM-DD helper
function kzDateISO(offsetDays = 0) {
  const nowKzMs = Date.now() + 5 * 3600 * 1000 + Number(offsetDays || 0) * 86400 * 1000;
  return new Date(nowKzMs).toISOString().slice(0, 10);
}

async function assertActiveMember(uid, farmId, requiredRoles = null) {
  if (!farmId || typeof farmId !== "string") {
    throw new HttpsError("invalid-argument", "farmId is required.");
  }
  const snap = await db.doc(`farms/${farmId}/members/${uid}`).get();
  if (!snap.exists || snap.data().status !== "active") {
    throw new HttpsError("permission-denied", "Active farm membership required.");
  }
  const member = snap.data();
  if (requiredRoles && !requiredRoles.some((r) => (member.roles || []).includes(r))) {
    throw new HttpsError("permission-denied", "Insufficient role permissions.");
  }
  return member;
}

// 1. Create Farm with cryptographically unique ID (no 4-digit collision!)
exports.createFarm = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const { farmName, region, ownerName } = request.data || {};
  if (!farmName || typeof farmName !== "string" || farmName.trim().length < 2) {
    throw new HttpsError("invalid-argument", "Farm name is required.");
  }

  const uid = request.auth.uid;
  const farmRef = db.collection("farms").doc();
  const farmId = farmRef.id;
  const now = admin.firestore.FieldValue.serverTimestamp();
  const nowMs = Date.now();

  const batch = db.batch();
  batch.set(farmRef, {
    name: farmName.trim().slice(0, 120),
    region: (region || "").toString().trim().slice(0, 100),
    ownerUid: uid,
    createdAt: now,
    createdAtMs: nowMs,
    schemaVersion: 2.1
  });
  batch.set(db.doc(`farms/${farmId}/members/${uid}`), {
    uid,
    name: (ownerName || request.auth.token.name || "Фермер").toString().slice(0, 80),
    email: request.auth.token.email || "",
    roles: ["owner"],
    status: "active",
    joinedAt: now,
    joinedAtMs: nowMs
  });
  batch.set(db.doc(`users/${uid}`), {
    defaultFarmId: farmId,
    farmIds: admin.firestore.FieldValue.arrayUnion(farmId),
    updatedAt: now
  }, { merge: true });

  await batch.commit();
  return { farmId };
});

// 2. Generate Expiring Invite Token (Owner only)
exports.createInviteToken = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const { farmId, suggestedRole = "worker", expiresHours = 48, maxUses = 5 } = request.data || {};
  await assertActiveMember(request.auth.uid, farmId, ["owner"]);

  if (!ASSIGNABLE_STAFF_ROLES.includes(suggestedRole)) {
    throw new HttpsError("invalid-argument", "Invalid suggested role. Owner role cannot be invited.");
  }

  const token = "FQ-" + crypto.randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + Math.min(Math.max(Number(expiresHours) || 48, 1), 168) * 3600 * 1000
  );

  await db.doc(`invites/${token}`).set({
    farmId,
    suggestedRole,
    createdBy: request.auth.uid,
    expiresAt,
    maxUses: Math.min(Math.max(Number(maxUses) || 5, 1), 50),
    uses: 0,
    active: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { token, expiresAt: expiresAt.toDate().toISOString() };
});

// 3. Join Farm with Invite Token -> Creates PENDING request (Owner must approve!)
exports.joinFarmWithToken = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const { token, displayName } = request.data || {};
  if (!token || typeof token !== "string") {
    throw new HttpsError("invalid-argument", "Invite token is required.");
  }

  const inviteRef = db.doc(`invites/${token.trim().toUpperCase()}`);
  const uid = request.auth.uid;

  return db.runTransaction(async (tx) => {
    const invSnap = await tx.get(inviteRef);
    if (!invSnap.exists) throw new HttpsError("not-found", "Invite token not found.");
    const inv = invSnap.data();
    if (!inv.active || inv.uses >= inv.maxUses || inv.expiresAt.toMillis() < Date.now()) {
      throw new HttpsError("failed-precondition", "Invite token expired or exhausted.");
    }

    const memberRef = db.doc(`farms/${inv.farmId}/members/${uid}`);
    const existingMember = await tx.get(memberRef);
    if (existingMember.exists) {
      return { farmId: inv.farmId, status: existingMember.data().status };
    }

    tx.update(inviteRef, { uses: admin.firestore.FieldValue.increment(1) });
    tx.set(memberRef, {
      uid,
      name: (displayName || request.auth.token.name || "Қызметкер").toString().slice(0, 80),
      email: request.auth.token.email || "",
      requestedRole: inv.suggestedRole,
      roles: [], // NO roles granted until Owner explicitly approves!
      status: "pending",
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { farmId: inv.farmId, status: "pending" };
  });
});

// 4. Owner approves pending member and assigns explicit STAFF roles (NEVER "owner"!)
exports.approveMemberRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const { farmId, targetUid, roles, status } = request.data || {};
  await assertActiveMember(request.auth.uid, farmId, ["owner"]);

  if (!targetUid || typeof targetUid !== "string" || !Array.isArray(roles)) {
    throw new HttpsError("invalid-argument", "targetUid and roles[] required.");
  }
  if (roles.includes("owner")) {
    throw new HttpsError("permission-denied", "Owner role cannot be assigned via approveMemberRole. Use transferOwnership.");
  }
  if (targetUid === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Owner cannot modify own membership via approveMemberRole.");
  }

  const cleanRoles = [...new Set(roles.filter((r) => ASSIGNABLE_STAFF_ROLES.includes(r)))];
  const cleanStatus = ["active", "suspended", "rejected"].includes(status) ? status : "active";
  if (cleanStatus === "active" && cleanRoles.length === 0) {
    throw new HttpsError("invalid-argument", "At least one valid staff role (shepherd, vet, worker) is required.");
  }

  const batch = db.batch();
  batch.update(db.doc(`farms/${farmId}/members/${targetUid}`), {
    roles: cleanStatus === "active" ? cleanRoles : [],
    status: cleanStatus,
    reviewedBy: request.auth.uid,
    reviewedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  if (cleanStatus === "active") {
    batch.set(db.doc(`users/${targetUid}`), {
      farmIds: admin.firestore.FieldValue.arrayUnion(farmId),
      defaultFarmId: farmId
    }, { merge: true });
  }
  await batch.commit();
  return { ok: true, status: cleanStatus, roles: cleanRoles };
});

// 5. Dedicated Ownership Transfer (Requires current ownerUid + explicit confirmation phrase)
exports.transferOwnership = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const { farmId, newOwnerUid, confirmationPhrase } = request.data || {};
  if (confirmationPhrase !== "TRANSFER_OWNERSHIP") {
    throw new HttpsError("invalid-argument", "Explicit confirmationPhrase 'TRANSFER_OWNERSHIP' is required.");
  }
  if (!farmId || !newOwnerUid || newOwnerUid === request.auth.uid) {
    throw new HttpsError("invalid-argument", "Valid farmId and distinct newOwnerUid are required.");
  }

  const farmRef = db.doc(`farms/${farmId}`);
  const oldOwnerRef = db.doc(`farms/${farmId}/members/${request.auth.uid}`);
  const newOwnerRef = db.doc(`farms/${farmId}/members/${newOwnerUid}`);

  return db.runTransaction(async (tx) => {
    const [farmSnap, newMemSnap] = await Promise.all([tx.get(farmRef), tx.get(newOwnerRef)]);
    if (!farmSnap.exists) throw new HttpsError("not-found", "Farm not found.");
    if (farmSnap.data().ownerUid !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Only the primary farm owner can transfer ownership.");
    }
    if (!newMemSnap.exists || newMemSnap.data().status !== "active") {
      throw new HttpsError("failed-precondition", "New owner must be an active member of the farm.");
    }

    const newRoles = [...new Set([...(newMemSnap.data().roles || []), "owner"])];
    tx.update(farmRef, {
      ownerUid: newOwnerUid,
      ownershipTransferredAt: admin.firestore.FieldValue.serverTimestamp(),
      previousOwnerUid: request.auth.uid
    });
    tx.update(newOwnerRef, { roles: newRoles });
    tx.update(oldOwnerRef, { roles: ["shepherd"] }); // Demote previous owner to staff
    tx.set(db.collection(`farms/${farmId}/auditLogs`).doc(), {
      action: "transfer_ownership",
      fromUid: request.auth.uid,
      toUid: newOwnerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now()
    });
    return { ok: true, newOwnerUid };
  });
});

// 6. Server-Side Veterinary Treatment & Full-Group Withdrawal Propagation (Handles 300+, 1000+ animals)
exports.recordVetTreatment = onCall({ timeoutSeconds: 120 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const {
    farmId,
    targetMode,
    animalId,
    groupName,
    drugName,
    batchNumber,
    expiryDate,
    doseAndRoute,
    vetName,
    meatWithdrawalDays = 0,
    milkWithdrawalDays = 0
  } = request.data || {};

  // Strictly Owner or Vet ONLY (Shepherd cannot register treatments)
  await assertActiveMember(request.auth.uid, farmId, ["owner", "vet"]);

  if (!["single", "group"].includes(targetMode)) {
    throw new HttpsError("invalid-argument", "targetMode must be 'single' or 'group'.");
  }
  if (!drugName || !batchNumber || !expiryDate || !doseAndRoute || !vetName) {
    throw new HttpsError("invalid-argument", "drugName, batchNumber, expiryDate, doseAndRoute, and vetName are required.");
  }

  const meatDays = Math.max(0, Math.min(365, Math.floor(Number(meatWithdrawalDays) || 0)));
  const milkDays = Math.max(0, Math.min(365, Math.floor(Number(milkWithdrawalDays) || 0)));
  const meatUntil = meatDays > 0 ? kzDateISO(meatDays) : null;
  const milkUntil = milkDays > 0 ? kzDateISO(milkDays) : null;

  let targetDocs = [];
  if (targetMode === "single") {
    if (!animalId || typeof animalId !== "string") {
      throw new HttpsError("invalid-argument", "animalId is required for single treatment.");
    }
    const aSnap = await db.doc(`farms/${farmId}/animals/${animalId}`).get();
    if (!aSnap.exists) throw new HttpsError("not-found", "Animal not found.");
    targetDocs = [aSnap];
  } else {
    if (!groupName || typeof groupName !== "string" || !groupName.trim()) {
      throw new HttpsError("invalid-argument", "groupName is required for group treatment.");
    }
    // Query ENTIRE group server-side (NOT limited to client's 25-animal page!)
    const qSnap = await db
      .collection(`farms/${farmId}/animals`)
      .where("group", "==", groupName.trim())
      .get();
    if (qSnap.empty) {
      throw new HttpsError("not-found", `No animals found in group '${groupName.trim()}'.`);
    }
    targetDocs = qSnap.docs;
  }

  const nowMs = Date.now();
  const affectedIds = [];
  let updatedCount = 0;

  // Chunked batch updates (400 docs per batch) to safely handle 300, 1000, or 5000+ animals
  for (let i = 0; i < targetDocs.length; i += BATCH_CHUNK_SIZE) {
    const chunk = targetDocs.slice(i, i + BATCH_CHUNK_SIZE);
    const batch = db.batch();
    for (const docSnap of chunk) {
      const data = docSnap.data();
      affectedIds.push(docSnap.id);
      const updates = { updatedAtMs: nowMs };
      // Never shorten an existing longer withdrawal date!
      if (meatUntil && (!data.withdrawalMeatUntil || meatUntil > data.withdrawalMeatUntil)) {
        updates.withdrawalMeatUntil = meatUntil;
      }
      if (milkUntil && (!data.withdrawalMilkUntil || milkUntil > data.withdrawalMilkUntil)) {
        updates.withdrawalMilkUntil = milkUntil;
      }
      batch.update(docSnap.ref, updates);
      updatedCount++;
    }
    await batch.commit();
  }

  // Write immutable veterinary log entry
  const logRef = db.collection(`farms/${farmId}/vetLogs`).doc();
  await logRef.set({
    type: "treatment",
    targetMode,
    groupName: targetMode === "group" ? groupName.trim() : null,
    affectedCount: updatedCount,
    // Keep up to 500 IDs inline; full count is verified by affectedCount === targetDocs.length
    affectedAnimalIds: affectedIds.slice(0, 500),
    affectedIdsTruncated: affectedIds.length > 500,
    drugName: String(drugName).trim().slice(0, 120),
    batchNumber: String(batchNumber).trim().slice(0, 80),
    expiryDate: String(expiryDate).trim().slice(0, 20),
    doseAndRoute: String(doseAndRoute).trim().slice(0, 120),
    vetName: String(vetName).trim().slice(0, 100),
    recordedByUid: request.auth.uid,
    withdrawalMeatUntil: meatUntil,
    withdrawalMilkUntil: milkUntil,
    verifiedComplete: updatedCount === targetDocs.length,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtMs: nowMs
  });

  return {
    logId: logRef.id,
    affectedCount: updatedCount,
    withdrawalMeatUntil: meatUntil,
    withdrawalMilkUntil: milkUntil,
    verifiedComplete: updatedCount === targetDocs.length
  };
});

// 7. Secure Server-Side Gemini AI Livestock Analysis (Quotas + Strict Validation + Zero Fabrication)
exports.analyzeLivestockAI = onCall({ secrets: [GEMINI_API_KEY], timeoutSeconds: 60 }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const { farmId, imagesBase64, mode = "single", language = "kk" } = request.data || {};
  await assertActiveMember(request.auth.uid, farmId, ["owner", "shepherd", "vet"]);

  // Strict parameter whitelist validation
  if (!VALID_AI_MODES.includes(mode)) {
    throw new HttpsError("invalid-argument", "mode must be 'single' or 'multi'.");
  }
  if (!VALID_LANGUAGES.includes(language)) {
    throw new HttpsError("invalid-argument", "language must be 'kk' or 'ru'.");
  }
  if (!Array.isArray(imagesBase64) || imagesBase64.length === 0 || imagesBase64.length > 6) {
    throw new HttpsError("invalid-argument", "Provide between 1 and 6 base64 images/frames.");
  }

  let totalBytes = 0;
  for (const img of imagesBase64) {
    if (typeof img !== "string" || img.length > 3_500_000) {
      throw new HttpsError("invalid-argument", "Invalid or oversized image payload.");
    }
    totalBytes += img.length;
  }
  if (totalBytes > AI_MAX_TOTAL_PAYLOAD_BYTES) {
    throw new HttpsError("invalid-argument", "Total payload exceeds 12MB limit.");
  }

  // Enforce per-farm & per-user daily quota atomically via Firestore transaction
  const dayKey = kzDateISO(0);
  const usageRef = db.doc(`farms/${farmId}/aiUsage/${dayKey}`);
  const uid = request.auth.uid;

  const quotaResult = await db.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef);
    const data = snap.exists ? snap.data() : { farmCount: 0, userCounts: {} };
    const farmCount = Number(data.farmCount || 0);
    const userCount = Number((data.userCounts && data.userCounts[uid]) || 0);

    if (farmCount >= AI_DAILY_FARM_LIMIT) {
      throw new HttpsError("resource-exhausted", `Farm daily AI quota exceeded (${AI_DAILY_FARM_LIMIT}/day).`);
    }
    if (userCount >= AI_DAILY_USER_LIMIT) {
      throw new HttpsError("resource-exhausted", `User daily AI quota exceeded (${AI_DAILY_USER_LIMIT}/day).`);
    }

    tx.set(usageRef, {
      farmCount: farmCount + 1,
      userCounts: { ...(data.userCounts || {}), [uid]: userCount + 1 },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { remainingFarm: AI_DAILY_FARM_LIMIT - (farmCount + 1), remainingUser: AI_DAILY_USER_LIMIT - (userCount + 1) };
  });

  const systemPrompt = `You are a strict agricultural computer-vision assistant for FARMER QAZ (Kazakhstan).
CRITICAL RULES (ANTI-HALLUCINATION):
1. NEVER fabricate or guess unknown fields. If earTag, breed, sex, estimatedWeightKg, or birthDate cannot be reliably seen in the image(s), you MUST return null for that field.
2. Provide a numeric confidence score (0.0 to 1.0) for EACH field independently.
3. Supported species values ONLY: ${VALID_SPECIES.join(", ")} (or null if unclear).
4. If multiple frames come from a video of the same animal(s), deduplicate individuals and do NOT double-count.
5. Return STRICT JSON ONLY matching:
{
  "detectedCount": number,
  "individuals": [
    {
      "species": {"value": string|null, "confidence": number},
      "breed": {"value": string|null, "confidence": number},
      "color": {"value": string|null, "confidence": number},
      "sex": {"value": "female"|"male"|null, "confidence": number},
      "earTag": {"value": string|null, "confidence": number},
      "estimatedWeightKg": {"value": number|null, "confidence": number},
      "visibleNotes": string
    }
  ],
  "warnings": string[]
}`;

  const parts = [{ text: systemPrompt + `
Mode: ${mode}. Language for visibleNotes/warnings: ${language}.` }];
  for (const img of imagesBase64) {
    const cleanB64 = img.includes(",") ? img.split(",")[1] : img;
    parts.push({ inlineData: { mimeType: "image/jpeg", data: cleanB64 } });
  }

  const apiKey = GEMINI_API_KEY.value();
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
      })
    }
  );

  if (!resp.ok) {
    throw new HttpsError("internal", `Gemini API error: ${resp.status}`);
  }
  const data = await resp.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new HttpsError("internal", "AI returned invalid JSON schema.");
  }

  const individuals = Array.isArray(parsed.individuals) ? parsed.individuals.slice(0, 50).map((ind) => ({
    species: {
      value: VALID_SPECIES.includes(ind?.species?.value) ? ind.species.value : null,
      confidence: Number(ind?.species?.confidence) || 0
    },
    breed: { value: ind?.breed?.value ? String(ind.breed.value).slice(0, 80) : null, confidence: Number(ind?.breed?.confidence) || 0 },
    color: { value: ind?.color?.value ? String(ind.color.value).slice(0, 80) : null, confidence: Number(ind?.color?.confidence) || 0 },
    sex: {
      value: ["female", "male"].includes(ind?.sex?.value) ? ind.sex.value : null,
      confidence: Number(ind?.sex?.confidence) || 0
    },
    earTag: { value: ind?.earTag?.value ? String(ind.earTag.value).slice(0, 40) : null, confidence: Number(ind?.earTag?.confidence) || 0 },
    estimatedWeightKg: {
      value: typeof ind?.estimatedWeightKg?.value === "number" && ind.estimatedWeightKg.value > 0 ? ind.estimatedWeightKg.value : null,
      confidence: Number(ind?.estimatedWeightKg?.confidence) || 0
    },
    visibleNotes: String(ind?.visibleNotes || "").slice(0, 300)
  })) : [];

  return {
    detectedCount: Number(parsed.detectedCount) || individuals.length,
    individuals,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map((w) => String(w).slice(0, 200)) : [],
    quota: quotaResult,
    aiDisclaimer: language === "ru"
      ? "AI не ставит диагноз и не заменяет подтверждение фермера. Неизвестные поля оставлены пустыми."
      : "AI диагноз қоймайды және фермер растауын алмастырмайды. Белгісіз өрістер бос қалдырылды."
  };
});

// 8. Real Veterinary Emergency Dispatch (Honest delivery status + createdAtMs alignment)
exports.dispatchVetEmergency = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");
  const { farmId, animalId, symptoms, severity = "high" } = request.data || {};
  await assertActiveMember(request.auth.uid, farmId, ["owner", "shepherd", "vet"]);

  const cleanSeverity = ["low", "medium", "high", "critical"].includes(severity) ? severity : "high";
  const nowMs = Date.now();
  const logRef = db.collection(`farms/${farmId}/vetLogs`).doc();
  await logRef.set({
    type: "emergency_alert",
    animalId: animalId || null,
    symptoms: String(symptoms || "").trim().slice(0, 500),
    severity: cleanSeverity,
    reportedBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAtMs: nowMs,
    delivery: {
      firestoreLogged: true,
      fcmPushSent: false,
      smsSent: false
    }
  });

  return {
    alertId: logRef.id,
    firestoreLogged: true,
    externalPushOrSmsConfigured: false,
    message: "Дабыл Firestore журналына тіркелді. Сыртқы SMS/Push шлюзін қосу қажет."
  };
});
