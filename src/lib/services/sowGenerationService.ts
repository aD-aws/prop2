import { 
  ProjectType, 
  ProjectContext, 
  SoWDocument, 
  GanttChart,
  MaterialSpecification,
  LaborRequirement,
  TaskTimeline,
  SoWSection,
  CostBreakdown
} from '../types';
import { aiService, SoWGenerationRequest, SoWGenerationResult } from './aiService';
import { materialClassificationService } from './materialClassificationService';
import { laborCostService } from './laborCostService';

export interface SoWGenerationJob {
  id: string;
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletionTime: Date;
  result?: SoWGenerationResult;
  error?: string;
  notificationsSent: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  };
}

export interface SoWModificationRequest {
  projectId: string;
  sowId: string;
  modifications: {
    sections?: Partial<SoWSection>[];
    materials?: Partial<MaterialSpecification>[];
    laborRequirements?: Partial<LaborRequirement>[];
    timeline?: Partial<TaskTimeline>[];
    userResponses?: Record<string, any>;
  };
  reason: string;
}

export interface NotificationPreferences {
  email?: string;
  sms?: string;
  whatsapp?: string;
  preferredMethod: 'email' | 'sms' | 'whatsapp';
}

export class SoWGenerationService {
  private activeJobs = new Map<string, SoWGenerationJob>();
  private readonly ESTIMATED_PROCESSING_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Start asynchronous SoW generation
   */
  async startSoWGeneration(
    request: SoWGenerationRequest,
    notifications: NotificationPreferences
  ): Promise<{ jobId: string; estimatedCompletionTime: Date }> {
    const jobId = `sow_job_${request.projectId}_${Date.now()}`;
    const startedAt = new Date();
    const estimatedCompletionTime = new Date(startedAt.getTime() + this.ESTIMATED_PROCESSING_TIME);

    const job: SoWGenerationJob = {
      id: jobId,
      projectId: request.projectId,
      status: 'queued',
      progress: 0,
      startedAt,
      estimatedCompletionTime,
      notificationsSent: {}
    };

    this.activeJobs.set(jobId, job);

    // Start processing asynchronously
    this.processSoWGeneration(jobId, request, notifications).catch(error => {
      console.error(`SoW generation job ${jobId} failed:`, error);
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    });

    return {
      jobId,
      estimatedCompletionTime
    };
  }

