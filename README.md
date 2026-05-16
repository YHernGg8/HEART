# 🫀 HEART: Homecare & Emergency AI Routing Technology

**Autonomous Care Decision Engine for Elderly Homecare Monitoring**  
*Project 2030: MyAI Future Hackathon - Track 3 (Vital Signs)*

---

## 🎯 Executive Summary

**Problem**: ED overcrowding due to late-stage elderly emergencies from missed gradual decline signals.

**Solution**: HEART uses AI-driven trend analysis and autonomous decision flows to:
- Detect gradual decline (not just acute spikes)
- Generate autonomous care decisions (MONITOR → FAMILY_CHECK → CLINIC_VISIT → CALL_999)
- Enable proactive intervention before ED admission
- Support multilingual families (English + Bahasa Malaysia)

**Impact**: Reduces preventable ED admissions through early, data-driven clinical decisions.

---

## 📦 Project Structure

```
HEART/
├── src/
│   ├── ai/                           # Backend AI engine (Express)
│   │   ├── server.ts                 # Express server + REST endpoints
│   │   ├── decision-flows.ts         # Decision orchestration (Vertex AI)
│   │   ├── analytics.ts              # Trend detection & risk aggregation
│   │   ├── rag-system.ts             # RAG controller
│   │   ├── rag-system-vertex.ts      # Cloud Discovery Engine
│   │   ├── rag-system-mock.ts        # Fallback corpus
│   │   ├── retell-service.ts         # Retell AI phone call orchestration
│   │   ├── firestore-service.ts      # Firestore CRUD
│   │   ├── batch-processor.ts        # Batch trend computation
│   │   ├── dashboard-service.ts      # Dashboard aggregation
│   │   ├── schemas.ts                # Zod validation schemas
│   │   ├── types.ts                  # Backend-specific TypeScript types
│   │   └── mock-data.ts              # Demo scenarios
│   ├── components/                   # React components
│   │   ├── ChatWidget.tsx            # AI chat interface
│   │   ├── Layout.tsx                # App layout wrapper
│   │   └── LoginGate.tsx             # Role-based auth gate
│   ├── views/                        # Role-based portals
│   │   ├── UserView.tsx              # Patient/caregiver portal
│   │   ├── DoctorView.tsx            # Primary care physician portal
│   │   ├── HospitalView.tsx          # ED coordinator portal
│   │   ├── FieldUnitView.tsx         # Ambulance crew portal
│   │   ├── OperatorView.tsx          # 999 dispatch portal
│   │   ├── SmartWatchView.tsx        # Wearable UI
│   │   └── RoleLanding.tsx           # Role selection
│   ├── services/
│   │   └── api.ts                    # Frontend API client
│   ├── App.tsx                       # React main component
│   ├── types.ts                      # Shared frontend types
│   ├── main.tsx                      # React entry point
│   └── mock-data.ts                  # Frontend demo data
├── public/                           # Static assets
├── .env.example                      # Environment template
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config
├── vite.config.ts                    # Vite frontend build config
├── eslint.config.js                  # Linting rules
└── README.md                         # This file
```

---

## 🏗️ Technology Stack

### **Frontend (Patient Caregivers & Healthcare Staff)**
- **React 19** - UI component framework
- **TypeScript** - Type-safe development
- **Vite 6** - Lightning-fast build tooling
- **React Router 7** - Multi-role routing (User/Doctor/Hospital/Field Unit/Operator)
- **Tailwind CSS 4** - Utility-first styling
- **Recharts** - Real-time data visualization (heart rate, step trends)
- **Lucide React** - Responsive icon system

**Deployment**: Vite static build → CDN-ready (port 5175 dev)

### **Backend (AI & Clinical Decision Engine)**
- **Express.js** - REST API server
- **TypeScript** - Type-safe server logic
- **Node.js** - JavaScript runtime
- **Google Cloud Vertex AI** - LLM backbone (Gemini 2.5-Flash)
  - Native IAM authentication for Cloud Run
  - Structured JSON output (via system prompts + OutputSchema)
  - Fallback mock responses for graceful degradation
