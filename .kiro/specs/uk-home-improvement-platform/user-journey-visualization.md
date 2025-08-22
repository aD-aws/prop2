# UK Home Improvement Platform - User Journey Visualization

## Complete End-to-End User Flow

```mermaid
flowchart TD
    A[Landing Page Visit] --> B{User Type?}
    
    B -->|Homeowner| C[Homeowner Registration]
    B -->|Builder with Invite| D[Builder Registration with Code]
    
    C --> E[Property Details Entry]
    E --> F[Council Data Check]
    F --> G[Conservation/Listed Status Confirmation]
    G --> H[Project Type Selection]
    
    H --> I{Project Type?}
    I -->|Windows| J[Windows AI Agent]
    I -->|Bedroom| K[Bedroom AI Agent → Windows AI Agent]
    I -->|Loft Conversion| L[Loft AI Agent → Multiple Agents]
    I -->|Others| M[Text Analysis → Appropriate Agents]
    
    J --> N[AI Questionnaire - One Question at a Time]
    K --> N
    L --> N
    M --> N
    
    N --> O[SoW Generation with Materials Classification]
    O --> P[AI Builder Review Agent]
    P --> Q{Review Passed?}
    Q -->|No| R[Suggest Improvements] --> O
    Q -->|Yes| S[Final SoW v1.0 with Cost Estimates]
    
    S --> T{User Tier?}
    T -->|Free| U[Basic SoW Only]
    T -->|Paid| V[Full SoW + Builder Invitations]
    
    U --> W[Upgrade Prompt]
    W --> X[Payment Processing]
    X --> V
    
    V --> Y[Generate One-Time Invitation Codes]
    Y --> Z[Send Invites via Email/WhatsApp/QR]
    
    Z --> AA[Builder Receives Invite]
    AA --> BB{Existing Builder?}
    BB -->|No| D
    BB -->|Yes| CC[Use Code to Add Project to Dashboard]
    
    D --> DD[Builder Vetting Process]
    DD --> EEE[Project Added to Builder Dashboard]
    CC --> EEE
    
    EEE --> FFF[Builder Returns Later via Dashboard Login]
    FFF --> EE[Builder Reviews SoW - No Costs Shown]
    EEE --> EE
    EE --> FF[Builder Submits Quote + Timeline + References]
    EE --> AAB[Builder Proposes SoW Amendments - Creates v1.1]
    AAB --> BBC[Homeowner Reviews Proposed Changes]
    BBC --> CCD{Accept Changes?}
    CCD -->|Yes| DDE[New Agreed SoW Version Created]
    CCD -->|No| EEF[Reject with Comments] --> AAB
    DDE --> FF
    FF --> GG[AI Quote Analysis & Red Flag Detection]
    
    GG --> HH[Homeowner Quote Comparison Dashboard]
    HH --> II[AI Comparison Analysis + Timeline Analysis]
    II --> JJ[Negotiation Tips & Builder Questions]
    
    JJ --> KK[Homeowner Selects Builder]
    KK --> LL[Meet Before Contract Process]
    LL --> MM[Contract Generation - References Final SoW Version]
    MM --> NN[Digital Signing via DocuSign]
    
    NN --> OO[Project Completion]
    OO --> PP[Feedback & Rating System]
    PP --> QQ[Photo Upload & Review]
    
    %% Builder Dashboard Flow
    EEE --> RR[Builder Dashboard - All Projects]
    FFF --> RR
    RR --> SS[View Projects: Invited/Quoted/Won/Completed]
    SS --> GGG[Click Any Project - No Code Needed]
    GGG --> EE
    SS --> TT[Analytics & AI Insights - Subscription Only]
    
    %% Admin Flow
    UU[Admin Control Panel] --> VV[Manage AI Agents]
    UU --> WW[Lead Management & Sales]
    UU --> XX[Planning Permission Data Mining]
    UU --> YY[Prompt Management in DynamoDB]
    
    %% Builder Professional Service
    ZZ[Builder Professional Service] --> AAA[Create SoW for External Client]
    AAA --> BBB[Generate Professional Quote]
    BBB --> CCC[Email Invitation to Homeowner]
    CCC --> DDD[Homeowner Views Quote - No Registration Required]
    
    style A fill:#e1f5fe
    style S fill:#c8e6c9
    style HH fill:#fff3e0
    style RR fill:#f3e5f5
    style UU fill:#ffebee
```

## Detailed User Stories Flow

### 1. Homeowner Journey - Loft Conversion Example

