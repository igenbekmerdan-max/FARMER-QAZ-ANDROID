# CHANGELOG — FARMER QAZ v2.1

## P0 (Критикалық түзетулер)
1. **Қызметкер тапсырмасын аяқтау:** `firestore.rules` пен `public/app.js` өрістері үйлестірілді (`status`, `photoProofUrl`, `completedAtMs`, `updatedAtMs`, `_syncStatus`).
2. **Ветеринарлық журнал рөлдері:** Емдеу тіркеу формасы UI-да тек `owner` және `vet` рөлдеріне шектелді; `shepherd` үшін бөлек `emergency_alert` формасы қосылды.
3. **Топтық емдеу (300+ мал):** Серверлік `recordVetTreatment` Cloud Function қосылды. Бүкіл топты Firestore-дан оқып, 400 құжаттық бөліктермен (`WriteBatch`) жаңартады, бұрынғы ұзақ каренцияны қысқартпайды және `verifiedComplete` белгісін жазады.
4. **Офлайн деректерді сақтау:** `mergeServerWithPendingOutbox` функциясы арқылы серверден келген 25 жазба жергілікті `outbox`-тағы синхрондалмаған жазбаларды өшірмей, біріктіреді.

## P1 (Қауіпсіздік және тұрақтылық)
5. **Құрылғы ішіндегі деректерді оқшаулау:** IndexedDB `cache`, `outbox` және `conflicts` жазбалары `(uid, farmId)` бойынша бөлінді; `logout` кезінде `resetSessionState()` шақырылады.
6. **Автоматты қайта синхрондау:** 10 секундтық `startOutboxRetryScheduler()` таймері қосылды.
7. **Тапсырма тағайындау:** `openTaskCreateModal()` арқылы белсенді қызметкерлер тізімінен орындаушыны (`assignedTo`) таңдау қосылды.
8. **AI квотасы және валидация:** `analyzeLivestockAI` функциясына `mode`/`language` whitelist, 12MB лимит және Firestore транзакциясымен тәуліктік квота (шаруашылыққа 50/күн, қолданушыға 20/күн) енгізілді.
9. **RBAC `owner` қорғанысы:** `approveMemberRole` функциясында `owner` рөлін беру бұғатталды; иелікті ауыстыру бөлек `transferOwnership` функциясына шығарылды.
10. **PWA және индекстер:** `sw.js` `v2.1` Network-first + `SKIP_WAITING` режиміне ауыстырылды; `firestore.indexes.json` `createdAtMs` өрісіне сәйкестендірілді.


# FARMER QAZ v2.1.1 — Mobile asset-path hotfix
* `public/index.html`: CSS, JavaScript module және manifest сілтемелері абсолютті `/...` жолдарынан салыстырмалы `./...` жолдарына ауыстырылды.
* `public/manifest.json`: `start_url` салыстырмалы жолға ауыстырылды.
* `public/sw.js`: кэш атауы v2.1.1-ге жаңартылды.
* Маңызды шектеу: Android Chrome `content://` арқылы ашылған HTML-де ES-модульдер мен Service Worker-ді шектеуі мүмкін. Сондықтан бұл түзету CSS жүктелмеу себебін жояды, бірақ толық жұмыс үшін жобаны HTTP(S) веб-серверге/Firebase Hosting-ке жариялау қажет.
