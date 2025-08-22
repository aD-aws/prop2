import { AIAgentService } from './aiAgentService';
import { PromptManager } from './promptManager';
import { ProjectType, SoWDocument, BuilderReviewResult, BuilderReviewIssue, BuilderReviewRecommendation, ProjectContext, Property } from '../types';

export interface BuilderReviewAnalysis {
  overallScore: number; // 0-100 quality score
  issues: BuilderReviewIssue[];
  recommendations: BuilderReviewRecommendation[];
  missingElements: string[];
  unrealisticSpecifications: string[];
  regulatoryIssues: string[];
  costAccuracyIssues: string[];
  materialImprovements: string[];
  timelineIssues: string[];
  qualityIndicator: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  reviewedAt: Date;
  reviewAgentType: string;
}



export class BuilderReviewAgentService {
  private aiAgentService: AIAgentService;
  private promptManager: PromptManager;

  constructor() {
    this.aiAgentService = new AIAgentService();
    this.promptManager = new PromptManager();
  }

  /**
   * Reviews a SoW using specialized AI Builder Review Agent for the project type
   */
  async reviewSoW(
    projectId: string,
    sowDocument: SoWDocument,
    projectType: ProjectType,
    propertyDetails: any
  ): Promise<BuilderReviewAnalysis> {
    try {
      // Select appropriate Builder Review Agent based on project type
      const reviewAgentType = this.selectReviewAgent(projectType);
      
      // Get specialized prompt for this project type
      const reviewPrompt = await this.promptManager.getPrompt(
        `builder-review-${reviewAgentType}`
      );

      // Prepare context for AI review
      const reviewContext: ProjectContext = {
        projectId: sowDocument.projectId,
        projectType,
        property: {
          id: 'temp-property-id',
          address: propertyDetails,
          councilArea: 'Unknown',
          isListedBuilding: false,
          isInConservationArea: false,
          planningHistory: [],
          buildingRegulations: []
        },
        userResponses: {
          sowDocument,
          propertyDetails,
          reviewFocus: this.getReviewFocus(projectType)
        },
        previousAgentResponses: []
      };

      // Invoke AI Builder Review Agent
      const aiResponse = await this.aiAgentService.invokeAgent({
        agentId: `builder-review-${reviewAgentType}`,
        context: reviewContext,
        requestType: 'analyze_project',
        additionalData: {
          prompt: reviewPrompt?.template || 'Review the SoW document for quality and completeness'
        }
      });

      // Parse and structure the review results
      const analysis = await this.parseReviewResponse(aiResponse, reviewAgentType);

      // Store review results
      await this.storeReviewResults(projectId, analysis);

      return analysis;

    } catch (error) {
      console.error('Error in SoW review:', error);
      throw new Error(`Failed to review SoW: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Selects the appropriate Builder Review Agent based on project type
   */
  private selectReviewAgent(projectType: ProjectType): string {
    const agentMapping: Record<string, string> = {
      // Structural Extensions & Conversions
      'loft_conversion_dormer': 'structural-conversion',
      'loft_conversion_hip_to_gable': 'structural-conversion',
      'loft_conversion_mansard': 'structural-conversion',
      'loft_conversion_velux': 'structural-conversion',
      'loft_conversion_roof_light': 'structural-conversion',
      'rear_extension_single_storey': 'extension',
      'rear_extension_double_storey': 'extension',
      'rear_extension_wrap_around': 'extension',
      'rear_extension_glass_box': 'extension',
      'side_extension_single_storey': 'extension',
      'side_extension_double_storey': 'extension',
      'side_extension_infill': 'extension',
      'basement_conversion_full': 'structural-conversion',
      'basement_conversion_partial': 'structural-conversion',
      'garage_conversion_living_space': 'conversion',
      'garage_conversion_office': 'conversion',
      'garage_conversion_gym': 'conversion',
      'garage_conversion_studio': 'conversion',

      // Room-Specific Renovations
      'kitchen_full_refit': 'kitchen',
      'kitchen_partial_upgrade': 'kitchen',
      'kitchen_island_installation': 'kitchen',
      'kitchen_galley': 'kitchen',
      'kitchen_l_shaped': 'kitchen',
      'kitchen_u_shaped': 'kitchen',
      'bathroom_full_refit': 'bathroom',
      'bathroom_shower_room': 'bathroom',
      'bathroom_ensuite': 'bathroom',
      'bathroom_downstairs_wc': 'bathroom',
      'bathroom_wet_room': 'bathroom',
      'bathroom_family': 'bathroom',

      // External & Structural Work
      'roofing_re_roofing': 'roofing',
      'roofing_repairs': 'roofing',
      'roofing_flat_replacement': 'roofing',
      'windows_upvc': 'windows-doors',
      'windows_timber': 'windows-doors',
      'windows_aluminium': 'windows-doors',
      'doors_bifold': 'windows-doors',
      'doors_sliding': 'windows-doors',
      'doors_french': 'windows-doors',

      // Systems & Infrastructure
      'electrical_rewiring': 'electrical',
      'electrical_consumer_unit': 'electrical',
      'electrical_ev_charging': 'electrical',
      'plumbing_bathroom': 'plumbing',
      'plumbing_kitchen': 'plumbing',
      'plumbing_water_pressure': 'plumbing',
      'heating_boiler_replacement': 'mechanical',
      'heating_radiator_upgrade': 'mechanical',
      'heating_underfloor': 'mechanical',
      'heating_heat_pump': 'mechanical'
    };

    return agentMapping[projectType] || 'general';
  }

  /**
   * Gets review focus areas based on project type
   */
  private getReviewFocus(projectType: ProjectType): string[] {
    const focusAreas: Record<string, string[]> = {
      'loft_conversion_dormer': [
        'structural_calculations',
        'building_regulations',
        'fire_safety',
        'insulation_standards',
        'staircase_regulations',
        'head_height_requirements'
      ],
      'kitchen_full_refit': [
        'electrical_safety',
        'plumbing_compliance',
        'ventilation_requirements',
        'gas_safety',
        'worktop_specifications',
        'appliance_integration'
      ],
      'bathroom_full_refit': [
        'waterproofing',
        'electrical_zones',
        'ventilation',
        'drainage_falls',
        'accessibility_compliance',
        'heating_requirements'
      ],
      'rear_extension_single_storey': [
        'planning_permission',
        'building_regulations',
        'structural_integrity',
        'thermal_bridging',
        'drainage_requirements',
        'party_wall_agreements'
      ]
    };

    return focusAreas[projectType] || [
      'building_regulations',
      'health_safety',
      'material_specifications',
      'work_sequencing',
      'cost_accuracy'
    ];
  }

  /**
   * Parses AI response and structures review analysis
   */
  private async parseReviewResponse(
    aiResponse: any,
    reviewAgentType: string
  ): Promise<BuilderReviewAnalysis> {
    const response = JSON.parse(aiResponse.content);

    const issues: BuilderReviewIssue[] = response.issues?.map((issue: any) => ({
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: issue.category,
      severity: issue.severity,
      title: issue.title,
      description: issue.description,
      location: issue.location,
      impact: issue.impact
    })) || [];

    const recommendations: BuilderReviewRecommendation[] = response.recommendations?.map((rec: any) => ({
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      issueId: rec.issueId || '',
      type: rec.type,
      title: rec.title,
      description: rec.description,
      suggestedText: rec.suggestedText,
      reasoning: rec.reasoning,
      priority: rec.priority
    })) || [];

    // Calculate overall quality score based on issues
    const overallScore = this.calculateQualityScore(issues);
    const qualityIndicator = this.getQualityIndicator(overallScore);

    return {
      overallScore,
      issues,
      recommendations,
      missingElements: response.missingElements || [],
      unrealisticSpecifications: response.unrealisticSpecifications || [],
      regulatoryIssues: response.regulatoryIssues || [],
      costAccuracyIssues: response.costAccuracyIssues || [],
      materialImprovements: response.materialImprovements || [],
      timelineIssues: response.timelineIssues || [],
      qualityIndicator,
      reviewedAt: new Date(),
      reviewAgentType
    };
  }

  /**
   * Calculates quality score based on identified issues
   */
  private calculateQualityScore(issues: BuilderReviewIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Gets quality indicator based on score
   */
  private getQualityIndicator(score: number): 'excellent' | 'good' | 'needs_improvement' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'needs_improvement';
    return 'poor';
  }

  /**
   * Stores review results in database
   */
  private async storeReviewResults(
    projectId: string,
    analysis: BuilderReviewAnalysis
  ): Promise<void> {
    // Implementation would store in DynamoDB
    // For now, we'll just log the storage action
    console.log(`Storing review results for project ${projectId}:`, {
      score: analysis.overallScore,
      issueCount: analysis.issues.length,
      recommendationCount: analysis.recommendations.length,
      qualityIndicator: analysis.qualityIndicator
    });
  }

  /**
   * Retrieves stored review results for a project
   */
  async getReviewResults(projectId: string): Promise<BuilderReviewAnalysis | null> {
    try {
      // Implementation would retrieve from DynamoDB
      // For now, return null to indicate no stored results
      return null;
    } catch (error) {
      console.error('Error retrieving review results:', error);
      return null;
    }
  }

  /**
   * Applies review recommendations to regenerate improved SoW
   */
  async applyRecommendations(
    projectId: string,
    sowDocument: SoWDocument,
    selectedRecommendations: string[]
  ): Promise<SoWDocument> {
    try {
      const reviewResults = await this.getReviewResults(projectId);
      if (!reviewResults) {
        throw new Error('No review results found for project');
      }

      // Filter recommendations to apply
      const recommendationsToApply = reviewResults.recommendations.filter(
        rec => selectedRecommendations.includes(rec.id)
      );

      // Generate improved SoW using AI with recommendations
      const improvementPrompt = await this.promptManager.getPrompt(
        'sow-improvement'
      );

      // Create a minimal ProjectContext - we'll put the improvement data in additionalData
      const projectContext = {
        projectId,
        projectType: 'others' as ProjectType, // Default since we don't have this info
        property: {} as Property, // Empty property object
        userResponses: {},
        previousAgentResponses: []
      };

      const aiResponse = await this.aiAgentService.invokeAgent({
        agentId: 'sow-improvement',
        context: projectContext,
        requestType: 'generate_sow',
        additionalData: { 
          prompt: improvementPrompt,
          originalSoW: sowDocument,
          recommendations: recommendationsToApply,
          reviewAnalysis: reviewResults
        }
      });

      // Parse improved SoW
      const improvedSoW = JSON.parse(aiResponse.response);

      return {
        ...sowDocument,
        ...improvedSoW,
        version: sowDocument.version + 0.1,
        lastModified: new Date(),
        reviewApplied: true,
        appliedRecommendations: selectedRecommendations
      };

    } catch (error) {
      console.error('Error applying recommendations:', error);
      throw new Error(`Failed to apply recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}