- **Retell AI SDK** - Outbound phone call escalation (Stage 1 & 2)
- **Google Cloud Discovery Engine** - RAG system backbone
- **Firebase Admin SDK** - Firestore database (patient, decision, trend records)
- **Zod** - Runtime schema validation

**Deployment**: Express on Cloud Run (port 3000, scalable containers)

### **Data & Infrastructure**
- **Firestore** - Real-time patient data, decision logs, trend aggregation
  - Collections: `patients`, `decisions`, `trends`, `alerts`, `batches`
  - Document-level access control via Firebase Rules
- **Google Cloud Storage** - Medical guideline documents (RAG corpus)
- **Vertex AI Search** - Semantic retrieval of clinical guidelines
- **BigQuery** (optional) - Analytics & audit trails
- **Service Accounts** - IAM-based auth (no API keys in code)

---

## 🧠 AI & Decision Architecture

### **System Components**

```
SmartWatch Data (HR, Steps, Check-in Response)
        ↓
    [Gatekeeper]
    Deterministic Safety Check:
    if (immobile > 1 day AND no response) → CALL_999 (no AI needed)
        ↓
    [Analytics Engine]
    • Velocity: Rate of change (declining steps = risk)
    • Anomaly: Deviation from patient baseline
    • Multi-factor: Weighted risk aggregation
        ↓
    [Decision Flows] (Vertex AI Gemini)
    1. Snapshot: Fast decision on current data
    2. Enhanced: Rich decision with historical context
    3. Dashboard: Transform decisions → caregiver insights
        ↓
    [RAG System] (Medical Grounding)
    Retrieve applicable clinical guidelines
    Validate AI decisions align with evidence
        ↓
    [Risk Score + Action] (Structured JSON)
    riskScore (1-10) + reasoning (EN/MS) + action
        ↓
    [Escalation Layers]
    1. WhatsApp to family (pre-filled alert message)
    2. Retell AI phone call (Stage 1: initial outreach)
    3. Retell AI phone call (Stage 2: confirmation)
    4. Dispatch 999 emergency services (Stage 3)
        ↓
    [Dashboard Service]
    Traffic light status + trend warnings + WhatsApp links
```

### **Decision Flows** (`src/ai/decision-flows.ts`)

#### **Flow 1: Snapshot Decision (Fast Path)**
```typescript
Input: { averageHeartRate, dailySteps, daysSinceLastCheckin }
Output: { riskScore (1-10), reasoning (EN/MS), action }
```
- Triggered by real-time sensor data
- Uses Gatekeeper deterministic check first
- Falls back to Vertex AI Gemini if needed
- Timeout: <2 seconds (Edge case: mock fallback)

#### **Flow 2: Enhanced Decision (Historical)**
```typescript
Input: {
  ...snapshot,
  last7DaysAverageSteps,
  checkInResponseRate,
  missedCheckinsThisWeek,
  baselineHeartRate,
  medicalHistory
}
Output: { riskScore, reasoning, action, riskFactors, actionPlan, estimatedOutcome }
```
- Used for clinic/doctor review
- Includes trend metrics (velocity, anomaly score)
- RAG-enriched with applicable medical guidelines

#### **Flow 3: Dashboard Aggregation**
```typescript
Input: Enhanced decision + patient history
Output: {
  trafficLightStatus: 'green' | 'yellow' | 'red',
  trendWarnings: [...],
  whatsappLinks: {...},
  roleInsights: { family, fieldUnit, doctor, operator }
}
```
- Transforms clinical data into actionable insights per role
- Family-friendly language (Bahasa Malaysia)
- Field units get protocol recommendations

### **Analytics Engine** (`src/ai/analytics.ts`)

