// Builder invitation code generation and validation service

import { DynamoDBService } from '@/lib/aws/dynamodb';
import { v4 as uuidv4 } from 'uuid';

export interface BuilderInvitation {
  invitationCode: string;
  projectId: string;
  homeownerId: string;
  builderId?: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  status: 'active' | 'used' | 'expired';
  invitationType: 'qr' | 'email' | 'whatsapp';
}

export class InvitationService {
  private static readonly INVITATION_EXPIRY_HOURS = 168; // 7 days
  private static readonly TABLE_NAME = 'uk-home-improvement-invitations';

  /**
   * Generate a new invitation code for a project
   */
  static async generateInvitationCode(
    projectId: string,
    homeownerId: string,
    invitationType: 'qr' | 'email' | 'whatsapp' = 'email'
  ): Promise<{ success: boolean; invitationCode?: string; error?: string }> {
    try {
      const invitationCode = this.generateUniqueCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.INVITATION_EXPIRY_HOURS);

      const invitation: BuilderInvitation = {
        invitationCode,
        projectId,
        homeownerId,
        createdAt: new Date(),
        expiresAt,
        status: 'active',
        invitationType,
      };

      // Store invitation in DynamoDB
      await DynamoDBService.putItem(this.TABLE_NAME, {
        ...invitation,
        createdAt: invitation.createdAt.toISOString(),
        expiresAt: invitation.expiresAt.toISOString(),
      });

      return { success: true, invitationCode };
    } catch (error) {
      console.error('Error generating invitation code:', error);
      return { success: false, error: 'Failed to generate invitation code' };
    }
  }

  /**
   * Validate an invitation code
   */
  static async validateInvitationCode(
    invitationCode: string
  ): Promise<{ 
    success: boolean; 
    invitation?: BuilderInvitation; 
    error?: string 
  }> {
    try {
      const result = await DynamoDBService.getItem(this.TABLE_NAME, {
        invitationCode,
      });

      if (!result.Item) {
        return { success: false, error: 'Invalid invitation code' };
      }

      const invitation: BuilderInvitation = {
        ...result.Item,
        createdAt: new Date(result.Item.createdAt),
        expiresAt: new Date(result.Item.expiresAt),
        usedAt: result.Item.usedAt ? new Date(result.Item.usedAt) : undefined,
      } as BuilderInvitation;

      // Check if invitation is expired
      if (invitation.expiresAt < new Date()) {
        await this.markInvitationExpired(invitationCode);
        return { success: false, error: 'Invitation code has expired' };
      }

      // Check if invitation is already used
      if (invitation.status === 'used') {
        return { success: false, error: 'Invitation code has already been used' };
      }

      return { success: true, invitation };
    } catch (error) {
      console.error('Error validating invitation code:', error);
      return { success: false, error: 'Failed to validate invitation code' };
    }
  }

  /**
   * Mark invitation as used by a builder
   */
  static async useInvitationCode(
    invitationCode: string,
    builderId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = await this.validateInvitationCode(invitationCode);
      
      if (!validation.success) {
        return validation;
      }

      // Update invitation status
      await DynamoDBService.updateItem(
        this.TABLE_NAME,
        { invitationCode },
        {
          builderId,
          usedAt: new Date().toISOString(),
          status: 'used',
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error using invitation code:', error);
      return { success: false, error: 'Failed to use invitation code' };
    }
  }

  /**
   * Get all invitations for a project
   */
  static async getProjectInvitations(
    projectId: string
  ): Promise<{ success: boolean; invitations?: BuilderInvitation[]; error?: string }> {
    try {
      const result = await DynamoDBService.queryItems(
        this.TABLE_NAME,
        'ProjectIndex',
        { projectId }
      );

      const invitations: BuilderInvitation[] = result.Items?.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: new Date(item.expiresAt),
        usedAt: item.usedAt ? new Date(item.usedAt) : undefined,
      })) as BuilderInvitation[] || [];

      return { success: true, invitations };
    } catch (error) {
      console.error('Error getting project invitations:', error);
      return { success: false, error: 'Failed to get project invitations' };
    }
  }

  /**
   * Get all invitations for a homeowner
   */
  static async getHomeownerInvitations(
    homeownerId: string
  ): Promise<{ success: boolean; invitations?: BuilderInvitation[]; error?: string }> {
    try {
      const result = await DynamoDBService.queryItems(
        this.TABLE_NAME,
        'HomeownerIndex',
        { homeownerId }
      );

      const invitations: BuilderInvitation[] = result.Items?.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        expiresAt: new Date(item.expiresAt),
        usedAt: item.usedAt ? new Date(item.usedAt) : undefined,
      })) as BuilderInvitation[] || [];

      return { success: true, invitations };
    } catch (error) {
      console.error('Error getting homeowner invitations:', error);
      return { success: false, error: 'Failed to get homeowner invitations' };
    }
  }

  /**
   * Generate QR code URL for invitation
   */
  static generateQRCodeURL(invitationCode: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/auth/register?invite=${invitationCode}`;
    
    // Using a QR code service (in production, you might want to use your own service)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}`;
  }

  /**
   * Generate email invitation content
   */
  static generateEmailInvitation(
    invitationCode: string,
    homeownerName: string,
    projectType: string
  ): { subject: string; body: string; inviteUrl: string } {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/auth/register?invite=${invitationCode}`;
    
    const subject = `Invitation to Quote: ${projectType} Project`;
    const body = `
Hello,

${homeownerName} has invited you to provide a quote for their ${projectType} project through the UK Home Improvement Platform.

To access the project details and submit your quote, please register using this invitation link:
${inviteUrl}

This invitation will expire in 7 days.

Best regards,
UK Home Improvement Platform Team
    `.trim();

    return { subject, body, inviteUrl };
  }

  /**
   * Generate WhatsApp invitation message
   */
  static generateWhatsAppInvitation(
    invitationCode: string,
    homeownerName: string,
    projectType: string
  ): { message: string; inviteUrl: string } {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/auth/register?invite=${invitationCode}`;
    
    const message = `Hi! ${homeownerName} has invited you to quote for their ${projectType} project. Register here: ${inviteUrl} (Expires in 7 days)`;

    return { message, inviteUrl };
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      // This would typically be run as a scheduled job
      const result = await DynamoDBService.scanTable(this.TABLE_NAME);
      const now = new Date();

      for (const item of result.Items || []) {
        const expiresAt = new Date(item.expiresAt);
        if (expiresAt < now && item.status === 'active') {
          await this.markInvitationExpired(item.invitationCode);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
    }
  }

  /**
   * Generate a unique invitation code
   */
  private static generateUniqueCode(): string {
    // Generate a short, unique code (8 characters)
    return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  }

  /**
   * Mark invitation as expired
   */
  private static async markInvitationExpired(invitationCode: string): Promise<void> {
    await DynamoDBService.updateItem(
      this.TABLE_NAME,
      { invitationCode },
      { status: 'expired' }
    );
  }
}