```mermaid
sequenceDiagram
    participant H as Homeowner
    participant LP as Landing Page
    participant PA as Property Agent
    participant LA as Loft AI Agent
    participant WA as Windows AI Agent
    participant EA as Electrical AI Agent
    participant BR as Builder Review Agent
    participant B as Builder
    participant SYS as System

    H->>LP: Visits platform
    LP->>H: Shows testimonials & benefits
    H->>SYS: Registers account
    H->>PA: Enters property details
    PA->>SYS: Checks council data
    SYS->>H: Confirms conservation status
    H->>LA: Selects "Loft Conversion"
    LA->>H: "What's the loft's current use?"
    H->>LA: "Storage only"
    LA->>WA: Invoke for window requirements
    WA->>H: "Do you want roof windows?"
    H->>WA: "Yes, 2 windows"
    WA->>H: "Double or triple glazing?"
    H->>WA: "Triple - better insulation"
    LA->>EA: Invoke for electrical work
    EA->>H: "How many power outlets needed?"
    H->>EA: "6 outlets plus lighting"
    LA->>SYS: Compile comprehensive SoW
    SYS->>BR: Review generated SoW
    BR->>SYS: "Add structural beam calculations"
    SYS->>H: Present final SoW with costs
    H->>SYS: Upgrades to paid tier
    H->>SYS: Invites 3 builders via WhatsApp
    B->>SYS: Submits quote with 8-week timeline
    SYS->>H: Shows quote comparison with timeline analysis
    H->>SYS: Selects builder
    SYS->>H: Generates contract
```

### 2. Builder Journey - Initial Invitation and SoW Collaboration

```mermaid
sequenceDiagram
    participant B as Builder
    participant SYS as System
    participant H as Homeowner
    participant AI as AI Analysis

    H->>B: Sends WhatsApp invitation with code
    B->>SYS: Uses one-time code to access project
    SYS->>B: Adds project to builder's dashboard permanently
    SYS->>B: Shows SoW v1.0 (no costs visible)
    B->>SYS: "I suggest adding waterproofing section"
    B->>SYS: Creates SoW v1.1 with proposed amendments
    SYS->>H: Notifies of proposed SoW changes
    H->>SYS: Reviews tracked changes in v1.1
    H->>SYS: Accepts waterproofing addition
    SYS->>SYS: Creates agreed SoW v1.1
    SYS->>B: Notifies SoW v1.1 approved
    B->>SYS: Submits quote based on SoW v1.1:
    Note over B,SYS: - Total price: £27,000 (includes waterproofing)<br/>- Start date: March 15<br/>- Duration: 9 weeks<br/>- Insurance docs<br/>- 3 reference projects<br/>- Quote references SoW v1.1
    SYS->>AI: Analyze quote vs platform estimate
    AI->>SYS: "Quote 18% above estimate - reasonable with additions"
    SYS->>H: Notifies new quote received
    H->>SYS: Views comparison dashboard
    SYS->>H: Shows timeline: "Completion by May 17"
    H->>B: Selects this builder
    SYS->>B: Updates dashboard - "Project Won"
```

### 3. Multi-Agent Coordination - Bedroom Renovation with Intelligent Timeline

```mermaid
graph TD
    A[Homeowner: Renovate Bedroom] --> B[Bedroom AI Agent Activated]
    
    B --> C{Analyze Requirements}
    C --> D[Windows AI Agent]
    C --> E[Carpets AI Agent] 
    C --> F[Paint AI Agent]
    C --> G[Electrical AI Agent]
    
    D --> H[Windows: Double glazing, white frames<br/>Cost: £1,200, Labor: 1 day<br/>Dependencies: None - Can start first]
    E --> I[Carpets: Wool blend, underlay<br/>Cost: £800, Labor: 0.5 days<br/>Dependencies: After paint & electrical]
    F --> J[Paint: 2 coats, primer<br/>Cost: £150, Labor: 2 days<br/>Dependencies: After windows & electrical rough-in]
    G --> K[Electrical: 4 outlets, dimmer<br/>Cost: £300, Labor: 1 day<br/>Dependencies: Can run parallel with windows]
    
    H --> L[Timeline Optimization Agent]
    I --> L
    J --> L
    K --> L
    
    L --> M[Optimized Work Schedule:<br/>Day 1: Windows + Electrical rough-in parallel<br/>Day 2-3: Paint work<br/>Day 3.5: Carpet installation<br/>Total Duration: 3.5 days not 4.5 days]
    
    M --> N[Complete Bedroom SoW with Interactive Gantt Chart<br/>Total: £2,450<br/>Optimized Duration: 3.5 days<br/>Materials by builder: £2,100<br/>Materials by homeowner: £350<br/>Critical Path: Windows → Paint → Carpets]
```

