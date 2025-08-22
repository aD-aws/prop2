# Requirements Document

## Introduction

This document outlines the requirements for a comprehensive web platform that streamlines the process of planning, scoping, and contracting home improvement projects in the UK. The platform connects homeowners with builders through AI-generated Scopes of Work (SoW) that comply with UK building regulations, enabling transparent quoting and contract generation.

## Requirements

### Requirement 1: Comprehensive Project Type Coverage

**User Story:** As a homeowner, I want the platform to support all types of home improvement projects common in the UK, so that I can use the platform regardless of my renovation needs.

#### Acceptance Criteria

1. WHEN homeowners select project types THEN the system SHALL offer the following comprehensive categories:

**Structural Extensions & Conversions:**
- Loft conversions (dormer, hip-to-gable, mansard, velux, roof light)
- Rear extensions (single-storey, double-storey, wrap-around, glass box)
- Side extensions (single-storey, double-storey, infill)
- Basement conversions and excavations (full basement, partial dig-out)
- Garage conversions (to living space, home office, gym, studio)
- Conservatories and orangeries (traditional, modern, lean-to)
- Garden rooms and outbuildings (summer houses, workshops, studios)
- Annexes and granny flats (attached, detached, self-contained)
- Porch additions (enclosed, open, canopy)
- Bay window installations
- Balcony and terrace additions

