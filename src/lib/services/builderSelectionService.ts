// Builder selection and "Meet before contract" workflow service

import { DynamoDBService } from '@/lib/aws/dynamodb';
import { Quote, Project, BuilderProfile, Contract } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export type SelectionStatus = 
  | 'quote_selected'
  | 'meet_scheduled'
  | 'meeting_completed'
  | 'meeting_approved'
  | 'meeting_rejected'
  | 'contract_generated'
  | 'contract_signed';

export interface BuilderSelection {
  id: string;
  projectId: string;
  selectedQuoteId: string;
  builderId: string;
  homeownerId: string;
  status: SelectionStatus;
  meetingDetails?: MeetingDetails;
  selectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingDetails {
  scheduledDate?: Date;
  scheduledTime?: string;
  location: string; // Usually the property address
  attendees: string[];
  agenda: string[];
  notes?: string;
  homeownerFeedback?: MeetingFeedback;
  completedAt?: Date;
}

export interface MeetingFeedback {
  overallImpression: 'positive' | 'neutral' | 'negative';
  professionalism: number; // 1-5 scale
  communication: number; // 1-5 scale
  expertise: number; // 1-5 scale
  trustworthiness: number; // 1-5 scale
  concerns: string[];
  positives: string[];
  willingToProceed: boolean;
  additionalNotes?: string;
}

export interface CredentialVerification {
  builderId: string;
  companiesHouseVerified: boolean;
  insuranceVerified: boolean;
  referencesVerified: boolean;
  qualificationsVerified: boolean;
  overallVerificationScore: number; // 0-100
  verificationDetails: VerificationDetail[];
}

export interface VerificationDetail {
  type: 'companies_house' | 'insurance' | 'references' | 'qualifications' | 'trade_association';
  status: 'verified' | 'pending' | 'failed' | 'not_provided';
  details: string;
  verifiedAt?: Date;
}

export class BuilderSelectionService {
  private static readonly SELECTIONS_TABLE = 'uk-home-improvement-selections';
  private static readonly PROJECTS_TABLE = 'uk-home-improvement-projects';
  private static readonly BUILDERS_TABLE = 'uk-home-improvement-builders';
  private static readonly QUOTES_TABLE = 'uk-home-improvement-quotes';

