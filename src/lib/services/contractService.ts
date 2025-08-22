import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Contract, ContractStatus, SoWDocument, Quote, Project, ContractTemplate } from '../types';
import { termsConditionsService, ProjectTerms } from './termsConditionsService';

export class ContractService {
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-west-2' });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Generate a contract from agreed SoW and selected quote
   */
  async generateContract(
    projectId: string,
    selectedQuote: Quote,
    sowDocument: SoWDocument,
    homeownerId: string,
    builderId: string
  ): Promise<Contract> {
    try {
      // Get agreed terms and conditions for the project
      const projectTerms = await termsConditionsService.getProjectTerms(projectId);
      
      if (!projectTerms || !projectTerms.agreedAt) {
        throw new Error('Terms and conditions must be agreed before generating contract');
      }

      // Get appropriate contract template based on project type
      const template = await this.getContractTemplate(sowDocument.projectType);
      
      // Generate contract content with agreed terms
      const contractContent = await this.generateContractContent(
        template,
        sowDocument,
        selectedQuote,
        projectId,
        projectTerms
      );

      const now = new Date();
      const contract: Contract = {
        id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        homeownerId,
        builderId,
        quoteId: selectedQuote.id,
        sowId: sowDocument.id,
        content: contractContent,
        status: 'draft',
        templateVersion: template.version,
        totalAmount: selectedQuote.pricing.totalAmount,
        projectTimeline: selectedQuote.timeline,
        startDate: selectedQuote.startDate,
        projectedCompletionDate: selectedQuote.projectedCompletionDate,
        termsAndConditions: this.formatAgreedTerms(projectTerms.finalTerms),
        projectTermsId: projectTerms.id,
        createdAt: now,
        updatedAt: now,
        complianceChecks: {
          ukBuildingRegulations: true,
          industryStandards: true,
          unambiguousTerms: true,
          termsAgreed: true,
          validatedAt: now
        }
      };

      // Store contract in DynamoDB
      await this.storeContract(contract);

      return contract;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw new Error('Failed to generate contract');
    }
  }

  /**
   * Get contract template based on project type
   */
  private async getContractTemplate(projectType: string): Promise<ContractTemplate> {
    try {
      const response = await this.dynamoClient.send(new GetCommand({
        TableName: 'ContractTemplates',
        Key: {
          projectType,
          version: 'latest'
        }
      }));

      if (!response.Item) {
        // Return default template if specific one not found
        return this.getDefaultContractTemplate();
      }

      return response.Item as ContractTemplate;
    } catch (error) {
      console.error('Error fetching contract template:', error);
      return this.getDefaultContractTemplate();
    }
  }

  /**
   * Generate contract content from template and project data
   */
  private async generateContractContent(
    template: ContractTemplate,
    sowDocument: SoWDocument,
    quote: Quote,
    projectId: string,
    projectTerms?: ProjectTerms
  ): Promise<string> {
    let content = template.content;

    // Replace placeholders with actual data
    const replacements = {
      '{{PROJECT_ID}}': projectId,
      '{{PROJECT_TYPE}}': sowDocument.projectType,
      '{{TOTAL_AMOUNT}}': `£${quote.pricing.totalAmount.toLocaleString()}`,
      '{{LABOR_COSTS}}': `£${quote.pricing.laborCosts.toLocaleString()}`,
      '{{MATERIAL_COSTS}}': `£${quote.pricing.materialCosts.toLocaleString()}`,
      '{{PROJECT_TIMELINE}}': `${quote.timeline} working days`,
      '{{START_DATE}}': quote.startDate.toLocaleDateString('en-GB'),
      '{{COMPLETION_DATE}}': quote.projectedCompletionDate.toLocaleDateString('en-GB'),
      '{{SOW_SECTIONS}}': this.formatSoWSections(sowDocument.sections),
      '{{MATERIALS_LIST}}': this.formatMaterialsList(sowDocument.materials),
      '{{LABOR_REQUIREMENTS}}': this.formatLaborRequirements(sowDocument.laborRequirements),
      '{{REGULATORY_REQUIREMENTS}}': this.formatRegulatoryRequirements(sowDocument.regulatoryRequirements),
      '{{PRICING_BREAKDOWN}}': this.formatPricingBreakdown(quote.pricing.breakdown),
      '{{REFERENCE_PROJECTS}}': this.formatReferenceProjects(quote.referenceProjects),
      '{{TERMS_AND_CONDITIONS}}': projectTerms ? this.formatAgreedTerms(projectTerms.finalTerms) : template.standardTerms,
      '{{CURRENT_DATE}}': new Date().toLocaleDateString('en-GB')
    };

    // Apply replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return content;
  }

  /**
   * Store contract in DynamoDB
   */
  private async storeContract(contract: Contract): Promise<void> {
    // Convert dates to ISO strings for DynamoDB storage
    const contractForStorage = {
      ...contract,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      startDate: contract.startDate.toISOString(),
      projectedCompletionDate: contract.projectedCompletionDate.toISOString(),
      complianceChecks: {
        ...contract.complianceChecks,
        validatedAt: contract.complianceChecks.validatedAt.toISOString()
      },
      signedAt: contract.signedAt?.toISOString(),
      homeownerSignedAt: contract.homeownerSignedAt?.toISOString(),
      builderSignedAt: contract.builderSignedAt?.toISOString()
    };

    await this.dynamoClient.send(new PutCommand({
      TableName: 'Contracts',
      Item: contractForStorage
    }));

    // Also create index entry for project lookup
    await this.dynamoClient.send(new PutCommand({
      TableName: 'ProjectContracts',
      Item: {
        projectId: contract.projectId,
        contractId: contract.id,
        status: contract.status,
        createdAt: contract.createdAt.toISOString()
      }
    }));
  }