#### Timeline Optimization Logic

```mermaid
gantt
    title Bedroom Renovation - Optimized Timeline
    dateFormat X
    axisFormat %d
    
    section Parallel Phase
    Windows Installation    :active, windows, 0, 1d
    Electrical Rough-in     :active, electrical, 0, 1d
    
    section Sequential Phase  
    Paint Work             :paint, after windows electrical, 2d
    
    section Final Phase
    Carpet Installation    :carpet, after paint, 0.5d
    
    section Total Duration
    Project Complete       :milestone, complete, after carpet, 0d
```

### 4. Admin Control Flow

```mermaid
flowchart LR
    A[Admin Login] --> B[Control Panel Dashboard]
    
    B --> C[AI Agent Management]
    C --> C1[Toggle Windows Agent]
    C --> C2[Update Prompts in DynamoDB]
    C --> C3[Monitor Agent Performance]
    
    B --> D[Lead Management]
    D --> D1[View Builder Database by Postcode]
    D --> D2[Sell Leads to Builders]
    D --> D3[Track Quote Variations]
    
    B --> E[Feature Toggles]
    E --> E1[Enable/Disable DocuSign]
    E --> E2[Enable/Disable Materials Purchase]
    E --> E3[Manage Payment Integration]
    
    B --> F[Data Mining]
    F --> F1[Scrape Council Websites]
    F --> F2[Extract Planning Applications]
    F --> F3[Generate Marketing Lists]
    
    B --> G[Analytics Dashboard]
    G --> G1[Platform Usage Metrics]
    G --> G2[Revenue Tracking]
    G --> G3[Builder Performance Analysis]
```

### 5. Payment & Subscription Flows

```mermaid
stateDiagram-v2
    [*] --> FreeHomeowner
    [*] --> BuilderInvite
    
    FreeHomeowner : Free Tier
    FreeHomeowner : - Basic SoW only
    FreeHomeowner : - No costs shown
    FreeHomeowner : - No builder invites
    
    PaidHomeowner : Paid Tier
    PaidHomeowner : - Full SoW with costs
    PaidHomeowner : - Builder invitations
    PaidHomeowner : - PDF downloads
    PaidHomeowner : - Lead purchasing
    
    BuilderBasic : Builder Basic
    BuilderBasic : - Project access
    BuilderBasic : - Quote submission
    BuilderBasic : - Basic dashboard
    
    BuilderPremium : Builder Premium
    BuilderPremium : - Analytics & insights
    BuilderPremium : - Professional quote tool
    BuilderPremium : - Advanced dashboard
    
    FreeHomeowner --> PaidHomeowner : Stripe Payment
    BuilderInvite --> BuilderBasic : Registration Complete
    BuilderBasic --> BuilderPremium : Subscription Payment
    
    PaidHomeowner --> LeadPurchase : Buy Additional Builders
    BuilderPremium --> LeadPurchase : Purchase Leads (12hr window)
```

### 4. SoW Version Control and Collaborative Editing Flow

```mermaid
stateDiagram-v2
    [*] --> SoWv1_0 : AI Generated
    
    SoWv1_0 : SoW Version 1.0
    SoWv1_0 : - Initial AI-generated scope
    SoWv1_0 : - Builder Review Agent approved
    SoWv1_0 : - Ready for builder review
    
    SoWv1_1_Draft : SoW v1.1 (Draft)
    SoWv1_1_Draft : - Builder proposed changes
    SoWv1_1_Draft : - Tracked modifications
    SoWv1_1_Draft : - Awaiting homeowner approval
    
    SoWv1_1_Agreed : SoW v1.1 (Agreed)
    SoWv1_1_Agreed : - Both parties approved
    SoWv1_1_Agreed : - Active version for quotes
    SoWv1_1_Agreed : - Contract ready
    
    SoWv2_0_Draft : SoW v2.0 (Draft)
    SoWv2_0_Draft : - Major scope changes
    SoWv2_0_Draft : - May invalidate existing quotes
    SoWv2_0_Draft : - Requires re-approval
    
    SoWv1_0 --> SoWv1_1_Draft : Builder proposes amendments
    SoWv1_0 --> SoWv2_0_Draft : Homeowner major changes
    
    SoWv1_1_Draft --> SoWv1_1_Agreed : Homeowner accepts
    SoWv1_1_Draft --> SoWv1_0 : Homeowner rejects
    SoWv1_1_Draft --> SoWv1_2_Draft : Builder revises
    
    SoWv1_1_Agreed --> SoWv1_2_Draft : Further amendments
    SoWv1_1_Agreed --> SoWv2_0_Draft : Major changes
    SoWv1_1_Agreed --> ContractGeneration : Final approval
    
    SoWv2_0_Draft --> SoWv2_0_Agreed : Both parties approve
    SoWv2_0_Agreed --> ContractGeneration : Major version agreed
    
    ContractGeneration --> [*] : Project proceeds
```

