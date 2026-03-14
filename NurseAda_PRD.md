# NurseAda - Product Requirements Document

**AI-Powered 24/7 Virtual Healthcare Assistant for Primary Care Users in Nigeria and Africa**

---

## 1. Problem Statement

| # | Pain Point | Impact |
|---|------------|--------|
| 1 | **Geographical Distance** | Rural/underserved populations lack access to healthcare facilities |
| 2 | **Lack of Health Insurance** | Out-of-pocket costs create barriers to care |
| 3 | **Long-Term Condition Management** | Limited ongoing support for chronic disease patients |
| 4 | **Acute Illness Guidance** | No immediate access to symptom/treatment recommendations |
| 5 | **Vaccination Access** | Difficulty obtaining immunization schedules and guidance |
| 6 | **Health Counselling Gaps** | Limited mental health and lifestyle counseling availability |
| 7 | **Administrative Burden** | Long wait times, complex booking processes |
| 8 | **Provider Shortages** | Insufficient healthcare workforce to meet demand |

---

## 2. Technical Implementation

### 2.1 Robust Guardrails

| Layer | Implementation |
|-------|----------------|
| **Preprocessing** | Input validation, PII detection/removal, medical terminology normalization, toxicity filtering |
| **Postprocessing** | Response validation, confidence scoring, citation enforcement, safe completion generation |
| **RLHF** | Human feedback loops for continuous model improvement, reward modeling for accuracy/safety |
| **Rule-Based Systems** | Hardcoded safety boundaries, emergency escalation protocols, contraindication checks |

### 2.2 Clinical Decision Support System (CDSS)

- Symptom triage and severity assessment
- Drug-drug interaction checking
- Evidence-based treatment pathway recommendations
- Differential diagnosis suggestions with confidence intervals
- Integration with local drug formularies (Nigeria/Africa-specific)

### 2.3 Explainable AI (XAI)

| Method | Application |
|--------|-------------|
| **Model Transparency** | Decision trees, logistic regression for interpretable base predictions |
| **Post-Hoc Explanations** | SHAP values for feature contribution; LIME for individual prediction rationale |
| **Visualization Tools** | saliency maps for radiology imaging; symptom heatmaps for visual diagnosis support |

### 2.4 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend (Mobile)** | React Native (iOS/Android), Flutter |
| **Frontend (Web)** | Next.js, TypeScript, Tailwind CSS |
| **Backend API** | Python (FastAPI), Node.js (Express), GraphQL (Apollo) |
| **LLM Core** | GPT-4 / Claude 3.5 (primary); Fine-tuned Llama 3 / Mistral (on-prem fallback) |
| **ML Pipeline** | PyTorch, TensorFlow, Hugging Face Transformers, LangChain |
| **Vector Database** | Pinecone, Weaviate, Milvus (medical knowledge base) |
| **Database** | PostgreSQL (structured data), MongoDB (conversations), Redis (caching) |
| **Cloud Infrastructure** | AWS (primary), Azure (backup), Vercel ,Google Cloud (optional) |
| **CDN & Storage** | AWS CloudFront, S3, Google Cloud Storage |
| **Healthcare Integrations** | Optional (Phase 2+): HL7 FHIR, OpenEHR, SMART on FHIR for sites that support deep integration |
| **Authentication** | OAuth 2.0, JWT, Firebase Auth |
| **Analytics** | Mixpanel, Amplitude, Datadog |

### 2.4a Independent Primary Care Network Mode

For the initial production phase, NurseAda is designed to run as an **independent virtual primary care network**, without hard dependencies on external hospital/EHR platforms.

- **Minimal stack (default)**  
  - Clients: Web (Next.js), Mobile (React Native/Expo)  
  - Services: API Gateway (NurseAda gateway), Knowledge service, Supabase (PostgreSQL), LLM gateway  
  - Optional: FHIR, external CDSS, XAI, hospital/EHR integrations (see “Optional Integrations” below)