**Computed Risk Factors**:
- `cardiovascularRisk` - Heart rate elevation + baseline deviation
- `mobilityRisk` - Steps decline velocity + anomaly
- `engagementRisk` - Check-in response rate + missed interactions
- `socialRisk` - Contextual factors (age, baseline health)
- `combinedRiskScore` - Weighted aggregation → riskScore (1-10)

**Trend Detection**:
- 7-day rolling average (smooths daily noise)
- Velocity detection (>2σ drop = alarm)
- Baseline calibration per patient (age, gender, medical history)

### **RAG System** (`src/ai/rag-system*.ts`)

**Two Implementations**:
1. **`rag-system-vertex.ts`** - Google Cloud Discovery Engine (production)
   - Semantic search of medical guidelines
   - Vector embeddings for relevance ranking
   - Latency: ~500ms (cached retrieval)

2. **`rag-system-mock.ts`** - Fallback mock corpus
   - Pre-loaded clinical guidelines
   - Keyword-based retrieval
   - Zero-latency (for rate-limit resilience)

**Guideline Categories**:
- Cardiovascular protocols
- Mobility assessment standards
- Engagement thresholds
- Emergency dispatch criteria (NHS/MOH equivalents)

**Integration**:
```typescript
guidelines = retrieveRelevantGuidelines(riskProfile)
enrichedPrompt = buildRAGEnrichedPrompt(userPrompt, guidelines)
decision = vertexAI.generateContent(enrichedPrompt)
validation = validateDecisionAgainstGuidelines(decision, guidelines)
```

---

## 🎭 Role-Based Portal Architecture

### **Role Views** (`src/views/`)

| Role | Portal | Key Features | Audience |
|------|--------|--------------|----------|
| **User/Patient** | `UserView.tsx` | Health summary, family contacts, action history | Elderly patient (caregiver companion) |
| **Doctor** | `DoctorView.tsx` | Patient overview, decision reasoning, clinic visit planner | Primary care physician |
| **Hospital** | `HospitalView.tsx` | ED admission risk dashboard, population health metrics | Hospital admin & ED coordinator |
| **Field Unit** | `FieldUnitView.tsx` | Dispatch alerts, patient protocols, navigation | Ambulance crew, home visit staff |
| **Operator** | `OperatorView.tsx` | Escalation queue, 999 call tracking, system health | Emergency dispatch coordinator |
| **SmartWatch** | `SmartWatchView.tsx` | Real-time vitals, check-in prompts, wearable UI | Patient wearable display |

**Authentication**: Role-based routing via `LoginGate.tsx` (mock JWT in dev, IAM in prod)

---

## 📱 Multilingual System (English + Bahasa Malaysia)

**Every Response is Bilingual**:
```json
{
  "reasoning": {
    "en": "Clinical terminology for healthcare providers",
    "ms": "Layperson-friendly Bahasa Malaysia (no jargon)"
  },
  "whatsappMessage": {
    "en": "Clinical observation",
    "ms": "Family alert in home language"
  }
}
```

**Language Models**:
- **English**: Vertex AI Gemini (native)
- **Bahasa Malaysia**: Fine-tuned via system prompt + RAG guidelines (Malaysian healthcare context)

**Example**:
- EN: "Tachycardia with reduced mobility indicates decompensation."
- MS: "Degupan jantung luar biasa laju dengan kesukaran bergerak menunjukkan kemerosotan kesihatan."

---

## 📲 WhatsApp Integration

**No Official API Required** — Uses Deep-Linking:

1. Dashboard generates WhatsApp deep links for emergency contacts:
   ```
   https://wa.me/60123456789?text=...
   ```

2. Family clicks link → WhatsApp pre-fills alert message:
   ```
   🚨 HEART Alert: [Patient Name]
   Status: [Traffic Light]
   Observation: [Multilingual clinical note]
   Action: [Recommended step]
   ```

3. No app download needed (works on web & mobile)