  /**
   * Select a builder quote and initiate "Meet before contract" process
   */
  static async selectBuilder(
    projectId: string,
    quoteId: string,
    homeownerId: string,
    selectionReason?: string
  ): Promise<{ success: boolean; selectionId?: string; error?: string }> {
    try {
      // Validate quote exists and belongs to project
      const quoteResult = await DynamoDBService.getItem(this.QUOTES_TABLE, { id: quoteId });
      if (!quoteResult.Item || quoteResult.Item.projectId !== projectId) {
        return { success: false, error: 'Invalid quote or project mismatch' };
      }

      const quote = quoteResult.Item as Quote;
      const selectionId = uuidv4();

      // Create builder selection record
      const selection: BuilderSelection = {
        id: selectionId,
        projectId,
        selectedQuoteId: quoteId,
        builderId: quote.builderId,
        homeownerId,
        status: 'quote_selected',
        selectionReason,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store selection
      await DynamoDBService.putItem(this.SELECTIONS_TABLE, {
        ...selection,
        createdAt: selection.createdAt.toISOString(),
        updatedAt: selection.updatedAt.toISOString()
      });

      // Update project status
      await DynamoDBService.updateItem(
        this.PROJECTS_TABLE,
        { id: projectId },
        {
          status: 'builder_selection',
          selectedBuilderId: quote.builderId,
          updatedAt: new Date().toISOString()
        }
      );

      // Update quote status
      await DynamoDBService.updateItem(
        this.QUOTES_TABLE,
        { id: quoteId },
        { status: 'accepted' }
      );

      // Update other quotes to rejected
      const projectResult = await DynamoDBService.getItem(this.PROJECTS_TABLE, { id: projectId });
      const project = projectResult.Item as Project;
      
      if (project.quotes) {
        for (const otherQuoteId of project.quotes) {
          if (otherQuoteId !== quoteId) {
            await DynamoDBService.updateItem(
              this.QUOTES_TABLE,
              { id: otherQuoteId },
              { status: 'rejected' }
            );
          }
        }
      }

      return { success: true, selectionId };
    } catch (error) {
      console.error('Error selecting builder:', error);
      return { success: false, error: 'Failed to select builder' };
    }
  }

  /**
   * Schedule meeting with selected builder
   */
  static async scheduleMeeting(
    selectionId: string,
    meetingDetails: {
      scheduledDate: Date;
      scheduledTime: string;
      location: string;
      attendees: string[];
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const agenda = [
        'Review project scope and specifications',
        'Verify builder credentials and insurance',
        'Discuss timeline and milestones',
        'Review pricing and payment terms',
        'Address any concerns or questions',
        'Inspect any reference projects if applicable',
        'Finalize contract terms if satisfied'
      ];

      const meeting: MeetingDetails = {
        ...meetingDetails,
        agenda,
        location: meetingDetails.location
      };

      await DynamoDBService.updateItem(
        this.SELECTIONS_TABLE,
        { id: selectionId },
        {
          status: 'meet_scheduled',
          meetingDetails: {
            ...meeting,
            scheduledDate: meeting.scheduledDate?.toISOString()
          },
          updatedAt: new Date().toISOString()
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      return { success: false, error: 'Failed to schedule meeting' };
    }
  }

  /**
   * Record meeting completion and feedback
   */
  static async completeMeeting(
    selectionId: string,
    feedback: MeetingFeedback,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const selectionResult = await DynamoDBService.getItem(this.SELECTIONS_TABLE, { id: selectionId });
      if (!selectionResult.Item) {
        return { success: false, error: 'Selection not found' };
      }

      const selection = selectionResult.Item as BuilderSelection;
      const updatedMeetingDetails: MeetingDetails = {
        ...selection.meetingDetails!,
        homeownerFeedback: feedback,
        notes,
        completedAt: new Date()
      };

      const newStatus: SelectionStatus = feedback.willingToProceed ? 'meeting_approved' : 'meeting_rejected';

      await DynamoDBService.updateItem(
        this.SELECTIONS_TABLE,
        { id: selectionId },
        {
          status: newStatus,
          meetingDetails: {
            ...updatedMeetingDetails,
            scheduledDate: updatedMeetingDetails.scheduledDate?.toISOString(),
            completedAt: updatedMeetingDetails.completedAt?.toISOString()
          },
          updatedAt: new Date().toISOString()
        }
      );

      // If meeting rejected, update project status to allow new selection
      if (!feedback.willingToProceed) {
        await DynamoDBService.updateItem(
          this.PROJECTS_TABLE,
          { id: selection.projectId },
          {
            status: 'quote_collection',
            selectedBuilderId: null,
            updatedAt: new Date().toISOString()
          }
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing meeting:', error);
      return { success: false, error: 'Failed to record meeting completion' };
    }
  }

  /**
   * Get comprehensive builder verification display
   */
  static async getBuilderVerification(builderId: string): Promise<{ 
    success: boolean; 
    verification?: CredentialVerification; 
    error?: string 
  }> {
    try {
      const builderResult = await DynamoDBService.getItem(this.BUILDERS_TABLE, { id: builderId });
      if (!builderResult.Item) {
        return { success: false, error: 'Builder not found' };
      }

      const builder = builderResult.Item as BuilderProfile;
      const verificationDetails: VerificationDetail[] = [];
      let verificationScore = 0;

      // Companies House verification
      if (builder.companiesHouseNumber) {
        verificationDetails.push({
          type: 'companies_house',
          status: 'verified',
          details: `Company registered: ${builder.companiesHouseNumber}`,
          verifiedAt: new Date()
        });
        verificationScore += 25;
      } else {
        verificationDetails.push({
          type: 'companies_house',
          status: 'not_provided',
          details: 'Companies House number not provided'
        });
      }

      // Insurance verification
      const hasValidInsurance = builder.insuranceDocuments && builder.insuranceDocuments.length > 0;
      if (hasValidInsurance) {
        verificationDetails.push({
          type: 'insurance',
          status: 'verified',
          details: `${builder.insuranceDocuments.length} insurance document(s) verified`,
          verifiedAt: new Date()
        });
        verificationScore += 30;
      } else {
        verificationDetails.push({
          type: 'insurance',
          status: 'not_provided',
          details: 'Insurance documents not provided'
        });
      }

      // References verification (mock - would integrate with actual reference checking)
      if (builder.completedProjects && builder.completedProjects > 0) {
        verificationDetails.push({
          type: 'references',
          status: 'verified',
          details: `${builder.completedProjects} completed projects verified`,
          verifiedAt: new Date()
        });
        verificationScore += 25;
      } else {
        verificationDetails.push({
          type: 'references',
          status: 'not_provided',
          details: 'No reference projects provided'
        });
      }

      // Qualifications verification (mock - would integrate with certification bodies)
      if (builder.specializations && builder.specializations.length > 0) {
        verificationDetails.push({
          type: 'qualifications',
          status: 'verified',
          details: `Specializations: ${builder.specializations.join(', ')}`,
          verifiedAt: new Date()
        });
        verificationScore += 20;
      } else {
        verificationDetails.push({
          type: 'qualifications',
          status: 'not_provided',
          details: 'No specializations listed'
        });
      }

      const verification: CredentialVerification = {
        builderId,
        companiesHouseVerified: !!builder.companiesHouseNumber,
        insuranceVerified: hasValidInsurance,
        referencesVerified: (builder.completedProjects || 0) > 0,
        qualificationsVerified: (builder.specializations?.length || 0) > 0,
        overallVerificationScore: verificationScore,
        verificationDetails
      };

      return { success: true, verification };
    } catch (error) {
      console.error('Error getting builder verification:', error);
      return { success: false, error: 'Failed to get builder verification' };
    }
  }

  /**
   * Get selection details
   */
  static async getSelection(selectionId: string): Promise<{ 
    success: boolean; 
    selection?: BuilderSelection; 
    error?: string 
  }> {
    try {
      const result = await DynamoDBService.getItem(this.SELECTIONS_TABLE, { id: selectionId });
      if (!result.Item) {
        return { success: false, error: 'Selection not found' };
      }

      const selection: BuilderSelection = {
        ...result.Item,
        createdAt: new Date(result.Item.createdAt),
        updatedAt: new Date(result.Item.updatedAt),
        meetingDetails: result.Item.meetingDetails ? {
          ...result.Item.meetingDetails,
          scheduledDate: result.Item.meetingDetails.scheduledDate ? 
            new Date(result.Item.meetingDetails.scheduledDate) : undefined,
          completedAt: result.Item.meetingDetails.completedAt ? 
            new Date(result.Item.meetingDetails.completedAt) : undefined
        } : undefined
      } as BuilderSelection;

      return { success: true, selection };
    } catch (error) {
      console.error('Error getting selection:', error);
      return { success: false, error: 'Failed to get selection' };
    }
  }

  /**
   * Get selection by project ID
   */
  static async getSelectionByProject(projectId: string): Promise<{ 
    success: boolean; 
    selection?: BuilderSelection; 
    error?: string 
  }> {
    try {
      const result = await DynamoDBService.queryItems(
        this.SELECTIONS_TABLE,
        'ProjectIndex',
        { projectId }
      );

      if (!result.Items || result.Items.length === 0) {
        return { success: false, error: 'No selection found for project' };
      }

      // Get the most recent selection
      const latestSelection = result.Items.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      const selection: BuilderSelection = {
        ...latestSelection,
        createdAt: new Date(latestSelection.createdAt),
        updatedAt: new Date(latestSelection.updatedAt),
        meetingDetails: latestSelection.meetingDetails ? {
          ...latestSelection.meetingDetails,
          scheduledDate: latestSelection.meetingDetails.scheduledDate ? 
            new Date(latestSelection.meetingDetails.scheduledDate) : undefined,
          completedAt: latestSelection.meetingDetails.completedAt ? 
            new Date(latestSelection.meetingDetails.completedAt) : undefined
        } : undefined
      } as BuilderSelection;

      return { success: true, selection };
    } catch (error) {
      console.error('Error getting selection by project:', error);
      return { success: false, error: 'Failed to get selection' };
    }
  }

  /**
   * Proceed to contract generation after successful meeting
   */
  static async proceedToContract(selectionId: string): Promise<{ 
    success: boolean; 
    contractId?: string; 
    error?: string 
  }> {
    try {
      const selectionResult = await this.getSelection(selectionId);
      if (!selectionResult.success || !selectionResult.selection) {
        return { success: false, error: 'Selection not found' };
      }

      const selection = selectionResult.selection;
      
      if (selection.status !== 'meeting_approved') {
        return { success: false, error: 'Meeting must be approved before proceeding to contract' };
      }

      // Update selection status
      await DynamoDBService.updateItem(
        this.SELECTIONS_TABLE,
        { id: selectionId },
        {
          status: 'contract_generated',
          updatedAt: new Date().toISOString()
        }
      );

      // Update project status
      await DynamoDBService.updateItem(
        this.PROJECTS_TABLE,
        { id: selection.projectId },
        {
          status: 'contract_generation',
          updatedAt: new Date().toISOString()
        }
      );

      // Contract generation would be handled by a separate service
      const contractId = uuidv4(); // Placeholder

      return { success: true, contractId };
    } catch (error) {
      console.error('Error proceeding to contract:', error);
      return { success: false, error: 'Failed to proceed to contract' };
    }
  }
}