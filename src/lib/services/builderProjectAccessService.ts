// Builder project access service for viewing SoW and managing project access

import { DynamoDBService } from '@/lib/aws/dynamodb';
import { Project, SoWDocument, BuilderInvitation } from '@/lib/types';
import { InvitationService } from './invitationService';

export interface BuilderProjectAccess {
  projectId: string;
  builderId: string;
  accessGrantedAt: Date;
  invitationCode?: string;
  canViewSoW: boolean;
  canSubmitQuote: boolean;
  hasSubmittedQuote: boolean;
  quoteId?: string;
}

export class BuilderProjectAccessService {
  private static readonly PROJECTS_TABLE = 'uk-home-improvement-projects';
  private static readonly BUILDER_ACCESS_TABLE = 'uk-home-improvement-builder-access';

  /**
   * Grant builder access to project using invitation code
   */
  static async grantProjectAccess(
    invitationCode: string,
    builderId: string
  ): Promise<{ success: boolean; projectId?: string; error?: string }> {
    try {
      // Validate invitation code
      const validation = await InvitationService.validateInvitationCode(invitationCode);
      
      if (!validation.success || !validation.invitation) {
        return { success: false, error: validation.error };
      }

      const invitation = validation.invitation;

      // Check if builder already has access to this project
      const existingAccess = await this.getBuilderProjectAccess(builderId, invitation.projectId);
      
      if (existingAccess.success && existingAccess.access) {
        return { success: true, projectId: invitation.projectId };
      }

      // Mark invitation as used
      await InvitationService.useInvitationCode(invitationCode, builderId);

      // Create builder access record
      const access: BuilderProjectAccess = {
        projectId: invitation.projectId,
        builderId,
        accessGrantedAt: new Date(),
        invitationCode,
        canViewSoW: true,
        canSubmitQuote: true,
        hasSubmittedQuote: false,
      };

      await DynamoDBService.putItem(this.BUILDER_ACCESS_TABLE, {
        ...access,
        accessGrantedAt: access.accessGrantedAt.toISOString(),
        // Composite key for querying
        builderProjectKey: `${builderId}#${invitation.projectId}`,
      });

      // Update project with builder invitation status
      await this.updateProjectBuilderStatus(invitation.projectId, builderId, 'accessed');

      return { success: true, projectId: invitation.projectId };
    } catch (error) {
      console.error('Error granting project access:', error);
      return { success: false, error: 'Failed to grant project access' };
    }
  }

  /**
   * Get builder's access to a specific project
   */
  static async getBuilderProjectAccess(
    builderId: string,
    projectId: string
  ): Promise<{ success: boolean; access?: BuilderProjectAccess; error?: string }> {
    try {
      const result = await DynamoDBService.getItem(this.BUILDER_ACCESS_TABLE, {
        builderProjectKey: `${builderId}#${projectId}`,
      });

      if (!result.Item) {
        return { success: false, error: 'Access not found' };
      }

      const access: BuilderProjectAccess = {
        ...result.Item,
        accessGrantedAt: new Date(result.Item.accessGrantedAt),
      } as BuilderProjectAccess;

      return { success: true, access };
    } catch (error) {
      console.error('Error getting builder project access:', error);
      return { success: false, error: 'Failed to get project access' };
    }
  }

  /**
   * Get all projects accessible by a builder
   */
  static async getBuilderAccessibleProjects(
    builderId: string
  ): Promise<{ success: boolean; projects?: Project[]; error?: string }> {
    try {
      // Get all access records for the builder
      const accessResult = await DynamoDBService.queryItems(
        this.BUILDER_ACCESS_TABLE,
        'BuilderIndex',
        { builderId }
      );

      if (!accessResult.Items || accessResult.Items.length === 0) {
        return { success: true, projects: [] };
      }

      // Get project details for each accessible project
      const projectIds = accessResult.Items.map(item => item.projectId);
      const projects: Project[] = [];

      for (const projectId of projectIds) {
        const projectResult = await DynamoDBService.getItem(this.PROJECTS_TABLE, { id: projectId });
        
        if (projectResult.Item) {
          const project: Project = {
            ...projectResult.Item,
            createdAt: new Date(projectResult.Item.createdAt),
            updatedAt: new Date(projectResult.Item.updatedAt),
            timeline: {
              ...projectResult.Item.timeline,
              estimatedStartDate: projectResult.Item.timeline?.estimatedStartDate 
                ? new Date(projectResult.Item.timeline.estimatedStartDate) 
                : undefined,
              estimatedEndDate: projectResult.Item.timeline?.estimatedEndDate 
                ? new Date(projectResult.Item.timeline.estimatedEndDate) 
                : undefined,
              actualStartDate: projectResult.Item.timeline?.actualStartDate 
                ? new Date(projectResult.Item.timeline.actualStartDate) 
                : undefined,
              actualEndDate: projectResult.Item.timeline?.actualEndDate 
                ? new Date(projectResult.Item.timeline.actualEndDate) 
                : undefined,
              milestones: projectResult.Item.timeline?.milestones?.map((milestone: any) => ({
                ...milestone,
                targetDate: new Date(milestone.targetDate),
                actualDate: milestone.actualDate ? new Date(milestone.actualDate) : undefined,
              })) || []
            }
          } as Project;

          projects.push(project);
        }
      }

      return { success: true, projects };
    } catch (error) {
      console.error('Error getting builder accessible projects:', error);
      return { success: false, error: 'Failed to get accessible projects' };
    }
  }

