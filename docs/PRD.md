# Product Requirements Document (PRD)  
## AI PM Assistant – Proof of Concept (PoC)  
*Based on: SEPM - A1 - Project Proposal - Sec2Group2 (2).pdf*

---

## 1. Executive Summary
The early stages of software development often face delays due to manual, inconsistent documentation. PMs, BAs, and founders spend significant time transforming ideas into PRDs, feature lists, and roadmaps. The **AI PM Assistant** aims to automate this process by generating structured documentation from a text brief or uploaded file.  

This PoC demonstrates the ability to generate four core documents—Project Overview, Feature List, User Stories, and Roadmap—within minutes using LLMs.

**Core Deliverables**
- Automated documentation suite  
- Interactive refinement chat interface  
- Functional PoC deployed and validated  

---

## 2. Project Purpose
The product discovery phase is slow, documentation-heavy, and prone to inconsistencies. Using LLMs, the AI PM Assistant automates early-stage planning by converting vague ideas into actionable project plans.  

The deliverable is a functional PoC that ingests user input and outputs structured documentation in **Markdown** and **JSON** formats.

---

## 3. Project Objectives
### **O1 — Documentation Suite Generation**
Automatically generate:
- Project Overview  
- Feature List  
- User Stories  
- High-Level Roadmap  

### **O2 — Interactive Refinement Interface**
A chat interface for iterative modifications to specific sections.

### **O3 — Validated PoC Deployment**
Deployed prototype demonstrating complete idea-to-documentation generation under 5 minutes.

---

## 4. Functional Requirements

| ID | Requirement | Description |
|----|------------|-------------|
| FR1 | Input handling | Accept text entry + PDF/DOCX uploads |
| FR2 | Core generation | Trigger AI model |
| FR3 | Output suite | Generate 4 main documents |
| FR4 | Structured output | Display Markdown; store JSON |
| FR5 | Refinement loop | Chat-based iteration |
| FR6 | Plan modification | Update specific sections |
| FR7 | Export | Download full suite as ZIP |
| FR8 | Authentication | Basic login/logout |

---

## 5. Product Features
1. User Authentication  
2. Project Creation Module  
3. AI Project Charter Generator  
4. AI Project Overview Generator  
5. AI Feature List Generator  
6. AI User Stories Generator  
7. AI Roadmap Generator  
8. Markdown + JSON standard formatting  
9. Interactive Chat Refinement  
10. Section-Level Update Engine  
11. Project History Saving  
12. Export ZIP Function  

---

## 6. Statement of Work

### **Phase 1 — Initiation**
Requirements FR1–FR8 defined. Architecture finalized.

### **Phase 2 — System Design**
Architecture, backend–frontend flow, DB schema, wireframes.

### **Phase 3 — Implementation**
Input handling, AI integration, refinement engine, auth, export.

### **Phase 4 — Testing**
Functional tests, usability tests, formatting tests.

### **Phase 5 — Deployment**
Deploy on Vercel/Render; prepare documentation and presentation.

---

## 7. Resources
### **Team Skills**
React, Node.js/Express, MongoDB, UI/UX, testing, deployment.

### **Technical Stack**
- MERN (MongoDB, Express, React, Node.js)  
- OpenAI GPT API  
- Git, VS Code, Jira  
- Hosting: Vercel + Render  

---

## 8. Work Breakdown Structure (WBS)
Main workstreams:
- Requirements  
- System Design  
- Backend development  
- Frontend development  
- Testing  
- Deployment & Documentation  

---

## 9. Project Schedule
6-week Scrum structure:
- Parallel backend + frontend development  
- Milestones: architecture → prototype → validated PoC → presentation  

---

## 10. Risk Management

**Key Risks**
- Changing requirements  
- Model inaccuracy  
- Data exposure  
- Team communication issues  
- Skill/resource limitations  
- Deployment challenges  
- API outages  

**Mitigation**
- Agile sprints  
- Model fallback logic  
- Encryption + access control  
- Daily standups  
- Skill-based task assignment  
- Frequent deployment  
- Alternative API backups  

---

## 11. Assumptions
- Clear user briefs (200–500 words)  
- AI APIs reliably parse inputs  
- Browsers properly capture text input  
- Refinement conversations retain context  
- Markdown/JSON outputs are stable  

---

## 12. Constraints
- Must implement exactly 12 features  
- 10-week timeline max  
- No custom model training  
- Team of 4 with limited weekly hours  
- Target 70%+ document accuracy  
- Browser compatibility (Chrome/Firefox 100+)  

---

## 13. Roles & Responsibilities

### Backend Developer / Tester — Ho Tuan
AI parsing, model integration, testing.

### Backend Developer / Tester — Le Duc Huy
Backend routes, text processing, export engine.

### Frontend Developer / UI Engineer — Phan Manh Ha
UI/UX, integration, refinement UI, preview/export.

### Project Manager — Tran Hoang Phuc
Scope, timeline, QA, testing, coordination, presentation.

---