  /**
   * Get SoW generation job status
   */
  getJobStatus(jobId: string): SoWGenerationJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Process SoW generation with progress tracking
   */
  private async processSoWGeneration(
    jobId: string,
    request: SoWGenerationRequest,
    notifications: NotificationPreferences
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      job.progress = 5;

      // Phase 1: Initialize AI agents (5-15%)
      await this.updateProgress(jobId, 10, 'Initializing AI agents...');
      await aiService.initialize();

      // Phase 2: Generate base SoW (15-40%)
      await this.updateProgress(jobId, 20, 'Analyzing project requirements...');
      const baseSoWResult = await aiService.generateSoW(request);
      
      await this.updateProgress(jobId, 35, 'Generating scope of work...');

      // Phase 3: Classify materials (40-55%)
      await this.updateProgress(jobId, 45, 'Classifying materials and supplies...');
      const classifiedMaterials = await materialClassificationService.classifyMaterials(
        baseSoWResult.sowDocument.materials,
        request.projectType
      );

      // Phase 4: Calculate labor costs (55-70%)
      await this.updateProgress(jobId, 60, 'Calculating labor costs and timelines...');
      const laborCosts = await laborCostService.calculateLaborCosts(
        baseSoWResult.sowDocument.laborRequirements,
        request.projectType,
        request.userResponses
      );

      // Phase 5: Generate detailed cost breakdown (70-85%)
      await this.updateProgress(jobId, 75, 'Generating detailed cost breakdown...');
      const costBreakdown = await this.generateCostBreakdown(
        classifiedMaterials,
        laborCosts,
        request.userResponses
      );

      // Phase 6: Optimize timeline and generate Gantt chart (85-95%)
      await this.updateProgress(jobId, 90, 'Optimizing project timeline...');
      const optimizedGantt = await this.optimizeGanttChart(
        baseSoWResult.ganttChart,
        laborCosts,
        request.userResponses
      );

      // Phase 7: Finalize SoW document (95-100%)
      await this.updateProgress(jobId, 95, 'Finalizing scope of work document...');
      const finalSoW = await this.finalizeSoWDocument(
        baseSoWResult.sowDocument,
        classifiedMaterials,
        laborCosts,
        costBreakdown
      );

      // Complete the job
      const result: SoWGenerationResult = {
        sowDocument: finalSoW,
        ganttChart: optimizedGantt,
        processingTime: Date.now() - job.startedAt.getTime(),
        agentsUsed: baseSoWResult.agentsUsed,
        orchestrationId: baseSoWResult.orchestrationId
      };

      job.result = result;
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();

      // Send completion notifications
      await this.sendCompletionNotifications(jobId, notifications);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = new Date();
      
      // Send failure notifications
      await this.sendFailureNotifications(jobId, notifications, job.error);
    }
  }

  /**
   * Update job progress
   */
  private async updateProgress(jobId: string, progress: number, message: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.progress = progress;
      console.log(`Job ${jobId}: ${progress}% - ${message}`);
    }
  }

  /**
   * Generate detailed cost breakdown
   */
  private async generateCostBreakdown(
    materials: MaterialSpecification[],
    laborRequirements: LaborRequirement[],
    userResponses: Record<string, any>
  ): Promise<CostBreakdown> {
    const builderMaterials = materials.filter(m => m.category === 'builder_provided');
    const homeownerMaterials = materials.filter(m => m.category === 'homeowner_provided');

    const builderMaterialsCost = builderMaterials.reduce((sum, m) => sum + (m.estimatedCost || 0), 0);
    const homeownerMaterialsCost = homeownerMaterials.reduce((sum, m) => sum + (m.estimatedCost || 0), 0);
    const laborCosts = laborRequirements.reduce((sum, l) => sum + (l.estimatedCost || 0), 0);

    const breakdown = [
      {
        category: 'Labor',
        description: 'All labor costs including trades and specialists',
        amount: laborCosts
      },
      {
        category: 'Builder Materials',
        description: 'Materials provided by builder (first fix)',
        amount: builderMaterialsCost
      },
      {
        category: 'Homeowner Materials',
        description: 'Materials selected and provided by homeowner (second fix)',
        amount: homeownerMaterialsCost
      }
    ];

    return {
      totalEstimate: laborCosts + builderMaterialsCost + homeownerMaterialsCost,
      laborCosts,
      materialCosts: builderMaterialsCost + homeownerMaterialsCost,
      builderMaterials: builderMaterialsCost,
      homeownerMaterials: homeownerMaterialsCost,
      breakdown
    };
  }

  /**
   * Optimize Gantt chart with labor and material considerations
   */
  private async optimizeGanttChart(
    baseGantt: GanttChart,
    laborRequirements: LaborRequirement[],
    userResponses: Record<string, any>
  ): Promise<GanttChart> {
    try {
      // Import timeline optimization service
      const { timelineOptimizationService } = await import('./timelineOptimizationService');
      
      // Convert Gantt tasks to TaskTimeline format
      const tasks = baseGantt.tasks.map(task => ({
        id: task.id,
        name: task.name,
        description: `${task.trade} work`,
        duration: task.duration,
        dependencies: task.dependencies,
        canRunInParallel: true, // Default to true, will be analyzed by optimizer
        trade: task.trade
      }));

      // Create optimization request
      const optimizationRequest = {
        projectId: baseGantt.projectId,
        projectType: 'others' as any, // Will be determined from context
        tasks,
        laborRequirements,
        constraints: {
          workingDaysPerWeek: 5,
          availableStartDate: new Date()
        },
        userPreferences: {
          prioritizeSpeed: true,
          prioritizeCost: false,
          minimizeDisruption: false
        }
      };

      // Optimize timeline
      const optimizationResult = await timelineOptimizationService.optimizeTimeline(optimizationRequest);
      
      // Return the optimized Gantt chart
      return optimizationResult.ganttChart;
      
    } catch (error) {
      console.warn('Timeline optimization failed, using basic Gantt chart:', error);
      
      // Fallback to basic optimization
      const optimizedTasks = baseGantt.tasks.map(task => ({
        ...task,
        progress: 0 // Reset progress for new project
      }));

      return {
        ...baseGantt,
        tasks: optimizedTasks,
        totalDuration: Math.max(...optimizedTasks.map(t => t.duration)),
        generatedAt: new Date()
      };
    }
  }

  /**
   * Finalize SoW document with all calculated data
   */
  private async finalizeSoWDocument(
    baseSoW: SoWDocument,
    materials: MaterialSpecification[],
    laborRequirements: LaborRequirement[],
    costBreakdown: CostBreakdown
  ): Promise<SoWDocument> {
    return {
      ...baseSoW,
      materials,
      laborRequirements,
      estimatedCosts: costBreakdown,
      version: 1,
      generatedAt: new Date()
    };
  }

  /**
   * Modify existing SoW and regenerate
   */
  async modifySoW(modificationRequest: SoWModificationRequest): Promise<{ jobId: string; estimatedCompletionTime: Date }> {
    // Create a new generation request based on modifications
    const originalSoW = await this.getSoWDocument(modificationRequest.sowId);
    if (!originalSoW) {
      throw new Error('Original SoW document not found');
    }

    const modifiedRequest: SoWGenerationRequest = {
      projectId: modificationRequest.projectId,
      projectType: 'others', // Will be determined from existing data
      propertyId: '', // Would be fetched from project
      userResponses: {
        ...originalSoW.sections.reduce((acc, section) => ({ ...acc, [section.id]: section }), {}),
        ...modificationRequest.modifications.userResponses
      }
    };

    // Start new generation job
    return this.startSoWGeneration(modifiedRequest, {
      preferredMethod: 'email' // Default notification method
    });
  }

  /**
   * Get SoW document by ID
   */
  private async getSoWDocument(sowId: string): Promise<SoWDocument | null> {
    // This would fetch from database
    // For testing, return a mock document
    if (sowId.startsWith('test-sow')) {
      return {
        id: sowId,
        projectId: 'test-project',
        version: 1,
        sections: [],
        materials: [],
        laborRequirements: [],
        timeline: [],
        estimatedCosts: {
          totalEstimate: 25000,
          laborCosts: 15000,
          materialCosts: 10000,
          builderMaterials: 6000,
          homeownerMaterials: 4000,
          breakdown: []
        },
        regulatoryRequirements: [],
        generatedAt: new Date()
      };
    }
    return null;
  }

  /**
   * Send completion notifications
   */
  private async sendCompletionNotifications(
    jobId: string,
    notifications: NotificationPreferences
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      // Email notification
      if (notifications.email && (notifications.preferredMethod === 'email' || !job.notificationsSent.email)) {
        await this.sendEmailNotification(notifications.email, job, 'completed');
        job.notificationsSent.email = true;
      }

      // SMS notification
      if (notifications.sms && (notifications.preferredMethod === 'sms' || !job.notificationsSent.sms)) {
        await this.sendSMSNotification(notifications.sms, job, 'completed');
        job.notificationsSent.sms = true;
      }

      // WhatsApp notification
      if (notifications.whatsapp && (notifications.preferredMethod === 'whatsapp' || !job.notificationsSent.whatsapp)) {
        await this.sendWhatsAppNotification(notifications.whatsapp, job, 'completed');
        job.notificationsSent.whatsapp = true;
      }
    } catch (error) {
      console.error('Error sending completion notifications:', error);
    }
  }

  /**
   * Send failure notifications
   */
  private async sendFailureNotifications(
    jobId: string,
    notifications: NotificationPreferences,
    error: string
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      if (notifications.email) {
        await this.sendEmailNotification(notifications.email, job, 'failed', error);
      }
    } catch (notificationError) {
      console.error('Error sending failure notifications:', notificationError);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    job: SoWGenerationJob,
    status: 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    // This would integrate with email service (SES, SendGrid, etc.)
    console.log(`Sending email to ${email}: SoW generation ${status} for job ${job.id}`);
    
    if (status === 'completed') {
      console.log('Email content: Your detailed SoW and Gantt chart are ready for review!');
    } else {
      console.log(`Email content: SoW generation failed: ${error}`);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    phone: string,
    job: SoWGenerationJob,
    status: 'completed' | 'failed'
  ): Promise<void> {
    // This would integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending SMS to ${phone}: SoW generation ${status} for job ${job.id}`);
  }

  /**
   * Send WhatsApp notification
   */
  private async sendWhatsAppNotification(
    phone: string,
    job: SoWGenerationJob,
    status: 'completed' | 'failed'
  ): Promise<void> {
    // This would integrate with WhatsApp Business API
    console.log(`Sending WhatsApp to ${phone}: SoW generation ${status} for job ${job.id}`);
  }

  /**
   * Clean up completed jobs
   */
  cleanupJobs(): void {
    const now = new Date();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [jobId, job] of this.activeJobs.entries()) {
      if (job.completedAt && now.getTime() - job.completedAt.getTime() > maxAge) {
        this.activeJobs.delete(jobId);
      }
    }
  }

  /**
   * Get all active jobs for a project
   */
  getProjectJobs(projectId: string): SoWGenerationJob[] {
    return Array.from(this.activeJobs.values()).filter(job => job.projectId === projectId);
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId);
    if (job && job.status !== 'completed' && job.status !== 'failed') {
      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.completedAt = new Date();
      return true;
    }
    return false;
  }
}

export const sowGenerationService = new SoWGenerationService();