  /**
   * Get project SoW for builder (without cost estimates)
   */
  static async getProjectSoWForBuilder(
    builderId: string,
    projectId: string
  ): Promise<{ success: boolean; sowDocument?: SoWDocument; project?: Project; error?: string }> {
    try {
      // Verify builder has access to this project
      const accessResult = await this.getBuilderProjectAccess(builderId, projectId);
      
      if (!accessResult.success || !accessResult.access?.canViewSoW) {
        return { success: false, error: 'Access denied to project SoW' };
      }

      // Get project details
      const projectResult = await DynamoDBService.getItem(this.PROJECTS_TABLE, { id: projectId });
      
      if (!projectResult.Item) {
        return { success: false, error: 'Project not found' };
      }

      const project: Project = {
        ...projectResult.Item,
        createdAt: new Date(projectResult.Item.createdAt),
        updatedAt: new Date(projectResult.Item.updatedAt),
        timeline: {
          ...projectResult.Item.timeline,
          estimatedStartDate: projectResult.Item.timeline?.estimatedStartDate 
            ? new Date(projectResult.Item.timeline.estimatedStartDate) 
            : undefined,
          estimatedEndDate: projectResult.Item.timeline?.estimatedEndDate 
            ? new Date(projectResult.Item.timeline.estimatedEndDate) 
            : undefined,
          actualStartDate: projectResult.Item.timeline?.actualStartDate 
            ? new Date(projectResult.Item.timeline.actualStartDate) 
            : undefined,
          actualEndDate: projectResult.Item.timeline?.actualEndDate 
            ? new Date(projectResult.Item.timeline.actualEndDate) 
            : undefined,
          milestones: projectResult.Item.timeline?.milestones?.map((milestone: any) => ({
            ...milestone,
            targetDate: new Date(milestone.targetDate),
            actualDate: milestone.actualDate ? new Date(milestone.actualDate) : undefined,
          })) || []
        }
      } as Project;

      let sowDocument = project.sowDocument;

      // Remove cost estimates from SoW for builders
      if (sowDocument) {
        sowDocument = {
          ...sowDocument,
          estimatedCosts: {
            ...sowDocument.estimatedCosts,
            totalEstimate: 0,
            laborCosts: 0,
            materialCosts: 0,
            builderMaterials: 0,
            homeownerMaterials: 0,
            breakdown: []
          },
          materials: sowDocument.materials.map(material => ({
            ...material,
            estimatedCost: undefined
          })),
          laborRequirements: sowDocument.laborRequirements.map(labor => ({
            ...labor,
            estimatedCost: undefined
          }))
        };
      }

      return { success: true, sowDocument, project };
    } catch (error) {
      console.error('Error getting project SoW for builder:', error);
      return { success: false, error: 'Failed to get project SoW' };
    }
  }

  /**
   * Update builder's quote submission status
   */
  static async updateBuilderQuoteStatus(
    builderId: string,
    projectId: string,
    quoteId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update builder access record
      await DynamoDBService.updateItem(
        this.BUILDER_ACCESS_TABLE,
        { builderProjectKey: `${builderId}#${projectId}` },
        {
          hasSubmittedQuote: true,
          quoteId,
        }
      );

      // Update project builder status
      await this.updateProjectBuilderStatus(projectId, builderId, 'quoted', quoteId);

      return { success: true };
    } catch (error) {
      console.error('Error updating builder quote status:', error);
      return { success: false, error: 'Failed to update quote status' };
    }
  }

  /**
   * Check if builder can access project without invitation code
   */
  static async canBuilderAccessProject(
    builderId: string,
    projectId: string
  ): Promise<{ success: boolean; canAccess?: boolean; error?: string }> {
    try {
      const accessResult = await this.getBuilderProjectAccess(builderId, projectId);
      return { success: true, canAccess: accessResult.success };
    } catch (error) {
      console.error('Error checking builder project access:', error);
      return { success: false, error: 'Failed to check project access' };
    }
  }

  /**
   * Update project builder invitation status
   */
  private static async updateProjectBuilderStatus(
    projectId: string,
    builderId: string,
    status: 'invited' | 'accessed' | 'quoted' | 'selected' | 'rejected',
    quoteId?: string
  ): Promise<void> {
    try {
      const projectResult = await DynamoDBService.getItem(this.PROJECTS_TABLE, { id: projectId });
      
      if (projectResult.Item) {
        const invitedBuilders = projectResult.Item.invitedBuilders || [];
        
        const updatedInvitedBuilders = invitedBuilders.map((invitation: BuilderInvitation) => {
          if (invitation.builderId === builderId) {
            return {
              ...invitation,
              status,
              accessedAt: status === 'accessed' ? new Date().toISOString() : invitation.accessedAt,
              quoteSubmitted: status === 'quoted',
              quoteId: quoteId || invitation.quoteId,
            };
          }
          return invitation;
        });

        await DynamoDBService.updateItem(
          this.PROJECTS_TABLE,
          { id: projectId },
          { invitedBuilders: updatedInvitedBuilders }
        );
      }
    } catch (error) {
      console.error('Error updating project builder status:', error);
    }
  }
}