**Benefits**:
- Ubiquitous (90%+ Malaysia has WhatsApp)
- Instant family notification
- Actionable in-message steps
- Reduces ED wait times via early clinic intervention

---

## 🚨 Escalation Protocol (3-Stage Autonomous)

### **Stage 1: AI Phone Call (Retell AI)**
- **Trigger**: Risk score 6-8, family check recommended
- **Flow**: "Hi [Patient]. This is HEART. Can you hear me? Press 1 to confirm."
- **Outcome**: If responds → Downgrade to MONITOR; If no response → Stage 2

### **Stage 2: AI Phone Call (Retell AI)**
- **Trigger**: Stage 1 no response
- **Flow**: "HEART calling again. Press 1 to confirm you're okay."
- **Outcome**: If responds → CLINIC_VISIT; If no response → Stage 3

### **Stage 3: Emergency Dispatch (999)**
- **Trigger**: Both calls unanswered + risk > 8
- **Flow**: Operator receives alert: "[Patient] immobile 2+ days, unresponsive to AI calls. Dispatch paramedics."
- **Outcome**: CALL_999 (ambulance dispatched)

**System Prompt** (Retell Agent):
```
You are a caring healthcare companion calling elderly patients.
Be respectful, speak clearly, offer to escalate to 999 if needed.
Record all interactions for clinical review.
```

---

## 🌐 Deployment Architecture

### **Development Setup**

```bash
# Install & Setup
npm install
# Create .env file with GCP credentials
# Place key.json in project root

# Terminal 1: Backend
npm run server:dev        # Express on :3000, hot-reload

# Terminal 2: Frontend
npm run dev               # Vite on :5175, HMR enabled
```

### **Production: Google Cloud Run**

#### **Containerization** (`Dockerfile` - recommended)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "server:start"]
```

#### **Deploy Steps**
```bash
# 1. Build & push container to Google Artifact Registry
gcloud builds submit --tag gcr.io/[PROJECT]/heart:latest

# 2. Deploy to Cloud Run (auto-scales, uses Firestore, Vertex AI)
gcloud run deploy heart \
  --image gcr.io/[PROJECT]/heart:latest \
  --platform managed \
  --region asia-southeast1 \
  --set-env-vars GCP_PROJECT_ID=[PROJECT],GCP_REGION=asia-southeast1 \
  --service-account heart-sa@[PROJECT].iam.gserviceaccount.com \
  --allow-unauthenticated