  /**
   * Get contract by ID
   */
  async getContract(contractId: string): Promise<Contract | null> {
    try {
      const response = await this.dynamoClient.send(new GetCommand({
        TableName: 'Contracts',
        Key: { id: contractId }
      }));

      return response.Item as Contract || null;
    } catch (error) {
      console.error('Error fetching contract:', error);
      return null;
    }
  }

  /**
   * Get contracts for a project
   */
  async getProjectContracts(projectId: string): Promise<Contract[]> {
    try {
      const response = await this.dynamoClient.send(new QueryCommand({
        TableName: 'Contracts',
        IndexName: 'ProjectIdIndex',
        KeyConditionExpression: 'projectId = :projectId',
        ExpressionAttributeValues: {
          ':projectId': projectId
        }
      }));

      return response.Items as Contract[] || [];
    } catch (error) {
      console.error('Error fetching project contracts:', error);
      return [];
    }
  }

  /**
   * Update contract status
   */
  async updateContractStatus(contractId: string, status: ContractStatus, signatureData?: any): Promise<void> {
    try {
      let updateExpression = 'SET #status = :status, updatedAt = :updatedAt';
      const expressionAttributeNames = { '#status': 'status' };
      const expressionAttributeValues: any = {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      };

      if (signatureData) {
        updateExpression += ', signatureData = :signatureData';
        expressionAttributeValues[':signatureData'] = signatureData;
      }

      if (status === 'signed') {
        updateExpression += ', signedAt = :signedAt';
        expressionAttributeValues[':signedAt'] = new Date().toISOString();
      }

      await this.dynamoClient.send(new UpdateCommand({
        TableName: 'Contracts',
        Key: { id: contractId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues
      }));
    } catch (error) {
      console.error('Error updating contract status:', error);
      throw new Error('Failed to update contract status');
    }
  }

  /**
   * Get default contract template
   */
  private getDefaultContractTemplate(): ContractTemplate {
    return {
      id: 'default',
      projectType: 'default',
      version: '1.0',
      content: this.getDefaultContractContent(),
      standardTerms: this.getStandardTermsAndConditions(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get default contract content template
   */
  private getDefaultContractContent(): string {
    return `
# HOME IMPROVEMENT CONTRACT

**Contract ID:** {{PROJECT_ID}}
**Date:** {{CURRENT_DATE}}

## PARTIES

This contract is entered into between:

**The Homeowner** (Client)
**The Builder** (Contractor)

## PROJECT DETAILS

**Project Type:** {{PROJECT_TYPE}}
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

{{TERMS_AND_CONDITIONS}}

---

**Homeowner Signature:** ___________________________ Date: ___________

**Builder Signature:** _____________________________ Date: ___________
`;
  }

  /**
   * Get standard terms and conditions
   */
  private getStandardTermsAndConditions(): string {
    return `
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
  }

  // Helper methods for formatting contract content
  private formatSoWSections(sections: any[]): string {
    return sections.map((section, index) => 
      `### ${index + 1}. ${section.title}\n${section.description}\n`
    ).join('\n');
  }

  private formatMaterialsList(materials: any[]): string {
    return materials.map(material => 
      `- ${material.name}: ${material.specification} (${material.providedBy})`
    ).join('\n');
  }

  private formatLaborRequirements(laborReqs: any[]): string {
    return laborReqs.map(req => 
      `- ${req.trade}: ${req.personDays} person-days - ${req.description}`
    ).join('\n');
  }

  private formatRegulatoryRequirements(reqs: any[]): string {
    return reqs.map(req => 
      `- ${req.regulation}: ${req.description}`
    ).join('\n');
  }

  private formatPricingBreakdown(breakdown: any[]): string {
    return breakdown.map(item => 
      `- ${item.category}: £${item.amount.toLocaleString()} - ${item.description}`
    ).join('\n');
  }

  private formatReferenceProjects(references: any[]): string {
    return references.map(ref => 
      `- ${ref.projectType} at ${ref.address} (Completed: ${ref.completionDate.toLocaleDateString('en-GB')})`
    ).join('\n');
  }

  /**
   * Format agreed terms and conditions for contract inclusion
   */
  private formatAgreedTerms(finalTerms: any): string {
    if (!finalTerms || !finalTerms.sections) {
      return this.getStandardTermsAndConditions();
    }

    let formattedTerms = `AGREED TERMS AND CONDITIONS\n\n`;
    formattedTerms += `These terms and conditions have been agreed upon by both parties and incorporate any amendments made during the negotiation process.\n\n`;

    finalTerms.sections.forEach((section: any, index: number) => {
      formattedTerms += `${index + 1}. ${section.title.toUpperCase()}\n\n`;
      formattedTerms += `${section.content}\n\n`;
    });

    formattedTerms += `\nThese terms and conditions were finalized and agreed upon on ${new Date(finalTerms.updatedAt).toLocaleDateString('en-GB')}.\n`;

    return formattedTerms;
  }

  /**
   * Validate that terms are agreed before contract generation
   */
  async validateTermsAgreement(projectId: string): Promise<boolean> {
    try {
      const projectTerms = await termsConditionsService.getProjectTerms(projectId);
      return !!(projectTerms && projectTerms.agreedAt && projectTerms.homeownerAccepted && projectTerms.builderAccepted);
    } catch (error) {
      console.error('Error validating terms agreement:', error);
      return false;
    }
  }
}

export const contractService = new ContractService();