# 🫀 HEART: Homecare & Emergency AI Routing Technology

**Care Decision Engine** | **National Hackathon: Project 2030: MyAI Future Track 3 (Vital Signs)**

## Current Features

- **Multilingual AI Responses** - Clinical reasoning in English and Bahasa Malaysia
- **WhatsApp Integration** - Family emergency contact alerts with action-specific messaging
- **Action Plans** - Specific recommendations in 2 languages for families and caregivers
- **Clinical Prognosis** - Estimated outcomes with intervention predictions
- **Role-Based Portals** - Distinct interfaces for Users, Doctors, Hospitals, Field Units, and Operators

---

## 🎯 Your Differentiator

Instead of:
- ❌ Tracking raw data
- ❌ Detecting sudden emergencies only
- ❌ English-only system (not accessible to Malaysian families)

You deliver:
- ✅ **Trend Analysis**: Walking less for 5 days signals risk
- ✅ **Multi-factor Risk**: Combines mobility, heart rate, responsiveness
- ✅ **Autonomous Decisions**: MONITOR → FAMILY_CHECK → CLINIC_VISIT → CALL_999
- ✅ **No Response = Signal**: Unresponsive + immobile = CALL_999 (no AI needed)
- ✅ **Caregiver Intelligence**: Risk trajectories, actionable insights, not raw metrics
- ✅ **Multilingual by Default**: 2 languages for Malaysian healthcare ecosystem
- ✅ **WhatsApp Integration**: Direct family notification without app downloads

## 🏗️ Architecture

```
Hardware Data (SmartWatch)
        ↓
[Snapshot Data] → Gatekeeper (Deterministic Safety Check)
        ↓
   [Analytics Engine] (Trend detection + anomaly detection)
        ↓
   [Decision Flows] (Agentic orchestration with Gemini)
        ↓
   [RAG System] (Ground in medical guidelines)
        ↓
   [Decision] (riskScore + action + reasoning)
        ↓
   [Dashboard Service] (Transform to caregiver insights)
        ↓
   [Caregiver] (Traffic light status + recommendations)
```

## 📁 Project Structure

```
src/
├── ai/                     # Backend Logic & AI Engine (Express)
│   ├── analytics.ts        # Trend detection and risk aggregation
│   ├── decision-flows.ts   # Decision workflows (Vertex AI + RAG prompt orchestration)
│   ├── rag-system*.ts      # RAG orchestrators (Vertex AI Search + Mock fallback)
│   ├── firestore-service.ts# Firestore CRUD (patients, decisions, trends, alerts)
│   ├── server.ts           # Express server + REST endpoints
│   ├── schemas.ts          # Zod validation (input/output contracts)
│   └── types.ts            # Backend-specific types
├── components/             # Frontend React components 
│   ├── ChatWidget.tsx
│   ├── Layout.tsx
│   └── LoginGate.tsx
├── services/               # API clients for frontend to connect to AI engine
│   └── api.ts
├── views/                  # React Router views for different roles
│   ├── DoctorView.tsx
│   ├── FieldUnitView.tsx
│   ├── HospitalView.tsx
│   ├── OperatorView.tsx
│   ├── RoleLanding.tsx
│   └── UserView.tsx
├── App.tsx                 # React main app component
├── types.ts                # Shared types for frontend interfaces
└── mock-data.ts            # Demo scenarios and mock states

package.json                # Dependencies for Vite & Express
vite.config.ts              # Vite frontend configuration
```

## 🚀 Quick Start

### 1. Local Development Setup

```bash
# Install dependencies
npm install

# Configure environment by editing .env with your GCP details:
# GCP_PROJECT_ID=your-project-id
# GCP_REGION=us-central1
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json

# You must have key.json for your Google service account in the root folder.
```

### 2. Run (Development)

The project runs both a React frontend and an Express backend.

#### Option A: One-Click (Windows)
Double-click the `run_heart.bat` file in the root directory. This will automatically open two command prompts for you:
1. One for the AI Backend Server (Port 3000)
2. One for the Frontend Website (Port 5175)

#### Option B: Manual
```bash
# Terminal 1: Start Backend Server
npm run server:dev

# Terminal 2: Start Frontend
npm run dev
```

Frontend: `http://localhost:5175`
Backend: `http://localhost:3000`

