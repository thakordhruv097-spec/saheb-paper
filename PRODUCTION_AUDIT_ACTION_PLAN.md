# 🛠️ Saheb Paper ERP — Final Changes Checklist (To-Do List)
**Status:** Approved by User for Implementation  
**Target:** Saare changes aaj ek sath implement honge, taaki 1 Oct tak client test kar sake.

---

### 1. 🔐 Database & Security Changes (Supabase SQL)
- [ ] **RLS Lockdown:** Saare 18 tables par Row Level Security lagana.
- [ ] **Direct Delete Block:** Operational tables (Reels, Rolls, Parties, Materials) se permanent `DELETE` permission revoke karna.
- [ ] **Append-Only Logs:** Audit logs aur shift logs ko immutable (append-only) banana taaki koi purana record mita na sake.
- [ ] **Realtime Data Leak Fix:** WebSocket broadcast se `pin` aur `security_answer` hatana — sync me sirf naam, role, aur active module jayega.

---

### 2. 🛡️ Data Safety & Soft Delete (Code Changes)
- [ ] **Soft Delete:** Parties, Vendors aur Raw Materials delete karne par database se remove nahi honge, sirf `active: false` (hide) honge taaki puraane challan/GST bill safe rahein.
- [ ] **Dynamic Module Permission:** Admin ka `customModules` toggle hi final rule rahega — agar koi worker absent ho to Admin jise module dega wahi usme naya data save/edit kar sakega.

---

### 3. 👥 User Login & Session Rules
- [ ] **Windows 10 Login Bug Fix:** `getUsers()` me `(u.displayName || '').toLowerCase()` null-guard lagana taaki kisi bhi Windows 10 PC par login crash na ho.
- [ ] **8-Hour Auto-Lock (Option A):** Agar computer ya phone 8 ghante bina kisi use ke khula rahe, to screen apne aap lock hokar dobara PIN maangegi.

---

### 4. 💾 Dual Backup System
- [ ] **Automatic Nightly Backup:** Roz raat 12:00 AM GitHub Actions cron run hokar saare 18 tables ka encrypted backup save karega.
- [ ] **1-Click "Download Backup" Button:** Admin Masters me ek button jisse Admin jab chahe live fresh backup apne computer ya phone ke **"Downloads" folder** me 1 second me save kar sake.

---

### 5. 🚨 In-App Alerts & Monitoring
- [ ] **Failed PIN Audit Log:** Galat PIN daalne par device info ke sath (`Android` ya `Windows PC`) log record hoga.
- [ ] **Brute-Force Red Alert:** Agar 5 baar se zyada galat PIN dala jaye, to Admin ki screen par turant laal warning alert/badge dikhega.
- [ ] **80% Storage Warning Alert:** Supabase database storage 80% bharne par Admin ko alert dikhega.
- [ ] **Root Error Boundary Screen:** Agar kisi code me dikkat aaye to white screen na aaye, clean *"Kuch gadbad hui — Refresh karein"* screen dikhe.
- [ ] **Crash Monitoring (Sentry):** Crash hone par background me developer ko error line aur device tag chala jaye.
- [ ] **Uptime Ping Bot:** Server 24x7 check bot jo Supabase down hone par developer ko notify kare.

---

### 6. ⚙️ Environment Files
- [ ] **`.env.development`**: Local testing database ke liye.
- [ ] **`.env.production`**: Live factory production database ke liye (`znyvmlwggwckjxxsxiwq.supabase.co`).

---

### 🚫 Jo Changes NAHI Karne Hain (Explicitly Decided)
- **Dashboard:** Bilkul touch nahi hoga — Dashboard pehle se hi Shift A/B output aur Dispatch metrics ke sath complete aur clean hai.
