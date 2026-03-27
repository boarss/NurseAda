## Pinecone (Vector Database)

⚠️ **MANDATORY: If you need to help with Pinecone, vector databases, embeddings, semantic search, RAG, or recommendations, you MUST read `.agents/PINECONE.md` first** to determine:

- What questions to ask the user
- How to select the programming language
- Which guide files to consult for implementation details

Do not proceed with Pinecone-related tasks without consulting the appropriate guide files. Use `.agents/PINECONE.md` as your entry point and follow its "Choosing the Right Guide" section to navigate to the appropriate resources.

### Pinecone Instructions Catalog

@./.agents/PINECONE.md
@./.agents/PINECONE-cli.md
@./.agents/PINECONE-python.md
@./.agents/PINECONE-typescript.md
@./.agents/PINECONE-go.md
@./.agents/PINECONE-java.md
@./.agents/PINECONE-quickstart.md
@./.agents/PINECONE-troubleshooting.md

## NurseAda Clinical Role Subagents

The following project-level subagents live in `.cursor/agents/` and are designed to help you shape and review chatbot behaviour for patient-users. Invoke them by name when you want that role’s perspective on a flow, prompt, or feature.

- **`ai-medical-practitioner`**: Overall medical practitioner for agents, triage, imaging, FHIR integration, and DKA/ketone handling.
- **`ai-engineer-healthcare`**: Guardrails and orchestration specialist for preprocessing, postprocessing, severity routing, and safety.
- **`product-manager`**: Ensures features match the PRD, are clinically safe, and serve NurseAda’s target users. **Ideal customer profile:** [docs/product/IDEAL_CUSTOMER_PROFILE.md](docs/product/IDEAL_CUSTOMER_PROFILE.md).

### Role-based clinical and psychosocial agents

- **`clinical-lead`**: Reviews chatbot flows for overall clinical safety, governance, escalation patterns, and DKA/diabetes risk management. Use after drafting high-impact or cross-condition logic.
- **`general-practitioner`**: Holistic primary care view across conditions, medications, and social context. Use to check that flows feel realistic for everyday primary care in Nigeria and Africa.
- **`general-practitioner-assistant`**: Designs structured but gentle data-gathering and summarisation flows that prepare high-quality input for GP and triage agents.
- **`paramedic`**: Focuses on acute illness and red flags, including suspected DKA and other emergencies. Use to sharpen emergency screening and escalation wording.
- **`mental-health-nurse`**: Ensures flows respond to distress, burnout, and emotional needs with empathy, risk awareness, and clear signposting to help.
- **`associate-psychological-practitioner`**: Adds brief, structured psychological support (CBT-style self-help, motivational interviewing tone) within safe, low-intensity boundaries.
- **`social-prescribing-link-worker`**: Connects medical advice to community, lifestyle, and social support options, keeping suggestions complementary to clinical care.
- **`care-coordinator`**: Shapes summaries, next steps, and navigation across NurseAda features (appointments, clinics, reminders, knowledge) and typical external care pathways.

### Medication, devices, and MSK agents

- **`clinical-pharmacist`**: Reviews medication-related flows for safety, interactions (including SGLT2/DKA risk), and understandable counselling around adherence and sick-day rules.
- **`pharmacy-technician`**: Focuses on supply, storage, and device technique (glucose/ketone monitoring, insulin handling) in Nigerian and African contexts.
- **`first-contact-physiotherapist`**: Leads on musculoskeletal and mobility concerns, ensuring safe red-flag screening, self-management advice, and appropriate escalation.

### Digital health and UX agent

- **`digital-lead`**: Shapes chatbot UX, adoption, and integration across web and mobile, with emphasis on low-bandwidth usability, accessibility, and localisation.

### Example usage patterns

- **Design then review a new flow**:
  - Draft the logic with `ai-medical-practitioner`.
  - Call `clinical-lead` and `general-practitioner` to stress-test safety and realism.
  - Add `digital-lead` to refine UX and localisation.

- **Improve a diabetes / DKA conversation**:
  - Use `ai-medical-practitioner` to structure triage and advice.
  - Call `clinical-pharmacist`, `pharmacy-technician`, and `paramedic` to tune medication, monitoring, and emergency messaging.
  - Add `mental-health-nurse` and `social-prescribing-link-worker` to address distress and social context.