### 3. Test API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/health

# View demo scenarios
curl http://localhost:3000/api/demo/scenarios

# Test multilingual snapshot
curl -X POST http://localhost:3000/api/care-decision/snapshot \
  -H "Content-Type: application/json" \
  -d '{"averageHeartRate": 72, "dailySteps": 5000, "daysSinceLastCheckin": 0}'

# Test dashboard with WhatsApp links
curl http://localhost:3000/api/dashboard/patients
```

## 🧠 How It Works

### Multilingual Architecture

All AI responses include **2 languages**:

1. **English (en)**: Clinical terminology for healthcare providers
   - Example: "tachycardia with reduced mobility"
   
2. **Bahasa Malaysia (ms)**: Layperson-friendly for elderly families
   - Example: "Degupan jantung yang luar biasa laju dengan kesukaran bergerak"
   - Avoids medical jargon, uses empathetic tone

**Implementation**: Each patient profile has `preferredLanguage: 'en' | 'ms'`, used for WhatsApp notifications and dashboard display.

### WhatsApp Integration 📱

**No official API required** - Uses standard WhatsApp deep-linking:

1. Dashboard generates `whatsappDeepLinks` for each emergency contact
2. Family clicks link → WhatsApp opens with pre-filled alert message
3. Message includes:
   - Patient status
   - Clinical observation in patient's preferred language
   - Recommended action steps
   - Action-specific emoji (⚠️ warning, 🚨 emergency)

### 1. **Gatekeeper (Deterministic Safety)**
Before invoking AI:
- If `daysSinceLastCheckin > 1` AND `dailySteps < 50`
- → CALL_999 (immobile + unresponsive = emergency, no hesitation)

### 2. **Analytics Engine** (`src/ai/analytics.ts`)
Computes intelligent metrics:
- **Velocity**: Rate of change in steps/heart rate (decline = risk)
- **Anomaly Detection**: Standard deviation from patient baseline
- **Multi-factor Aggregation**: Weighted combination of risk signals

### 3. **Decision Flows** (`src/ai/decision-flows.ts`)
Three orchestrated workflows:
- **snapshotDecisionFlow**: Simple decision on current data.
- **enhancedDecisionFlow**: Rich decision with historical context.
- **dashboardAggregationFlow**: Transform decisions into caregiver intelligence.

### 4. **RAG System** (`src/ai/rag-system.ts`)
Grounds AI in medical knowledge:
- Retrieves applicable clinical guidelines based on risk profile
- Validates that AI decisions align with evidence

### 5. **System Prompt Engineering**
Gemini receives clinical guidelines + patient history to focus on gradual decline and output valid JSON.

### 6. **Dashboard Service** (`src/ai/dashboard-service.ts`)
Transforms decisions into traffic light statuses with trends and warnings.


## 📊 Example Scenarios (Hackathon Demo)

### Scenario 1: Stable Patient ✅
```json
{
  "averageHeartRate": 74,
  "dailySteps": 8200,
  "daysSinceLastCheckin": 0,
  "last7DaysAverageSteps": 8000
}
```
**Decision**: MONITOR (Risk: 2/10)

### Scenario 2: Gradual Decline ⚠️
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

### Scenario 3: Critical Alert 🚨
```json
{
  "averageHeartRate": 95,
  "dailySteps": 30,
  "daysSinceLastCheckin": 2,
  "checkInResponseRate": 20
}
```
**Decision**: CALL_999 (Risk: 10/10)

## 📈 Next Steps for Hackathon

1. **Connect Real Data Source**
2. **Enhance RAG System**
3. **Add Notification Layer**
4. **Performance Monitoring**
5. **Scale for Production**

## 🏅 Hackathon Positioning

**Problem**: ED overcrowding due to late-stage elderly emergencies.

**Root Cause**: Current monitoring only detects acute spikes, missing gradual decline that precedes emergencies.

**HEART Solution**:
1. Detect gradual decline
2. Output autonomous care decisions
3. Enable proactive clinic intervention before ED admission

---

**Built for Project 2030: MyAI Future Hackathon**
*Detecting gradual decline. Delivering definitive decisions. Preventing avoidable emergencies.*

*Built with Google Antigravity* 🚀

🫀

---
&copy; 2026 HEART Team. All rights reserved.