# 3. Frontend: Build & deploy to Cloud Storage + CDN
npm run build
gsutil -m cp -r dist/* gs://[BUCKET]/

# 4. Configure Cloud Armor + Cloud CDN for DDoS/caching
```

#### **IAM Setup**
```bash
# Service Account for Cloud Run
gcloud iam service-accounts create heart-sa

# Grant permissions
gcloud projects add-iam-policy-binding [PROJECT] \
  --member=serviceAccount:heart-sa@[PROJECT].iam.gserviceaccount.com \
  --role=roles/discoveryengine.admin \
  --role=roles/aiplatform.user \
  --role=roles/firestore.admin
```

#### **Environment Variables** (Cloud Run)
```env
GCP_PROJECT_ID=your-project-id
GCP_REGION=asia-southeast1
CHAT_MODEL=gemini-2.5-flash
FIRESTORE_DATABASE=default
RETELL_API_KEY=<from Retell AI dashboard>
```

### **Database Schema** (Firestore)

#### **Collections**
```
patients/
├── patientId
│   ├── name: string
│   ├── age: number
│   ├── phoneNumber: string (E.164 format)
│   ├── preferredLanguage: 'en' | 'ms'
│   ├── baselineHeartRate: number
│   ├── medicalHistory: string[]
│   ├── emergencyContacts: { name, phone, whatsappEnabled }[]
│   └── createdAt: Timestamp

decisions/
├── decisionId (UUID)
│   ├── patientId: string
│   ├── timestamp: Timestamp
│   ├── riskScore: 1-10
│   ├── action: 'MONITOR' | 'FAMILY_CHECK' | 'CLINIC_VISIT' | 'CALL_999'
│   ├── reasoning: { en, ms }
│   ├── riskFactors: { cardiovascularRisk, mobilityRisk, ... }
│   ├── escalationStage: 0 | 1 | 2 | 3
│   └── llmPrompt: string (audit trail)

trends/
├── patientId-week-{YYYY-WW}
│   ├── averageHeartRate: number
│   ├── averageSteps: number
│   ├── responseRatePercent: number
│   ├── anomalyScore: number
│   └── riskTrajector: 'stable' | 'declining' | 'critical'

alerts/
├── alertId
│   ├── patientId: string
│   ├── type: 'PHONE_CALL' | 'WHATSAPP' | 'DISPATCH'
│   ├── status: 'sent' | 'delivered' | 'failed'
│   ├── retellCallId: string (if phone)
│   ├── timestamp: Timestamp
│   └── metadata: {...}
```

#### **Security Rules** (Firestore)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Doctors can read patients & decisions
    match /patients/{patientId} {
      allow read: if request.auth.token.role == 'doctor'
    }
    match /decisions/{decisionId} {
      allow read: if request.auth.token.role in ['doctor', 'hospital']
    }
  }
}
```

---

## 📊 Example Scenarios (Hackathon Demo)

### **Scenario 1: Stable Patient** ✅
```json
{
  "averageHeartRate": 74,
  "dailySteps": 8200,
  "daysSinceLastCheckin": 0,
  "last7DaysAverageSteps": 8000
}
```
**Decision**: MONITOR (Risk: 2/10)  
**Reasoning**: "All vitals within normal range. Continue regular monitoring."  
**Action Plan**: Weekly check-ins, maintain activity level.

### **Scenario 2: Gradual Decline** ⚠️
```json
{
  "averageHeartRate": 82,
  "dailySteps": 2800,
  "daysSinceLastCheckin": 1,
  "last7DaysAverageSteps": 4000,
  "checkInResponseRate": 70,
  "missedCheckinsThisWeek": 2
}
```
**Decision**: CLINIC_VISIT (Risk: 6/10)  
**Reasoning**: "5-day downtrend in steps (-30%). Heart rate elevated. Recommend non-emergency clinic assessment."  
**Action Plan**: Schedule appointment within 48 hours. Increase check-in frequency.

### **Scenario 3: Critical Alert** 🚨
```json
{
  "averageHeartRate": 95,
  "dailySteps": 30,
  "daysSinceLastCheckin": 2,
  "checkInResponseRate": 20
}
```
**Decision**: CALL_999 (Risk: 10/10)  
**Reasoning**: "Critical: Immobile 2+ days. Unresponsive to check-ins. Acute medical crisis."  
**Action Plan**: Dispatch ambulance. Alert emergency department. Family notified via WhatsApp.

---

## 🔄 API Endpoints

### **Care Decision**
```bash
# POST /api/care-decision/snapshot
# Fast decision on current vitals
curl -X POST http://localhost:3000/api/care-decision/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "averageHeartRate": 72,
    "dailySteps": 5000,
    "daysSinceLastCheckin": 0
  }'
```

### **Dashboard**
```bash
# GET /api/dashboard/patients
# Retrieve all patients with traffic light status
curl http://localhost:3000/api/dashboard/patients

# GET /api/dashboard/patients/{patientId}
# Individual patient with trend warnings
curl http://localhost:3000/api/dashboard/patients/patient-123
```

### **System Health**
```bash
# GET /health
# Liveness probe (Cloud Run)
curl http://localhost:3000/health

# GET /api/demo/scenarios
# Fetch hackathon demo scenarios
curl http://localhost:3000/api/demo/scenarios
```

### **Retell AI Integration**
```bash
# POST /api/retell/initiate-call
# Trigger outbound phone call
curl -X POST http://localhost:3000/api/retell/initiate-call \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-123",
    "stage": 1
  }'

# POST /api/retell/webhook
# Receive call status updates (configured in Retell dashboard)
```

---

## 🔐 Security Considerations

### **Authentication & Authorization**
- **Cloud Run**: Service account IAM (no API keys in code)
- **Firestore**: Role-based rules (doctors, hospitals, operators)
- **Retell AI**: API key in `.env` (never in version control)
- **Frontend**: JWT mock in dev, OAuth via Firebase Auth in prod

### **Data Privacy**
- **Patient PII**: Encrypted at rest (Firestore encryption)
- **API Logs**: Anonymized after 30 days (BigQuery retention)
- **Call Transcripts**: HIPAA-compliant retention (Retell compliance)
- **Audit Trail**: All decisions logged with LLM prompt (clinical defense)

### **OWASP Mitigations**
- **Injection**: Zod runtime validation on all inputs
- **XSS**: React JSX auto-escaping; no `dangerouslySetInnerHTML`
- **CSRF**: SameSite cookies; POST requires CSRF tokens
- **SQL**: Firestore (NoSQL) with field-level rules; no SQL injection

---

## 📈 Performance & Monitoring

### **Metrics**
- **AI Decision Latency**: <2 seconds (p95)
- **Gatekeeper Latency**: <100ms (deterministic, no API calls)
- **Firestore Read**: <50ms (indexed queries)
- **Retell Phone Call**: <30 seconds to first ring

### **Monitoring** (Google Cloud Console)
- **Cloud Run**: CPU, memory, error rate dashboards
- **Vertex AI**: Model latency, quota usage, fallback rate
- **Firestore**: Document read/write throughput, index performance
- **Cloud Trace**: Distributed tracing for decision flows

### **Observability**
```typescript
// Example: Instrument decision flow
console.log(`[${timestamp}] Decision: ${patientId} → ${action} (score: ${riskScore})`);
// Auto-exported to Cloud Logging
```

---

## 🚀 Development Workflow

### **Local Setup**
1. Clone repo: `git clone ...`
2. Install: `npm install`
3. Create `.env` with GCP project ID
4. Download `key.json` from GCP Service Account
5. Run: `npm run server:dev` + `npm run dev`

### **Testing**
```bash
# Type checking
npm run build

# Linting
npm run lint

# Manual testing: Use REST endpoints (see API Endpoints section)
```

### **Git & Deployment**
1. Feature branch: `git checkout -b feat/xyz`
2. Commit: `git commit -m "feat: xyz"`
3. Push: `git push origin feat/xyz`
4. PR → Review → Merge to `main`
5. CI/CD auto-deploys to Cloud Run

---

## 🏅 Hackathon Competitive Advantages

1. **Trend Detection** - Detects gradual 5-day decline (not just acute spikes)
2. **Autonomous Decisions** - No human intervention for MONITOR/FAMILY_CHECK
3. **Multilingual** - English + Bahasa Malaysia (accessible to Malaysian families)
4. **Escalation Layers** - WhatsApp + Retell AI phone calls + 999 dispatch
5. **RAG-Grounded AI** - Medical guidelines ensure defensible recommendations
6. **Role-Based Portals** - Distinct UX for families, doctors, hospitals, operators
7. **Fallback Resilience** - Mock RAG if Vertex AI rate-limited (graceful degradation)

---

## 🎓 Clinical References

- **NHS Guidelines**: Cardiovascular risk assessment in elderly populations
- **MOH Malaysia**: Emergency dispatch protocols
- **WHO**: Geriatric care standards and mobility assessment
- **AHA/ACC**: Heart rate variability in homecare settings

---

## 📜 License

© 2026 PulseX Team. All rights reserved.

*Detecting gradual decline. Delivering definitive decisions. Preventing avoidable emergencies.*

🫀