- **Primary care network model**  
  - Clinics are stored in NurseAda’s own database (`clinics` table in Supabase), seeded from curated static content.  
  - Appointment requests reference `clinics.id` and are managed entirely within NurseAda’s stack.  
  - Herbal and natural remedy flows call only the NurseAda knowledge service; there is no dependency on hospital/FMC herbal APIs.

- **External systems as extensions**  
  - HL7 FHIR, external CDSS, radiology PACS, and hospital/FMC APIs are treated as **optional Phase 2+ integrations**, layered on top of the independent core.  
  - The independent mode must remain functional and safe when all external systems are disabled.

### 2.5 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ React Native│  │   Flutter   │  │  Web (Next) │  │  USSD/IVR │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Kong/AWS API Gateway)            │
│  Rate Limiting │ Authentication │ Request Routing │ Load Balancing│
└─────────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│  USER SERVICE │     │ CHATBOT SERVICE │     │ CDSS SERVICE        │
│  - Auth       │     │ - LLM Gateway  │     │ - Diagnosis Engine  │
│  - Profiles   │     │ - Context Mgmt │     │ - Drug Interaction  │
│  - Sessions   │     │ - Guardrails   │     │ - Treatment Paths   │
└───────────────┘     └─────────────────┘     └─────────────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │ Vector DB       │  │ Medical KB      │  │ Herbal/Natural    │   │
│  │ (Pinecone)      │  │ (FHIR/Graph)    │  │ Products DB       │   │
│  └─────────────────┘  └─────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ML/AI SERVICES                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────┐   │
│  │ NLP/Intent      │  │ Radiology AI    │  │ XAI Engine        │   │
│  │ Classification  │  │ (CNN/Vision)    │  │ (SHAP/LIME)       │   │
│  └─────────────────┘  └─────────────────┘  └───────────────────┘   │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │ RLHF Pipeline   │  │ Speech/ASR      │                          │
│  │ (Human Feedback)│  │ (Whisper)       │                          │
│  └─────────────────┘  └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY & COMPLIANCE LAYER                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Encryption  │  │ Audit Logs  │  │ PII Masking │  │ Consent   │  │
│  │ (TLS/AES-256)│  │ (Immutable) │  │ (Presidio)  │  │ Manager   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ EHR Systems │  │ Pharmacies  │  │ Labs        │  │ Emergency │  │
│  │ (HL7 FHIR)  │  │ (API)       │  │ (API)       │  │ Services  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

In **Independent Primary Care Network Mode (default)**, the core architecture is:

- `web + mobile → NurseAda API gateway → (knowledge service + Supabase + LLM gateway)`

FHIR, external CDSS, hospital EHRs, lab systems, and imaging PACS integrate into this base as **optional downstream services**. The system MUST be deployable and clinically usable with only the independent core running.

### 2.6 Infrastructure

| Component | Specification |
|-----------|--------------|
| **Container Orchestration** | Kubernetes (EKS/AKS), Helm charts |
| **Service Mesh** | Istio, Linkerd |
| **CI/CD** | GitHub Actions, ArgoCD |
| **Monitoring** | Prometheus, Grafana, Datadog |
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana) |
| **Message Queue** | Apache Kafka, RabbitMQ |
| **Caching** | Redis Cluster, Memcached |
| **Backup/DR** | AWS Backup, Multi-region failover |
| **Secrets Management** | AWS Secrets Manager, HashiCorp Vault |

---

## 3. Ethical & Legal Implementation

- **HIPAA/GDPR/Nigeria Data Protection Regulation (NDPR) Compliance**
- **Informed Consent** - Transparent AI disclosure before consultations
- **Bias Mitigation** - Training data balancing across African populations, dialects, and demographics
- **Liability Framework** - Clear disclaimers; escalation to human providers for high-risk cases
- **Audit Logging** - Full conversation traceability for regulatory review
- **Cultural Sensitivity** - Local health beliefs integrated without compromising clinical accuracy

---

## 4. Core Features

