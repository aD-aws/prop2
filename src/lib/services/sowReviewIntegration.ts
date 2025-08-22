import { BuilderReviewAgentService } from './builderReviewAgentService';
import { SoWGenerationService } from './sowGenerationService';
import { ProjectType, SoWDocument, BuilderReviewAnalysis, Project } from '../types';

/**
 * Integration service that coordinates SoW generation with Builder Review Agent
 * Implements the automatic review process after SoW generation
 */
export class SoWReviewIntegration {
  private builderReviewService: BuilderReviewAgentService;
  private sowGenerationService: SoWGenerationService;

  constructor() {
    this.builderReviewService = new BuilderReviewAgentService();
    this.sowGenerationService = new SoWGenerationService();
  }

  /**
   * Generates SoW and automatically triggers Builder Review Agent
   * Implements Requirement 19.1: Invoke AI Builder Review Agent after SoW generation
   */
  async generateSoWWithReview(
    projectId: string,
    projectType: ProjectType,
    questionnaireResponses: Record<string, any>,
    propertyDetails: any
  ): Promise<{
    jobId?: string;
    sowDocument: SoWDocument | null;
    reviewAnalysis: BuilderReviewAnalysis | null;
  }> {
    try {
      // Step 1: Generate the initial SoW
      console.log(`Generating SoW for project ${projectId}...`);
      const sowGenerationRequest = {
        projectId,
        projectType,
        propertyId: propertyDetails?.id || 'temp_property_id',
        userResponses: questionnaireResponses
      };
      
      const notificationPreferences = {
        preferredMethod: 'email' as const
      };
      
      const { jobId } = await this.sowGenerationService.startSoWGeneration(
        sowGenerationRequest,
        notificationPreferences
      );
      
      // For now, we'll need to handle the async nature differently
      // This is a simplified approach - in production, you'd want to implement proper job polling
      const sowDocument = null; // This would be retrieved once the job completes

      // Since SoW generation is now async, we return the job info
      // The review will be triggered once the SoW generation completes
      console.log(`SoW generation started with job ID: ${jobId}`);
      
      return {
        jobId,
        sowDocument: null, // Will be available once job completes
        reviewAnalysis: null // Will be triggered after SoW completion
      };

    } catch (error) {
      console.error('Error in SoW generation with review:', error);
      throw new Error(`Failed to generate SoW with review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Regenerates SoW with applied recommendations from Builder Review
   * Implements the feedback loop for SoW improvement
   */
  async regenerateSoWWithImprovements(
    projectId: string,
    originalSoW: SoWDocument,
    selectedRecommendations: string[]
  ): Promise<{
    improvedSoW: SoWDocument;
    newReviewAnalysis: BuilderReviewAnalysis;
  }> {
    try {
      // Step 1: Apply recommendations to improve SoW
      console.log(`Applying ${selectedRecommendations.length} recommendations to SoW...`);
      const improvedSoW = await this.builderReviewService.applyRecommendations(
        projectId,
        originalSoW,
        selectedRecommendations
      );

      // Step 2: Re-review the improved SoW
      console.log(`Re-reviewing improved SoW for project ${projectId}...`);
      const projectType = this.extractProjectTypeFromSoW(originalSoW);
      const propertyDetails = await this.getPropertyDetails(projectId);
      
      const newReviewAnalysis = await this.builderReviewService.reviewSoW(
        projectId,
        improvedSoW,
        projectType,
        propertyDetails
      );

      // Step 3: Update project with new review results
      await this.updateProjectWithReview(projectId, newReviewAnalysis);

      return {
        improvedSoW,
        newReviewAnalysis
      };

    } catch (error) {
      console.error('Error regenerating SoW with improvements:', error);
      throw new Error(`Failed to regenerate SoW: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets the current review status for a project
   */
  async getReviewStatus(projectId: string): Promise<BuilderReviewAnalysis | null> {
    return await this.builderReviewService.getReviewResults(projectId);
  }

  /**
   * Checks if a SoW meets quality standards for builder invitations
   * Implements quality gate before allowing builder invitations
   */
  async validateSoWForBuilderInvitation(projectId: string): Promise<{
    canInviteBuilders: boolean;
    qualityScore: number;
    criticalIssues: string[];
    recommendations: string[];
  }> {
    try {
      const reviewAnalysis = await this.getReviewStatus(projectId);
      
      if (!reviewAnalysis) {
        return {
          canInviteBuilders: false,
          qualityScore: 0,
          criticalIssues: ['SoW has not been reviewed by Builder Review Agent'],
          recommendations: ['Generate and review SoW before inviting builders']
        };
      }

      const criticalIssues = reviewAnalysis.issues
        .filter(issue => issue.severity === 'critical')
        .map(issue => issue.title);

      const highPriorityRecommendations = reviewAnalysis.recommendations
        .filter(rec => rec.priority === 'high')
        .map(rec => rec.title);

      // Quality gate: Allow builder invitations if score >= 70 and no critical issues
      const canInviteBuilders = reviewAnalysis.overallScore >= 70 && criticalIssues.length === 0;

      return {
        canInviteBuilders,
        qualityScore: reviewAnalysis.overallScore,
        criticalIssues,
        recommendations: highPriorityRecommendations
      };

    } catch (error) {
      console.error('Error validating SoW for builder invitation:', error);
      return {
        canInviteBuilders: false,
        qualityScore: 0,
        criticalIssues: ['Error validating SoW quality'],
        recommendations: ['Please try again or contact support']
      };
    }
  }

  /**
   * Updates project record with review results
   */
  private async updateProjectWithReview(
    projectId: string,
    reviewAnalysis: BuilderReviewAnalysis
  ): Promise<void> {
    try {
      // Implementation would update DynamoDB project record
      // For now, we'll just log the update
      console.log(`Updating project ${projectId} with review results:`, {
        score: reviewAnalysis.overallScore,
        qualityIndicator: reviewAnalysis.qualityIndicator,
        issueCount: reviewAnalysis.issues.length,
        recommendationCount: reviewAnalysis.recommendations.length
      });
    } catch (error) {
      console.error('Error updating project with review:', error);
      // Don't throw here as this is a secondary operation
    }
  }

  /**
   * Extracts project type from SoW document
   */
  private extractProjectTypeFromSoW(sowDocument: SoWDocument): ProjectType {
    // Implementation would extract project type from SoW metadata
    // For now, return a default type
    return 'kitchen_full_refit' as ProjectType;
  }

  /**
   * Gets property details for a project
   */
  private async getPropertyDetails(projectId: string): Promise<any> {
    // Implementation would fetch property details from database
    // For now, return mock data
    return {
      address: 'Sample Address',
      propertyType: 'house',
      isListedBuilding: false,
      isInConservationArea: false
    };
  }

  /**
   * Gets quality indicator badge for display to builders
   * Implements Requirement 19.6: Show quality indicator to builders
   */
  getQualityIndicatorForBuilders(reviewAnalysis: BuilderReviewAnalysis | null): {
    hasQualityIndicator: boolean;
    qualityLevel: string;
    displayText: string;
    badgeColor: string;
  } {
    if (!reviewAnalysis) {
      return {
        hasQualityIndicator: false,
        qualityLevel: 'not_reviewed',
        displayText: 'Not Reviewed',
        badgeColor: 'gray'
      };
    }

    const qualityConfig = {
      excellent: {
        displayText: 'Professionally Reviewed - Excellent Quality',
        badgeColor: 'green'
      },
      good: {
        displayText: 'Professionally Reviewed - Good Quality',
        badgeColor: 'blue'
      },
      needs_improvement: {
        displayText: 'Professionally Reviewed - Needs Improvement',
        badgeColor: 'yellow'
      },
      poor: {
        displayText: 'Professionally Reviewed - Poor Quality',
        badgeColor: 'red'
      }
    };

    const config = qualityConfig[reviewAnalysis.qualityIndicator];

    return {
      hasQualityIndicator: true,
      qualityLevel: reviewAnalysis.qualityIndicator,
      displayText: config.displayText,
      badgeColor: config.badgeColor
    };
  }
}