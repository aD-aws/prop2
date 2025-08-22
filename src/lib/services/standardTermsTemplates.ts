import { TermsAndConditions, TermsSection } from './termsConditionsService';

export const createStandardTermsTemplate = (projectType: string): Omit<TermsAndConditions, 'id' | 'createdAt' | 'updatedAt'> => {
  const commonSections: TermsSection[] = [
    {
      id: 'payment-terms',
      title: 'Payment Terms',
      content: `Payment shall be made according to the following schedule:
- 10% deposit upon contract signing
- 25% upon commencement of work
- 25% at 50% completion milestone
- 25% at 90% completion milestone
- 15% upon final completion and handover

All payments are due within 7 days of invoice. Late payments may incur interest charges at 8% per annum above the Bank of England base rate.`,
      order: 1,
      isRequired: true,
      canBeAmended: true
    },
    {
      id: 'materials-supply',
      title: 'Materials and Supply',
      content: `The Contractor shall supply all materials specified in the Scope of Work unless otherwise agreed. All materials shall be:
- New and of merchantable quality
- Comply with relevant British Standards and Building Regulations
- Supplied with appropriate warranties and guarantees
- Stored securely on site with appropriate insurance coverage

Any variations to specified materials must be agreed in writing with the Homeowner.`,
      order: 2,
      isRequired: true,
      canBeAmended: true
    },
    {
      id: 'timeline-completion',
      title: 'Timeline and Completion',
      content: `Work shall commence on the agreed start date and be completed within the timeframe specified in the project timeline. Time extensions may be granted for:
- Adverse weather conditions preventing safe work
- Discovery of unforeseen structural issues
- Changes requested by the Homeowner
- Delays in material supply beyond the Contractor's control

All time extensions must be agreed in writing.`,
      order: 3,
      isRequired: true,
      canBeAmended: true
    },
    {
      id: 'insurance-liability',
      title: 'Insurance and Liability',
      content: `The Contractor shall maintain:
- Public liability insurance of not less than £2,000,000
- Employers' liability insurance of not less than £10,000,000
- All risks insurance covering materials and work in progress

Evidence of current insurance must be provided before work commences. The Contractor is liable for any damage to existing property caused by negligent work.`,
      order: 4,
      isRequired: true,
      canBeAmended: false
    },
    {
      id: 'health-safety',
      title: 'Health and Safety',
      content: `The Contractor shall:
- Comply with all relevant Health and Safety regulations
- Maintain a safe working environment at all times
- Provide appropriate safety equipment for all workers
- Report any accidents or incidents immediately
- Ensure all workers are appropriately qualified and trained

The site shall be left in a safe and tidy condition at the end of each working day.`,
      order: 5,
      isRequired: true,
      canBeAmended: false
    },
    {
      id: 'variations-changes',
      title: 'Variations and Changes',
      content: `Any changes to the original scope of work must be:
- Requested in writing by the Homeowner
- Assessed and quoted by the Contractor within 5 working days
- Agreed in writing before implementation
- Documented with impact on timeline and cost

No additional charges will be accepted without prior written agreement.`,
      order: 6,
      isRequired: true,
      canBeAmended: true
    },
    {
      id: 'warranties-guarantees',
      title: 'Warranties and Guarantees',
      content: `The Contractor provides:
- 12 months warranty on all workmanship
- Pass-through of manufacturer warranties on materials and equipment
- Defects liability period of 12 months from completion
- Commitment to remedy defects at no cost during warranty period

Warranties exclude normal wear and tear, misuse, or damage by third parties.`,
      order: 7,
      isRequired: true,
      canBeAmended: true
    },
    {
      id: 'dispute-resolution',
      title: 'Dispute Resolution',
      content: `Any disputes shall be resolved through:
1. Direct negotiation between parties
2. Mediation through a mutually agreed mediator
3. Arbitration under the Construction Industry Model Arbitration Rules
4. Legal proceedings as a last resort

The contract shall be governed by English law and subject to the jurisdiction of English courts.`,
      order: 8,
      isRequired: true,
      canBeAmended: false
    }
  ];

  // Project-specific additional sections
  const projectSpecificSections = getProjectSpecificSections(projectType);

  return {
    projectType,
    version: 1,
    title: `Standard Terms and Conditions - ${projectType}`,
    content: `These terms and conditions govern the ${projectType} project as detailed in the accompanying Scope of Work.`,
    sections: [...commonSections, ...projectSpecificSections].sort((a, b) => a.order - b.order),
    isStandard: true,
    createdBy: 'system',
    isActive: true
  };
};