### 5. Admin Control Flow

```mermaid
flowchart LR
    A[Admin Login] --> B[Control Panel Dashboard]
    
    B --> C[AI Agent Management]
    C --> C1[Toggle Windows Agent]
    C --> C2[Update Prompts in DynamoDB]
    C --> C3[Monitor Agent Performance]
    
    B --> D[Lead Management]
    D --> D1[View Builder Database by Postcode]
    D --> D2[Sell Leads to Builders]
    D --> D3[Track Quote Variations]
    
    B --> E[Feature Toggles]
    E --> E1[Enable/Disable DocuSign]
    E --> E2[Enable/Disable Materials Purchase]
    E --> E3[Manage Payment Integration]
    
    B --> F[Data Mining]
    F --> F1[Scrape Council Websites]
    F --> F2[Extract Planning Applications]
    F --> F3[Generate Marketing Lists]
    
    B --> G[Analytics Dashboard]
    G --> G1[Platform Usage Metrics]
    G --> G2[Revenue Tracking]
    G --> G3[Builder Performance Analysis]
```

### 6. Payment & Subscription Flows

```mermaid
stateDiagram-v2
    [*] --> FreeHomeowner
    [*] --> BuilderInvite
    
    FreeHomeowner : Free Tier
    FreeHomeowner : - Basic SoW only
    FreeHomeowner : - No costs shown
    FreeHomeowner : - No builder invites
    
    PaidHomeowner : Paid Tier
    PaidHomeowner : - Full SoW with costs
    PaidHomeowner : - Builder invitations
    PaidHomeowner : - PDF downloads
    PaidHomeowner : - Lead purchasing
    
    BuilderBasic : Builder Basic
    BuilderBasic : - Project access
    BuilderBasic : - Quote submission
    BuilderBasic : - Basic dashboard
    
    BuilderPremium : Builder Premium
    BuilderPremium : - Analytics & insights
    BuilderPremium : - Professional quote tool
    BuilderPremium : - Advanced dashboard
    
    FreeHomeowner --> PaidHomeowner : Stripe Payment
    BuilderInvite --> BuilderBasic : Registration Complete
    BuilderBasic --> BuilderPremium : Subscription Payment
    
    PaidHomeowner --> LeadPurchase : Buy Additional Builders
    BuilderPremium --> LeadPurchase : Purchase Leads (12hr window)
```

## Key Integration Points

### AI Agent Ecosystem
- **Specialized Agents**: Windows, Carpets, Tiling, Paint, Electrical, Plumbing
- **Orchestrating Agents**: Bedroom, Kitchen, Bathroom, Loft Conversion
- **Review Agents**: Builder Review Agent validates all SoW with quality indicators
- **Analysis Agents**: Quote comparison, timeline analysis, red flag detection

### Data Flow Architecture
- **DynamoDB**: Stores prompts, projects, SoW versions with change tracking, contracts, user data
- **AWS Cognito**: Authentication for homeowners and builders
- **Stripe**: Payment processing for both user types
- **External APIs**: Council websites, WhatsApp, DocuSign
- **AI Services**: AWS Bedrock for all AI agent interactions
- **Version Control**: Complete audit trail of SoW modifications with timestamps and user attribution

### Communication Channels
- **Email**: Formal notifications, invitations, and SoW change notifications
- **WhatsApp**: Quick invitations and updates
- **SMS**: Urgent notifications and SoW approval alerts
- **In-Platform**: Dashboard notifications, status updates, and collaborative editing interface

### SoW Collaboration Features
- **Version Control**: Complete tracking of all SoW modifications with version numbers
- **Change Tracking**: Visual highlighting of modifications similar to document editors
- **Collaborative Editing**: Both homeowners and builders can propose amendments
- **Approval Workflow**: Digital approval process for version agreement
- **Audit Trail**: Complete history of who made what changes and when
- **Quote Integration**: Builders specify which SoW version their quotes are based on

This visualization shows how all 20 requirements work together to create a seamless collaborative experience from initial property assessment through project completion and feedback, with robust version control ensuring all parties stay aligned on project scope.