**Room-Specific Renovations:**
- Kitchen renovations (full refit, partial upgrade, island installation, galley, L-shaped, U-shaped)
- Bathroom renovations (full refit, shower room, en-suite, downstairs WC, wet room, family bathroom)
- Bedroom renovations (master bedroom, children's rooms, guest rooms, nursery)
- Living room renovations (open plan, fireplace installation, built-in storage, snug)
- Dining room renovations (formal, kitchen-diner, breakfast room)
- Home office conversions (study, library, workspace)
- Utility room installations (laundry room, boot room, pantry)
- Hallway and entrance renovations
- Staircase renovations (replacement, refurbishment, spiral stairs)
- Attic room conversions
- Cellar and basement room conversions

**External & Structural Work:**
- Roofing (re-roofing, repairs, flat roof replacement, green roofs, slate, tile, metal)
- Windows and doors (UPVC, timber, aluminium, bi-fold doors, sliding doors, French doors, sash windows)
- Driveways and patios (block paving, resin, tarmac, natural stone, gravel, concrete)
- Garden landscaping and decking (composite, hardwood, raised decking, pergolas)
- Fencing and gates (timber, metal, composite, automated gates)
- External rendering and cladding (K-rend, pebbledash, timber cladding, brick slip)
- Brickwork and stonework (repointing, rebuilding, feature walls)
- Chimneys (installation, removal, repairs, flue lining)
- Guttering and drainage (replacement, repairs, soakaways)
- External staircases and fire escapes

**Systems & Infrastructure:**
- Central heating systems (boiler replacement, radiator upgrades, underfloor heating, heat pumps)
- Electrical rewiring and upgrades (consumer unit, EV charging points, smart home systems)
- Plumbing upgrades (new bathrooms, kitchen plumbing, water pressure, mains water upgrades)
- Insulation (loft, cavity wall, external wall, floor, acoustic insulation)
- Solar panels and renewable energy systems (battery storage, wind turbines)
- Air conditioning and ventilation systems (MVHR, extract fans)
- Security systems (alarms, CCTV, access control)
- Broadband and networking infrastructure
- Gas supply upgrades and connections

**Flooring & Interior Finishes:**
- Hardwood flooring (solid, engineered, parquet, herringbone)
- Laminate and LVT flooring
- Carpet installation (fitted, rugs, stair runners)
- Tiling (ceramic, porcelain, natural stone, mosaic)
- Vinyl and linoleum flooring
- Concrete and resin floors (polished, epoxy)
- Underfloor heating installation
- Skirting and architrave replacement
- Coving and ceiling roses

**Kitchens & Fitted Furniture:**
- Bespoke kitchen design and installation
- Kitchen islands and breakfast bars
- Pantry and larder installations
- Built-in wardrobes and storage
- Fitted bookcases and shelving
- Window seats and storage benches
- Walk-in closets and dressing rooms
- Murphy beds and space-saving furniture
- Home bars and entertainment units

**Bathrooms & Wet Areas:**
- Luxury bathroom suites
- Walk-in showers and steam rooms
- Freestanding and built-in baths
- Heated towel rails and underfloor heating
- Bathroom ventilation systems
- Waterproofing and tanking
- Accessible bathrooms and adaptations
- Cloakrooms and powder rooms
- Spa bathrooms and wellness areas

**Specialist Projects:**
- Swimming pools (indoor, outdoor, natural pools, hot tubs, spas)
- Home cinemas and media rooms (soundproofing, projection, seating)
- Wine cellars and storage solutions (temperature control, racking)
- Accessibility modifications (ramps, stairlifts, wet rooms, door widening)
- Period property restoration (sash windows, lime mortar, traditional materials)
- Listed building renovations (heritage compliance, conservation)
- Soundproofing and acoustic treatments
- Panic rooms and secure storage
- Art studios and creative spaces
- Gyms and fitness rooms
- Saunas and steam rooms
- Greenhouses and potting sheds
- Outdoor kitchens and BBQ areas
- Tree houses and play areas

**Commercial & Mixed-Use:**
- Shop conversions to residential
- Office to residential conversions
- Barn conversions
- Church and chapel conversions
- Pub and restaurant conversions
- Industrial building conversions
- Mixed-use developments

**Maintenance & Repairs:**
- Damp proofing and waterproofing
- Structural repairs (subsidence, settlement)
- Roof repairs and maintenance
- Window and door repairs
- Heating system servicing and repairs
- Electrical fault finding and repairs
- Plumbing repairs and maintenance
- Decorating and painting (interior, exterior)
- Gutter cleaning and repairs
- Pest control treatments

2. WHEN homeowners select "Others" THEN they SHALL be able to describe any project not listed above
3. WHEN AI analyzes "Others" projects THEN it SHALL categorize them into the most appropriate existing category or create a custom project plan
4. WHEN project types are displayed THEN they SHALL be organized in logical categories with clear descriptions and typical cost ranges
5. WHEN homeowners browse project types THEN they SHALL see example images and brief descriptions of each project type

### Requirement 2: Landing Page and Marketing Presentation

**User Story:** As a potential user, I want an attractive and informative landing page that clearly explains the platform benefits and shows social proof, so that I can understand the value and trust the service.

#### Acceptance Criteria

1. WHEN users visit the landing page THEN they SHALL see a clear description of the platform's value proposition
2. WHEN users browse the landing page THEN they SHALL see a "Why Choose Our Platform" section highlighting key benefits
3. WHEN users explore the page THEN they SHALL see popular project types with visual examples
4. WHEN users scroll through the page THEN they SHALL see customer testimonials including:
   - "This platform saved me weeks of research and gave me confidence in my loft conversion project. The AI guidance was incredibly helpful!" - Sarah M., London
   - "As a builder, the professional quote generation tool has transformed how I present proposals to clients. Highly recommended!" - James T., Manchester  
   - "The transparent comparison of quotes helped me save £3,000 on my kitchen extension while finding a fantastic builder." - Michael R., Birmingham
5. WHEN users interact with the landing page THEN they SHALL have clear call-to-action buttons to start their project journey

### Requirement 2: User Authentication and Management

**User Story:** As a homeowner or builder, I want to securely register and authenticate on the platform, so that I can access personalized features and maintain my project data.

#### Acceptance Criteria

1. WHEN a homeowner visits the platform THEN the system SHALL provide registration and login options using AWS Cognito
2. WHEN a homeowner registers THEN the system SHALL collect basic profile information and verify email address
3. WHEN a user logs in THEN the system SHALL authenticate credentials and redirect to appropriate dashboard
4. WHEN a builder attempts to register THEN the system SHALL require a valid one-time use invitation code from a homeowner
5. IF a builder has a valid one-time code THEN the system SHALL collect builder credentials, Companies House information, and complete vetting process
6. WHEN builder registration is submitted THEN the system SHALL initiate vetting process and update builder status accordingly
7. WHEN an existing builder receives an invitation code THEN the system SHALL use the one-time code to add the project to their dashboard and grant ongoing access
8. WHEN a builder uses an invitation code THEN the system SHALL permanently associate that project with the builder's account for future access without requiring the code again
9. WHEN a user session expires THEN the system SHALL redirect to login page with appropriate messaging

### Requirement 3: Property Assessment and Compliance Checking

**User Story:** As a homeowner, I want the platform to automatically check my property's planning status and conservation requirements, so that my project complies with local regulations from the start.

#### Acceptance Criteria

1. WHEN a homeowner enters property details THEN the system SHALL query the relevant Council's website for property information
2. WHEN property data is retrieved THEN the system SHALL check if the property is in a Conservation Area
3. WHEN property data is retrieved THEN the system SHALL check if the property is a Listed Building
4. WHEN conservation or listed status is identified THEN the system SHALL present this information to the user for confirmation
5. IF the user confirms special status THEN the system SHALL apply corresponding regulatory requirements to project planning

### Requirement 4: AI-Driven Project Planning and SoW Generation

**User Story:** As a homeowner with no construction experience, I want AI guidance to help me define my project requirements and generate a detailed Scope of Work, so that I can proceed with confidence.

#### Acceptance Criteria

1. WHEN a homeowner selects a project type THEN the system SHALL invoke the appropriate AI agent(s) and present specialized questionnaires with one question at a time
2. WHEN homeowner clicks "Generate SoW" THEN the system SHALL display a message informing them that detailed SoW and Gantt chart generation will take approximately 30 minutes due to multi-agent coordination and timeline optimization
3. WHEN SoW generation is in progress THEN the "Generate SoW" button SHALL change to "SoW in Generation" and be disabled until completion
4. WHEN project details are collected THEN the AI system SHALL generate a sequential Scope of Work complying with UK building regulations with unambiguous specifications and accompanying Gantt chart visualization
5. WHEN SoW generation is complete THEN the system SHALL notify the homeowner via email, SMS, or WhatsApp that their detailed SoW and Gantt chart are ready for review
6. WHEN SoW is generated THEN the system SHALL list all materials required and classify them as:
   - Materials provided by builder (first fix materials) with AI-generated expected costs
   - Materials provided by homeowner (second fix materials) with AI-generated expected costs
   - Labor costs and labor person-days with detailed specifications
7. WHEN builders access SoW for quotation THEN the system SHALL NOT display any AI-generated costs or labor person-days to maintain unbiased pricing
8. WHEN SoW is presented to homeowners THEN they SHALL see all details including AI-generated cost estimates, interactive Gantt chart, and be able to request modifications
9. WHEN homeowners modify SoW THEN the system SHALL regenerate both the scope document and Gantt chart with updated timelines and dependencies
10. IF project type is "Others" THEN the system SHALL present a text box for project details
11. WHEN "Others" project details are submitted THEN the AI system SHALL analyze the free text to identify required specialized agents and invoke appropriate AI agents for the questionnaire journey

### Requirement 5: Multi-Agent AI Architecture for Specialized Project Handling

**User Story:** As a homeowner, I want specialized AI agents with deep expertise to guide me through each component of my project, so that I receive expert knowledge and make informed decisions about every aspect of my renovation.

#### Acceptance Criteria

1. WHEN a homeowner selects windows replacement THEN the system SHALL invoke the Windows AI Agent with specialized knowledge of glazing, frames, and installation
2. WHEN the Windows AI Agent is active THEN it SHALL ask specific questions about dimensions, double/triple glazing preferences, colors, materials, and energy efficiency requirements
3. WHEN the Windows AI Agent provides options THEN it SHALL include detailed advantages, disadvantages, and expert recommendations explaining why certain choices are better for specific situations
4. WHEN a homeowner selects bedroom renovation THEN the system SHALL invoke the Bedroom AI Agent as the orchestrating agent
5. WHEN the Bedroom AI Agent identifies window work needed THEN it SHALL invoke the Windows AI Agent to gather window specifications and integrate results into the bedroom renovation scope
6. WHEN complex projects involve multiple trades THEN high-level orchestrating agents SHALL coordinate specialized agents including:
   - Windows AI Agent (glazing, frames, installation)
   - Carpets AI Agent (materials, underlay, fitting)
   - Tiling AI Agent (materials, patterns, waterproofing)
   - Wall Paint AI Agent (preparation, materials, finishes)
   - Electrical AI Agent (wiring, fixtures, safety compliance)
   - Plumbing AI Agent (pipes, fixtures, drainage)
7. WHEN multiple AI agents collaborate THEN the system SHALL maintain seamless context sharing and data flow between agents
8. WHEN specialized agents complete their tasks THEN they SHALL return structured data including work dependencies, sequencing requirements, and parallel work possibilities
9. WHEN consolidating multi-agent results THEN the system SHALL invoke a Timeline Optimization Agent to analyze work dependencies and calculate parallel work opportunities asynchronously
10. WHEN Timeline Optimization Agent processes tasks THEN it SHALL identify which work can be done in parallel vs sequentially to minimize total project duration
11. WHEN agent conflicts arise during coordination THEN the system SHALL resolve conflicts using predefined priority rules and industry best practices
12. WHEN generating final timelines THEN the system SHALL present both individual task durations and optimized total project duration with critical path analysis
13. WHEN SoW is finalized THEN the system SHALL generate and display an interactive Gantt chart showing the complete project timeline with all tasks, dependencies, and parallel work phases
14. WHEN homeowners view SoW THEN they SHALL see both the detailed scope document and the visual Gantt chart for easy project timeline understanding
15. WHEN homeowners request modifications to the SoW THEN the system SHALL display the same 30-minute generation message and process updates asynchronously

### Requirement 6: AI Agent Management and Orchestration System

**User Story:** As a platform administrator, I want to manage and orchestrate multiple specialized AI agents, so that the system can handle complex projects with expert knowledge in each domain.

#### Acceptance Criteria

1. WHEN the system initializes THEN it SHALL load and register all specialized AI agents (Windows, Doors, Electrical, Plumbing, Carpets, Tiling, Paint, Bedroom, Kitchen, Bathroom, Builder Review Agents, etc.)
2. WHEN a project requires multiple components THEN the orchestrator SHALL determine which AI agents to invoke based on project scope
3. WHEN AI agents are invoked THEN they SHALL maintain their specialized knowledge base and prompt templates stored in DynamoDB
4. WHEN agents need to collaborate THEN the system SHALL facilitate data exchange and context sharing between agents
5. WHEN agents complete tasks THEN they SHALL return standardized output for integration into the overall SoW
6. WHEN high-level agents coordinate THEN they SHALL manage the sequence and dependencies of specialized agent invocations

### Requirement 7: Builder Invitation and Quote Management

**User Story:** As a homeowner, I want to invite multiple builders to quote on my project and compare their proposals, so that I can make an informed decision.

#### Acceptance Criteria

1. WHEN SoW is finalized THEN the homeowner SHALL be able to generate one-time use invitation codes via QR codes, email, or WhatsApp for trusted builders
2. WHEN a builder receives invitation THEN they SHALL be able to register/login and access the project SoW
3. WHEN a builder submits a quote THEN they SHALL provide:
   - Insurance documentation and relevant reference projects
   - Earliest start date for the project
   - Estimated project timeline/duration in working days
4. WHEN providing references THEN builders SHALL specify which projects homeowners can visit or contact for third-party verification
5. WHEN builder submits timeline information THEN the system SHALL automatically calculate and display the projected project completion date
6. WHEN builder information is processed THEN the system SHALL update and display appropriate builder status (vetting ongoing, AI reviewing quote, approved, etc.)
7. WHEN a builder reviews SoW THEN they SHALL be able to submit quotes and suggest amendments to the scope
8. WHEN multiple quotes are received THEN the system SHALL provide AI-powered comparison and analysis including timeline comparisons
9. WHEN displaying builders to homeowners THEN the system SHALL showcase all verification checks performed (Companies House, insurance, credentials) and project timelines
10. WHEN homeowner reviews quotes THEN the system SHALL provide negotiation techniques, "Questions to ask your builder" checklist, timeline analysis, and red flag alerts for unusual quote or timeline variations
11. WHEN AI detects quote or timeline anomalies THEN the system SHALL generate red flag alerts identifying unusual variations or potential concerns in pricing or project duration

### Requirement 8: Contract Generation and Project Completion

**User Story:** As a homeowner, I want the system to generate a formal contract once I select a builder's quote, so that both parties have clear legal documentation.

#### Acceptance Criteria

1. WHEN a homeowner selects a quote THEN the system SHALL automatically initiate "Meet before contract" process as default
2. WHEN "Meet before contract" is initiated THEN the system SHALL prompt homeowner to meet builder at the property and verify credentials
3. WHEN homeowner confirms meeting satisfaction THEN the system SHALL generate a contract based on the agreed SoW and pricing
4. WHEN contract is generated THEN it SHALL comply with UK building regulations and industry standards with unambiguous terms and specifications
5. WHEN contract is presented THEN both parties SHALL be able to review and digitally sign via DocuSign integration (when enabled by administrator)
6. WHEN contract is signed THEN the system SHALL store all documentation securely in DynamoDB
7. WHEN SoW and contracts are generated THEN they SHALL be stored in DynamoDB linked to the project for long-term access
8. WHEN paid users need documents THEN they SHALL be able to download SoW and contracts in PDF format at any time through the platform
9. WHEN free users attempt to download documents THEN the system SHALL prompt them to upgrade to paid tier for PDF access

### Requirement 9: Homeowner Payment Processing and Tiered Access

**User Story:** As a homeowner, I want flexible payment options that allow me to access basic features for free and upgrade for premium features, so that I can control my investment in the platform.

#### Acceptance Criteria

1. WHEN a free homeowner generates SoW THEN the system SHALL provide basic scope without detailed costs, materials, or labor estimates
2. WHEN a homeowner upgrades to paid tier THEN the system SHALL unlock detailed costing, materials breakdown, labor estimates, and builder invitation features
3. WHEN homeowner payment is processed THEN the system SHALL integrate with Stripe payment provider securely
4. WHEN homeowners enter discount codes THEN the system SHALL apply valid discounts and track usage analytics
5. WHEN running campaigns THEN administrators SHALL be able to create and manage discount codes with usage tracking
6. WHEN a paid homeowner wants additional builders THEN the system SHALL offer lead purchasing options

### Requirement 10: Builder Payment Processing and Dashboard

**User Story:** As a builder, I want a comprehensive dashboard to manage my projects and subscriptions, so that I can track my business performance and access premium features.

#### Acceptance Criteria

1. WHEN a builder logs into their dashboard THEN they SHALL see project status overview including:
   - Projects invited to quote on (accessible without invitation code after initial use)
   - Projects quoted for with status updates
   - Projects won and in progress
   - Projects completed with ratings received
2. WHEN a builder clicks on any project in their dashboard THEN they SHALL access the project details and be able to submit or modify quotes without needing the original invitation code
3. WHEN a builder subscribes to premium services THEN the system SHALL process payments via Stripe and unlock analytics and professional quote generation features
4. WHEN a builder purchases leads THEN the system SHALL process payment and immediately grant access to the specific project
5. WHEN a builder's subscription expires THEN the system SHALL restrict access to premium features while maintaining basic project access
6. WHEN builders view their dashboard THEN they SHALL see financial summary including lead purchases, subscription costs, and project values

### Requirement 11: Builder Lead Management and Sales

**User Story:** As a platform administrator, I want to manage builder databases and sell qualified leads, so that I can generate revenue while connecting homeowners with suitable contractors.

#### Acceptance Criteria

1. WHEN managing builders THEN the system SHALL maintain database organized by postcode and project type
2. WHEN homeowner requests builders THEN the system SHALL offer leads to builders sequentially based on preferences
3. WHEN a builder accepts a lead THEN the system SHALL process payment and provide project access
4. WHEN tracking quotes THEN the system SHALL analyze variance between platform estimates and actual builder quotes
5. WHEN lead is sold THEN the system SHALL notify the homeowner and facilitate introduction

### Requirement 12: Administrative Analytics and Builder Management

**User Story:** As a platform administrator, I want comprehensive analytics on quote variations and builder performance, so that I can optimize the platform and improve accuracy.

#### Acceptance Criteria

1. WHEN builders submit quotes THEN the system SHALL track variance against platform-generated estimates
2. WHEN projects complete THEN the system SHALL record final negotiated prices
3. WHEN analyzing data THEN the system SHALL provide insights on quote accuracy and builder performance
4. WHEN managing builders THEN the system SHALL allow invitation to specific projects based on admin decisions
5. WHEN generating reports THEN the system SHALL provide analytics on platform usage and financial metrics

### Requirement 13: Feedback and Rating System with Builder Prioritization

**User Story:** As a homeowner, I want to provide feedback and ratings on builders, so that future homeowners benefit from my experience and quality builders are prioritized.

#### Acceptance Criteria

1. WHEN a project completes THEN the homeowner SHALL be prompted to rate and review the selected builder
2. WHEN submitting feedback THEN the homeowner SHALL be able to upload photographs of completed work
3. WHEN selling leads THEN the system SHALL prioritize builders based on ratings and feedback scores
4. WHEN a builder is offered a lead THEN they SHALL have 12 hours to accept by making payment
5. IF a builder doesn't accept within 12 hours THEN the system SHALL automatically offer the lead to the next highest-rated builder

### Requirement 14: Terms and Conditions Management

**User Story:** As a homeowner and builder, I want clear terms and conditions that can be customized for each project, so that both parties understand their obligations.

#### Acceptance Criteria

1. WHEN SoW is generated THEN the system SHALL include unambiguous standard Terms & Conditions alongside the detailed scope
2. WHEN builders review projects THEN they SHALL be able to amend proposed T&Cs
3. WHEN builders submit quotes THEN they SHALL be able to propose their own T&Cs as alternatives
4. WHEN homeowners review quotes THEN they SHALL see both SoW and T&C variations clearly
5. WHEN contract is generated THEN it SHALL incorporate the agreed T&Cs from the selected quote

### Requirement 15: Builder Professional Quote Generation Service

**User Story:** As a builder, I want to create professional SoW and quotes for homeowners I've met outside the platform and invite them to view these quotes, so that I can present my services more professionally.

#### Acceptance Criteria

1. WHEN a builder subscribes to the service THEN they SHALL access AI-guided SoW generation tools for their own clients
2. WHEN a builder creates a project for an external client THEN the AI system SHALL provide guidance on scope, pricing, labor costs, and labor person-days with unambiguous specifications
3. WHEN SoW is complete THEN the builder SHALL be able to generate professional quotes and email invitations to specific homeowners
4. WHEN homeowners receive invitations THEN they SHALL be able to view the builder's quote without needing to register on the platform
5. WHEN using builder subscription THEN the system SHALL track usage and bill accordingly
6. WHEN builders use this service THEN they SHALL NOT have access to browse or search for homeowners on the platform

### Requirement 16: Planning Permission Data Mining

**User Story:** As a platform administrator, I want to extract homeowner contact information from council planning permission websites, so that I can conduct targeted marketing campaigns.

#### Acceptance Criteria

1. WHEN scraping council websites THEN the system SHALL extract planning application data including addresses
2. WHEN processing applications THEN the system SHALL identify homeowner or applicant contact information
3. WHEN data is collected THEN the system SHALL store it securely for marketing purposes
4. WHEN conducting marketing THEN the system SHALL comply with GDPR and data protection regulations
5. WHEN contacting prospects THEN the system SHALL provide opt-out mechanisms and respect preferences

### Requirement 17: GenAI Prompt Management System

**User Story:** As a platform administrator, I want all GenAI system prompts stored and versioned in DynamoDB, so that I can easily manage, update, and track changes to AI behavior across the platform.

#### Acceptance Criteria

1. WHEN GenAI prompts are created THEN the system SHALL store them in a dedicated DynamoDB table with version control
2. WHEN prompts are updated THEN the system SHALL maintain version history and change tracking
3. WHEN AI systems execute THEN they SHALL retrieve current prompt versions from DynamoDB
4. WHEN administrators need to modify AI behavior THEN they SHALL be able to update prompts through the management interface
5. WHEN system rollbacks are needed THEN administrators SHALL be able to revert to previous prompt versions

### Requirement 18: Builder Analytics and AI Insights

**User Story:** As a subscribed builder, I want detailed analytics and AI-driven insights about my project wins, so that I can understand my competitive advantages and improve my business strategy.

#### Acceptance Criteria

1. WHEN a subscribed builder accesses analytics THEN the system SHALL show project types they are winning by category
2. WHEN a subscribed builder views geographic data THEN the system SHALL display areas where they are most successful
3. WHEN a subscribed builder requests insights THEN the AI system SHALL analyze their winning patterns and provide explanations
4. WHEN AI generates insights THEN it SHALL identify factors contributing to their success (pricing, response time, proposal quality, ratings)
5. WHEN builders access analytics THEN the system SHALL require active subscription and deny access to non-paying builders
6. WHEN subscription expires THEN the system SHALL restrict access to analytics and insights features

### Requirement 19: AI Builder Review Agent

**User Story:** As a homeowner, I want an experienced AI builder agent to review my SoW for accuracy and completeness, so that I can be confident the scope is realistic and comprehensive before inviting builders to quote.

#### Acceptance Criteria

1. WHEN a SoW is generated THEN the system SHALL invoke an AI Builder Review Agent specialized in the specific project type
2. WHEN the AI Builder Review Agent analyzes the SoW THEN it SHALL apply expert builder knowledge to identify potential issues, omissions, or unrealistic specifications
3. WHEN the review is complete THEN the AI Builder Review Agent SHALL provide feedback on:
   - Missing work items or specifications
   - Unrealistic timelines or sequencing
   - Potential regulatory compliance issues
   - Cost estimate accuracy concerns
   - Material specification improvements
4. WHEN the AI Builder Review Agent identifies issues THEN it SHALL provide specific recommendations for improvements
5. WHEN homeowners receive review feedback THEN they SHALL be able to accept suggestions and regenerate the SoW
6. WHEN builders access reviewed SoW THEN they SHALL see a quality indicator showing the document has been professionally reviewed

### Requirement 20: SoW Version Control and Collaborative Editing

**User Story:** As a homeowner and builder, I want version control for the Statement of Work that allows both parties to propose edits and track changes, so that we can collaborate on refining the project scope while maintaining a clear audit trail.

#### Acceptance Criteria

1. WHEN a SoW is finalized THEN the system SHALL create version 1.0 and enable version control tracking
2. WHEN homeowners want to modify the SoW THEN they SHALL be able to create a new version with tracked changes
3. WHEN builders review the SoW THEN they SHALL be able to propose amendments and create alternative versions
4. WHEN either party makes changes THEN the system SHALL:
   - Create a new version number (e.g., 1.1, 1.2, 2.0 for major changes)
   - Track all modifications with timestamps and user attribution
   - Highlight changes using track changes functionality similar to document editors
   - Maintain complete version history
5. WHEN changes are proposed THEN the other party SHALL receive notifications via email, SMS, or in-platform alerts
6. WHEN reviewing proposed changes THEN users SHALL be able to:
   - Accept individual changes
   - Reject individual changes with comments
   - Accept all changes to create a new agreed version
   - Add comments and suggestions to specific sections
7. WHEN multiple versions exist THEN the system SHALL clearly indicate:
   - Current agreed version (signed off by both parties)
   - Pending versions awaiting approval
   - Draft versions being worked on
   - Version comparison tools showing differences between any two versions
8. WHEN a new version is agreed upon THEN both parties SHALL digitally approve the version before it becomes the active SoW
9. WHEN contracts are generated THEN they SHALL reference the specific agreed SoW version number
10. WHEN accessing version history THEN users SHALL be able to:
    - View all previous versions with change summaries
    - Download any version as PDF
    - See who made what changes and when
    - Revert to previous versions if needed (with other party's agreement)
11. WHEN builders submit quotes THEN they SHALL specify which SoW version their quote is based on
12. WHEN SoW versions change after quotes are submitted THEN the system SHALL notify builders and allow quote updates
13. WHEN major changes occur (scope additions/removals) THEN the system SHALL require re-approval from both parties and may invalidate existing quotes work items or materials
   - Unrealistic timelines or specifications
   - Potential regulatory compliance issues
   - Industry best practice recommendations
4. WHEN issues are identified THEN the AI Builder Review Agent SHALL suggest specific improvements to the SoW
5. WHEN the review is satisfactory THEN the AI Builder Review Agent SHALL validate the SoW as ready for builder quotations
6. WHEN homeowners receive the review THEN they SHALL be able to accept suggestions and regenerate the SoW with improvements

### Requirement 20: Platform Legal Framework and Disclaimers

**User Story:** As a platform operator, I want clear legal terms and disclaimers that protect the platform while informing users of their responsibilities, so that liability is properly managed.

#### Acceptance Criteria

1. WHEN users access the platform THEN they SHALL see Terms & Conditions including:
   - "Platform provides document preparation and introduction services only"
   - "Homeowners must independently verify all builder credentials"
   - "Cost estimates are AI-generated approximations for comparison purposes"
   - "Platform is not a party to any resulting contract"
   - "Users should seek independent legal/construction advice"
2. WHEN users view platform messaging THEN they SHALL see "Remove information asymmetry - Homeowners don't know what they don't know - we are solving that specific pain point"
3. WHEN legal terms are updated THEN all users SHALL be notified and required to accept new terms
4. WHEN disputes arise THEN the platform SHALL refer to terms clarifying its role as facilitator only
5. WHEN users engage services THEN they SHALL acknowledge understanding of platform limitations and responsibilities

### Requirement 21: Administrative Control Panel

**User Story:** As a platform administrator, I want comprehensive control over all platform features and integrations, so that I can manage system behavior and enable/disable features as needed.

#### Acceptance Criteria

1. WHEN administrators access the control panel THEN they SHALL be able to toggle all AI features on and off individually
2. WHEN administrators manage integrations THEN they SHALL be able to enable/disable DocuSign integration with toggle controls
3. WHEN administrators configure payments THEN they SHALL manage Stripe integration settings and payment flows
4. WHEN administrators create campaigns THEN they SHALL be able to generate, manage, and track discount codes with detailed analytics
5. WHEN administrators monitor the system THEN they SHALL see real-time status of all AI agents and system components
6. WHEN administrators manage materials purchasing THEN they SHALL be able to enable/disable the feature and configure supplier integrations
7. WHEN feature toggles are changed THEN the system SHALL immediately reflect the changes without requiring system restart

### Requirement 22: Materials Purchasing Integration

**User Story:** As a homeowner, I want to purchase materials directly through the platform from major suppliers, so that I can conveniently source all required materials with competitive pricing.

#### Acceptance Criteria

1. WHEN SoW includes homeowner-provided materials THEN the system SHALL display materials with potential supplier integration options (disabled by default)
2. WHEN materials purchasing is enabled THEN the system SHALL integrate with major UK suppliers (B&Q, Wickes, Selco, Magnet, etc.)
3. WHEN homeowners view material lists THEN they SHALL see supplier options, pricing, and availability (when feature is enabled)
4. WHEN homeowners select materials THEN they SHALL be able to purchase with single-click ordering through integrated suppliers
5. WHEN administrators manage the feature THEN they SHALL be able to enable/disable materials purchasing and manage supplier integrations
6. WHEN materials are purchased THEN the system SHALL track orders and update project status accordingly
7. WHEN feature is disabled THEN homeowners SHALL see material specifications without purchasing options

### Requirement 23: Communication and Notification System

**User Story:** As a platform user, I want to receive timely notifications about project updates and communications, so that I stay informed throughout the process.

#### Acceptance Criteria

1. WHEN project milestones are reached THEN the system SHALL send notifications via email, SMS, or WhatsApp to relevant parties
2. WHEN urgent updates occur THEN the system SHALL send notifications through user's preferred communication channel
3. WHEN builders respond to invitations THEN the homeowner SHALL receive immediate notifications via their chosen method
4. WHEN quotes are submitted THEN the system SHALL notify homeowners via email, SMS, or WhatsApp as configured
5. WHEN system requires user action THEN notifications SHALL include clear next steps and deadlines across all communication channels