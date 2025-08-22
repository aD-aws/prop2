import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ContractTemplate, ProjectType } from '../types';

export class ContractTemplateService {
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-2' });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Create or update a contract template
   */
  async createTemplate(template: Omit<ContractTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContractTemplate> {
    const newTemplate: ContractTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: 'ContractTemplates',
      Item: newTemplate
    }));

    return newTemplate;
  }

  /**
   * Get template by project type and version
   */
  async getTemplate(projectType: string, version: string = 'latest'): Promise<ContractTemplate | null> {
    try {
      if (version === 'latest') {
        // Get the most recent active template for this project type
        const response = await this.dynamoClient.send(new QueryCommand({
          TableName: 'ContractTemplates',
          IndexName: 'ProjectTypeIndex',
          KeyConditionExpression: 'projectType = :projectType',
          FilterExpression: 'isActive = :isActive',
          ExpressionAttributeValues: {
            ':projectType': projectType,
            ':isActive': true
          },
          ScanIndexForward: false, // Get most recent first
          Limit: 1
        }));

        return response.Items?.[0] as ContractTemplate || null;
      } else {
        // Get specific version
        const response = await this.dynamoClient.send(new GetCommand({
          TableName: 'ContractTemplates',
          Key: {
            projectType,
            version
          }
        }));

        return response.Item as ContractTemplate || null;
      }
    } catch (error) {
      console.error('Error fetching contract template:', error);
      return null;
    }
  }

  /**
   * Get all templates for a project type
   */
  async getTemplateVersions(projectType: string): Promise<ContractTemplate[]> {
    try {
      const response = await this.dynamoClient.send(new QueryCommand({
        TableName: 'ContractTemplates',
        IndexName: 'ProjectTypeIndex',
        KeyConditionExpression: 'projectType = :projectType',
        ExpressionAttributeValues: {
          ':projectType': projectType
        },
        ScanIndexForward: false // Most recent first
      }));

      return response.Items as ContractTemplate[] || [];
    } catch (error) {
      console.error('Error fetching template versions:', error);
      return [];
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<ContractTemplate>): Promise<void> {
    const updateExpression = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date();

    await this.dynamoClient.send(new UpdateCommand({
      TableName: 'ContractTemplates',
      Key: { id: templateId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));
  }

  /**
   * Deactivate template
   */
  async deactivateTemplate(templateId: string): Promise<void> {
    await this.updateTemplate(templateId, { isActive: false });
  }

  /**
   * Get all active templates
   */
  async getAllActiveTemplates(): Promise<ContractTemplate[]> {
    try {
      const response = await this.dynamoClient.send(new ScanCommand({
        TableName: 'ContractTemplates',
        FilterExpression: 'isActive = :isActive',
        ExpressionAttributeValues: {
          ':isActive': true
        }
      }));

      return response.Items as ContractTemplate[] || [];
    } catch (error) {
      console.error('Error fetching active templates:', error);
      return [];
    }
  }

  /**
   * Initialize default templates for all project types
   */
  async initializeDefaultTemplates(): Promise<void> {
    const projectTypes: ProjectType[] = [
      'loft_conversion_dormer',
      'rear_extension_single_storey',
      'kitchen_full_refit',
      'bathroom_full_refit',
      // Add more project types as needed
    ];

    for (const projectType of projectTypes) {
      const existingTemplate = await this.getTemplate(projectType);
      
      if (!existingTemplate) {
        await this.createTemplate({
          projectType,
          version: '1.0',
          content: this.getDefaultTemplateContent(projectType),
          standardTerms: this.getStandardTermsForProjectType(projectType)
        });
      }
    }
  }

  /**
   * Get default template content for a project type
   */
  private getDefaultTemplateContent(projectType: string): string {
    const baseTemplate = `
# HOME IMPROVEMENT CONTRACT

**Contract ID:** {{PROJECT_ID}}
**Date:** {{CURRENT_DATE}}
**Project Type:** {{PROJECT_TYPE}}

## PARTIES

This contract is entered into between:

**The Homeowner** (Client)
**The Builder** (Contractor)

## PROJECT DETAILS

**Project Timeline:** {{PROJECT_TIMELINE}}
**Start Date:** {{START_DATE}}
**Projected Completion Date:** {{COMPLETION_DATE}}

## SCOPE OF WORK

{{SOW_SECTIONS}}

## MATERIALS AND SPECIFICATIONS

{{MATERIALS_LIST}}

## LABOR REQUIREMENTS

{{LABOR_REQUIREMENTS}}

## REGULATORY COMPLIANCE

This project shall comply with all applicable UK Building Regulations and local authority requirements:

{{REGULATORY_REQUIREMENTS}}

## PRICING

**Total Contract Value:** {{TOTAL_AMOUNT}}
**Labor Costs:** {{LABOR_COSTS}}
**Material Costs:** {{MATERIAL_COSTS}}

### Detailed Pricing Breakdown:
{{PRICING_BREAKDOWN}}

## BUILDER REFERENCES

The contractor has provided the following reference projects:

{{REFERENCE_PROJECTS}}

## PAYMENT TERMS

Payment shall be made according to the agreed schedule and milestones as outlined in the project timeline.

## WARRANTIES AND GUARANTEES

The contractor warrants that all work will be completed in accordance with UK Building Regulations and industry best practices.

## TERMS AND CONDITIONS

This contract is subject to the standard terms and conditions agreed upon by both parties.

---

**Homeowner Signature:** ___________________________ Date: ___________

**Builder Signature:** _____________________________ Date: ___________
`;

    // Add project-specific clauses
    const projectSpecificClauses = this.getProjectSpecificClauses(projectType);
    
    return baseTemplate + projectSpecificClauses;
  }

  /**
   * Get project-specific clauses
   */
  private getProjectSpecificClauses(projectType: string): string {
    const clauses: Record<string, string> = {
      loft_conversion_dormer: `

## LOFT CONVERSION SPECIFIC TERMS

1. **Structural Work**: All structural modifications shall be designed by a qualified structural engineer and approved by Building Control.

2. **Planning Permission**: The contractor shall verify that all necessary planning permissions are in place before commencing work.

3. **Insulation**: All insulation work shall meet current Building Regulations Part L requirements for thermal performance.

4. **Fire Safety**: Escape routes and fire safety measures shall comply with Building Regulations Part B.

5. **Headroom**: Minimum headroom of 2.3m shall be maintained in habitable areas as per Building Regulations.
`,
      rear_extension_single_storey: `

## EXTENSION SPECIFIC TERMS

1. **Foundation Work**: All foundation work shall be designed to appropriate depth and specification for ground conditions.

2. **Damp Proof Course**: Proper DPC shall be installed and tied into existing building DPC.

3. **Thermal Bridge**: Thermal bridging shall be minimized in accordance with Building Regulations Part L.

4. **Drainage**: Surface water drainage shall be provided with appropriate falls and connections to existing systems.
`,
      kitchen_full_refit: `

## KITCHEN SPECIFIC TERMS

1. **Electrical Work**: All electrical work shall be carried out by qualified electricians and certified under Part P of Building Regulations.

2. **Plumbing**: All plumbing work shall comply with Water Supply (Water Fittings) Regulations.

3. **Ventilation**: Adequate mechanical ventilation shall be provided in accordance with Building Regulations Part F.

4. **Gas Work**: Any gas work shall be carried out by Gas Safe registered engineers only.
`,
      bathroom_full_refit: `

## BATHROOM SPECIFIC TERMS

1. **Waterproofing**: All wet areas shall be properly waterproofed with appropriate tanking systems.

2. **Ventilation**: Mechanical ventilation shall be provided to prevent condensation and mold growth.

3. **Electrical Safety**: All electrical installations shall comply with BS 7671 wiring regulations for bathroom zones.

4. **Accessibility**: Where applicable, accessibility requirements shall be met in accordance with Part M of Building Regulations.
`
    };

    return clauses[projectType] || '';
  }

  /**
   * Get standard terms for project type
   */
  private getStandardTermsForProjectType(projectType: string): string {
    const baseTerms = `
STANDARD TERMS AND CONDITIONS

1. COMPLIANCE: All work shall comply with UK Building Regulations, British Standards, and local authority requirements.

2. MATERIALS: Materials shall be of merchantable quality and fit for purpose as specified in the Scope of Work.

3. WORKMANSHIP: All work shall be carried out in a good and workmanlike manner by qualified tradespeople.

4. VARIATIONS: Any changes to the scope of work must be agreed in writing with corresponding price adjustments.

5. HEALTH & SAFETY: The contractor shall comply with all applicable health and safety regulations including CDM Regulations.

6. INSURANCE: The contractor shall maintain appropriate public liability and employer's liability insurance.

7. WARRANTIES: The contractor provides a 12-month warranty on all work completed.

8. DISPUTE RESOLUTION: Any disputes shall be resolved through mediation or arbitration as appropriate.

9. FORCE MAJEURE: Neither party shall be liable for delays caused by circumstances beyond their reasonable control.

10. GOVERNING LAW: This contract shall be governed by the laws of England and Wales.
`;

    // Add project-specific terms
    const projectSpecificTerms = this.getProjectSpecificTerms(projectType);
    
    return baseTerms + projectSpecificTerms;
  }

  /**
   * Get project-specific terms
   */
  private getProjectSpecificTerms(projectType: string): string {
    const terms: Record<string, string> = {
      loft_conversion_dormer: `

11. STRUCTURAL CERTIFICATION: Structural calculations and certifications shall be provided upon completion.

12. BUILDING CONTROL: All Building Control inspections shall be arranged and fees included in the contract price.

13. PARTY WALL: Any Party Wall Act requirements shall be the homeowner's responsibility unless otherwise agreed.
`,
      rear_extension_single_storey: `

11. GROUND CONDITIONS: The contractor shall allow for normal ground conditions. Exceptional conditions may result in variations.

12. EXISTING SERVICES: Location and diversion of existing services shall be verified before commencement.

13. WEATHER PROTECTION: Adequate weather protection shall be provided during construction.
`
    };

    return terms[projectType] || '';
  }
}

export const contractTemplateService = new ContractTemplateService();