| Feature | Description |
|---------|-------------|
| **Symptom Analysis** | NLP-driven intake; differential diagnosis generation |
| **Medical Imaging Analysis** | X-ray/CT/MRI interpretation with radiology AI models; heatmap overlays |
| **Herbal & Natural Recommendations** | Evidence-based herbal supplements and traditional remedies with clinical validation (e.g., bitter leaf for malaria prophylaxis, ginger for nausea) |
| **Medication Management** | Dosage reminders, drug interaction alerts, generic alternatives |
| **Appointment Coordination** | Clinic booking, telemedicine triage, referral management |
| **Health Education** | Localized content in English, Pidgin, Hausa, Yoruba, Igbo |
| **Emergency Detection** | Red-flag symptom escalation; ambulance/hotline direct connect |

### 4.1 Independent Deployment Behaviour

- All core features (symptom analysis, medication management, appointment coordination, herbal recommendations, health education, emergency detection) MUST work end-to-end using only:
  - NurseAda gateway and knowledge services
  - Supabase (users, appointments, clinics, reminders)
  - LLM gateway (or rule-based fallbacks)
- When optional integrations (FHIR, external CDSS, XAI, hospital EHRs) are enabled, they enhance assessments and documentation but do not become hard dependencies for basic safe operation.

### 4.2 File Uploads

- **Phase 1 (default, enabled)**  
  - Users can upload **medical images** only:
    - Formats: `jpg`, `jpeg`, `png`, `webp`
    - Examples: photos of X‑rays, CT/MRI/ultrasound images, wound/skin photos, photos of lab reports or prescriptions.
  - Limits:
    - Maximum size per file: **5 MB**
    - Maximum of 3 images per interaction (exact limit to be enforced in client + gateway).
  - Behaviour:
    - Imaging/vision agents may be used to help interpret these images, but NurseAda does **not** replace radiologists or prescribing clinicians.
    - Document photos (e.g. lab reports, prescriptions) are used to extract and summarise key information in plain language; they are not treated as authoritative prescriptions or orders.
  - Retention:
    - Uploaded images are stored only as long as necessary for the active consultation and a limited safety/quality window of **30 days**, under NDPR/HIPAA/GDPR‑compliant policies.
  - Safety:
    - Users are guided **not** to upload non‑medical sensitive items (e.g., national ID cards, bank cards).
    - Any clinical response that relies on uploaded files must include the standard NurseAda medical disclaimer.

- **Phase 2+ (optional, behind feature flag)**  
  - **PDF uploads** are allowed **only** for:
    - Lab reports
    - Clinic/hospital letters and discharge summaries
  - Enabling PDF upload requires:
    - Confirmed secure storage design and PHI handling (encryption, access control, retention, and deletion policies).
    - Updated UX to clearly explain what NurseAda will do with PDFs (summarise, explain, extract key values) and what it will **not** do (issue prescriptions, act as the official record).
    - Guardrail updates in the gateway to enforce file type, size, and content checks.
  - When enabled, PDF uploads follow the same:
    - **5 MB** maximum per file
    - **30‑day** retention policy
    - Standard medical disclaimer requirements as image uploads.
---

## 5. Non-Functional Requirements

- **Availability**: 99.9% uptime; 24/7/365 operation
- **Latency**: second response for <3 standard queries
- **Security**: End-to-end encryption; SOC 2 Type II compliance
- **Localization**: Multi-language support (6+ Nigerian languages + English)
- **Accessibility**: WCAG 2.1 AA compliance; voice-first option for low-literacy users

### 5.1 Deployment Modes

- **Independent Mode (default)**: No external hospital/EHR dependencies; uses NurseAda’s own primary care network and data stores.
- **Integrated Mode (optional)**: Adds FHIR/EHR, external CDSS, and XAI integrations where partner infrastructure allows, without breaking Independent Mode guarantees.
---

## 6. Success Metrics

- **Adoption**: 500K+ active users within 12 months
- **Accuracy**: >90% diagnostic suggestion accuracy (validated against physician review)
- **Safety**: <0.1% adverse event rate from AI recommendations
- **Satisfaction**: NPS score >50
- **Reach**: 50%+ users from rural/underserved areas

---

*Document Version: 1.0 | Classification: Confidential*