const getProjectSpecificSections = (projectType: string): TermsSection[] => {
  const sections: TermsSection[] = [];

  // Structural work specific terms
  if (['loft-conversion', 'extension', 'basement-conversion'].includes(projectType)) {
    sections.push({
      id: 'structural-work',
      title: 'Structural Work and Building Regulations',
      content: `All structural work shall:
- Comply with current Building Regulations and British Standards
- Be designed by qualified structural engineers where required
- Include all necessary Building Control approvals and inspections
- Provide structural calculations and certificates upon completion

The Contractor is responsible for obtaining all required approvals unless otherwise specified.`,
      order: 9,
      isRequired: true,
      canBeAmended: false
    });

    sections.push({
      id: 'party-wall',
      title: 'Party Wall Agreements',
      content: `Where work affects party walls or boundaries:
- Party Wall notices shall be served as required by the Party Wall Act 1996
- All costs associated with Party Wall procedures are included in the contract price
- Work shall not commence until all Party Wall matters are resolved
- The Contractor shall coordinate with appointed Party Wall Surveyors`,
      order: 10,
      isRequired: true,
      canBeAmended: true
    });
  }

  // Electrical work specific terms
  if (projectType.includes('electrical') || ['kitchen', 'bathroom', 'loft-conversion'].includes(projectType)) {
    sections.push({
      id: 'electrical-compliance',
      title: 'Electrical Work Compliance',
      content: `All electrical work shall:
- Be carried out by qualified electricians registered with an approved scheme
- Comply with BS 7671 (IET Wiring Regulations)
- Include electrical installation certificates upon completion
- Be notified to Building Control where required under Part P

All electrical work is guaranteed for 12 months and backed by appropriate insurance.`,
      order: 11,
      isRequired: true,
      canBeAmended: false
    });
  }

  // Plumbing work specific terms
  if (['bathroom', 'kitchen', 'heating'].includes(projectType)) {
    sections.push({
      id: 'plumbing-compliance',
      title: 'Plumbing and Water Regulations',
      content: `All plumbing work shall:
- Comply with Water Supply (Water Fittings) Regulations 1999
- Be carried out by qualified plumbers where gas work is involved
- Include pressure testing and certification
- Maintain adequate water pressure throughout the property

Gas work must be carried out by Gas Safe registered engineers with appropriate certification provided.`,
      order: 12,
      isRequired: true,
      canBeAmended: false
    });
  }

  // External work specific terms
  if (['driveway', 'landscaping', 'rendering'].includes(projectType)) {
    sections.push({
      id: 'external-work',
      title: 'External Work and Weather',
      content: `External work is subject to weather conditions:
- Work may be suspended during adverse weather for safety and quality reasons
- Concrete and rendering work requires appropriate curing time
- Drainage work must comply with local authority requirements
- All external work includes appropriate warranties against weather damage

The Contractor shall protect completed work from weather damage during the construction period.`,
      order: 13,
      isRequired: true,
      canBeAmended: true
    });
  }

  // Conservation and listed building terms
  if (projectType.includes('conservation') || projectType.includes('listed')) {
    sections.push({
      id: 'conservation-requirements',
      title: 'Conservation and Listed Building Requirements',
      content: `Work on conservation areas or listed buildings shall:
- Comply with all conservation area or listed building consents
- Use appropriate traditional materials and methods where specified
- Be carried out by craftspeople experienced in heritage work
- Include photographic records before, during, and after work

Any discoveries of historical significance must be reported to the local conservation officer immediately.`,
      order: 14,
      isRequired: true,
      canBeAmended: false
    });
  }

  return sections;
};

// Pre-defined project types with their standard terms
export const PROJECT_TYPES_WITH_TERMS = [
  'loft-conversion',
  'rear-extension',
  'side-extension',
  'basement-conversion',
  'garage-conversion',
  'kitchen-renovation',
  'bathroom-renovation',
  'bedroom-renovation',
  'living-room-renovation',
  'electrical-rewiring',
  'plumbing-upgrade',
  'heating-system',
  'roofing',
  'windows-doors',
  'driveway-patio',
  'landscaping',
  'rendering-cladding',
  'insulation',
  'conservatory',
  'garden-room',
  'general-renovation'
];

export const initializeStandardTerms = async () => {
  const { termsConditionsService } = await import('./termsConditionsService');
  
  for (const projectType of PROJECT_TYPES_WITH_TERMS) {
    try {
      const existingTerms = await termsConditionsService.getStandardTerms(projectType);
      if (!existingTerms) {
        const template = createStandardTermsTemplate(projectType);
        await termsConditionsService.createStandardTerms(projectType, template);
        console.log(`Created standard terms for ${projectType}`);
      }
    } catch (error) {
      console.error(`Failed to create standard terms for ${projectType}:`, error);
    }
  }
};