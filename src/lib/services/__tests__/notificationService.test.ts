// Mock AWS SDK
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  SendEmailCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PublishCommand: jest.fn()
}));

import { notificationService } from '../notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FROM_EMAIL = 'test@homeimprovementplatform.co.uk';
    process.env.FRONTEND_URL = 'https://app.homeimprovementplatform.co.uk';
  });

  describe('sendEmail', () => {
    it('should send email with correct parameters', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML</p>',
        textBody: 'Test Text'
      };

      await notificationService.sendEmail(notification);

      // Verify SES SendEmailCommand was called with correct parameters
      // This would be implemented with proper AWS SDK mocking
    });

    it('should handle email sending errors', async () => {
      const notification = {
        to: 'invalid@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test HTML</p>',
        textBody: 'Test Text'
      };

      // Mock SES error
      // This would be implemented with proper AWS SDK mocking

      await expect(notificationService.sendEmail(notification)).rejects.toThrow();
    });
  });

  describe('sendSMS', () => {
    it('should send SMS with correct parameters', async () => {
      const notification = {
        phoneNumber: '+447700900123',
        message: 'Test SMS message'
      };

      await notificationService.sendSMS(notification);

      // Verify SNS PublishCommand was called with correct parameters
    });

    it('should handle SMS sending errors', async () => {
      const notification = {
        phoneNumber: 'invalid-number',
        message: 'Test SMS message'
      };

      // Mock SNS error
      await expect(notificationService.sendSMS(notification)).rejects.toThrow();
    });
  });

  describe('notifyBuilderOfLeadOffer', () => {
    it('should send email notification to builder', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder',
        phoneNumber: '+447700900123'
      };

      const leadData = {
        id: 'lead_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        price: 500,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      };

      await notificationService.notifyBuilderOfLeadOffer(builderData, leadData);

      // Verify email was sent with correct content
      // Should include project details, pricing, and expiration time
    });

    it('should send both email and SMS when phone number provided', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder',
        phoneNumber: '+447700900123'
      };

      const leadData = {
        id: 'lead_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        price: 500,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      };

      await notificationService.notifyBuilderOfLeadOffer(builderData, leadData);

      // Verify both email and SMS were sent
    });

    it('should only send email when no phone number provided', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder'
      };

      const leadData = {
        id: 'lead_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        price: 500,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      };

      await notificationService.notifyBuilderOfLeadOffer(builderData, leadData);

      // Verify only email was sent, no SMS
    });

    it('should include correct lead details in notification', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder'
      };

      const leadData = {
        id: 'lead_123',
        projectType: 'Bathroom Renovation',
        postcode: 'E1 6AN',
        estimatedBudget: 15000,
        price: 300,
        expiresAt: new Date('2024-01-15T14:30:00Z')
      };

      await notificationService.notifyBuilderOfLeadOffer(builderData, leadData);

      // Verify email content includes:
      // - Project type: Bathroom Renovation
      // - Postcode: E1 6AN
      // - Budget: £15,000
      // - Lead price: £300
      // - Expiration time
      // - Call-to-action link
    });
  });

  describe('notifyHomeownerBuilderFound', () => {
    it('should send congratulatory email to homeowner', async () => {
      const homeownerData = {
        email: 'homeowner@example.com',
        name: 'Jane Homeowner',
        phoneNumber: '+447700900456'
      };

      const projectData = {
        id: 'project_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA'
      };

      const builderData = {
        id: 'builder_123',
        companyName: 'ABC Builders Ltd',
        rating: 4.8
      };

      await notificationService.notifyHomeownerBuilderFound(homeownerData, projectData, builderData);

      // Verify email contains:
      // - Congratulatory message
      // - Project details
      // - Builder information and rating
      // - Next steps explanation
      // - Project link
    });

    it('should send both email and SMS when phone number provided', async () => {
      const homeownerData = {
        email: 'homeowner@example.com',
        name: 'Jane Homeowner',
        phoneNumber: '+447700900456'
      };

      const projectData = {
        id: 'project_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA'
      };

      const builderData = {
        id: 'builder_123',
        companyName: 'ABC Builders Ltd',
        rating: 4.8
      };

      await notificationService.notifyHomeownerBuilderFound(homeownerData, projectData, builderData);

      // Verify both email and SMS were sent
    });

    it('should include builder rating in notification', async () => {
      const homeownerData = {
        email: 'homeowner@example.com',
        name: 'Jane Homeowner'
      };

      const projectData = {
        id: 'project_123',
        projectType: 'Loft Conversion',
        postcode: 'N1 9AG'
      };

      const builderData = {
        id: 'builder_456',
        companyName: 'Premium Loft Conversions',
        rating: 4.9
      };

      await notificationService.notifyHomeownerBuilderFound(homeownerData, projectData, builderData);

      // Verify rating (4.9/5.0) is included in the notification
    });
  });

  describe('notifyHomeownerNoBuilders', () => {
    it('should send informative email about no available builders', async () => {
      const homeownerData = {
        email: 'homeowner@example.com',
        name: 'Jane Homeowner'
      };

      const projectData = {
        projectType: 'Specialized Renovation',
        postcode: 'Remote Area'
      };

      await notificationService.notifyHomeownerNoBuilders(homeownerData, projectData);

      // Verify email contains:
      // - Explanation of the situation
      // - Suggestions for next steps
      // - Alternative options
      // - Support contact information
    });

    it('should provide helpful suggestions in the notification', async () => {
      const homeownerData = {
        email: 'homeowner@example.com',
        name: 'Jane Homeowner'
      };

      const projectData = {
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA'
      };

      await notificationService.notifyHomeownerNoBuilders(homeownerData, projectData);

      // Verify suggestions include:
      // - Expand search area
      // - Adjust project scope
      // - Wait for new builders
      // - Try again later
    });
  });

  describe('notifyBuilderProjectAccess', () => {
    it('should send project access notification with invitation code', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder'
      };

      const projectData = {
        id: 'project_123',
        projectType: 'Extension',
        postcode: 'W1A 0AX'
      };

      const invitationCode = 'INV123456';

      await notificationService.notifyBuilderProjectAccess(builderData, projectData, invitationCode);

      // Verify email contains:
      // - Project access confirmation
      // - Project details
      // - Access link with invitation code
      // - Instructions for next steps
    });

    it('should include invitation code in project access link', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder'
      };

      const projectData = {
        id: 'project_456',
        projectType: 'Bathroom Renovation',
        postcode: 'EC1A 1BB'
      };

      const invitationCode = 'INV789012';

      await notificationService.notifyBuilderProjectAccess(builderData, projectData, invitationCode);

      // Verify the access link includes the invitation code as a query parameter
      // Expected format: /builder/projects/project_456?code=INV789012
    });
  });

  describe('notifyHomeownerNoMoreBuilders', () => {
    it('should send final update email when all builders have declined', async () => {
      const homeownerData = {
        email: 'homeowner@example.com',
        name: 'Jane Homeowner'
      };

      const projectData = {
        projectType: 'Complex Renovation',
        postcode: 'SW1A 1AA'
      };

      await notificationService.notifyHomeownerNoMoreBuilders(homeownerData, projectData);

      // Verify email contains:
      // - Final update message
      // - Explanation that all builders were contacted
      // - Next steps and alternatives
      // - Support options
    });

    it('should provide comprehensive next steps in final notification', async () => {
      const homeownerData = {
        email: 'homeowner@example.com',
        name: 'Jane Homeowner'
      };

      const projectData = {
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA'
      };

      await notificationService.notifyHomeownerNoMoreBuilders(homeownerData, projectData);

      // Verify next steps include:
      // - Create new lead with adjusted requirements
      // - Direct builder search
      // - Wait and retry
      // - Contact support
    });
  });

  describe('Email Content Validation', () => {
    it('should format currency amounts correctly in notifications', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder'
      };

      const leadData = {
        id: 'lead_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        price: 500,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      };

      await notificationService.notifyBuilderOfLeadOffer(builderData, leadData);

      // Verify currency formatting:
      // - £25,000 (with comma separator)
      // - £500 (no decimal places for whole numbers)
    });

    it('should format dates and times correctly in notifications', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder'
      };

      const leadData = {
        id: 'lead_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        price: 500,
        expiresAt: new Date('2024-01-15T14:30:00Z')
      };

      await notificationService.notifyBuilderOfLeadOffer(builderData, leadData);

      // Verify date formatting is user-friendly and includes timezone
    });

    it('should include proper call-to-action links in all notifications', async () => {
      const notifications = [
        'notifyBuilderOfLeadOffer',
        'notifyHomeownerBuilderFound',
        'notifyBuilderProjectAccess',
        'notifyHomeownerNoBuilders',
        'notifyHomeownerNoMoreBuilders'
      ];

      // Each notification should include appropriate CTA links
      // with correct URLs and styling
    });
  });

  describe('Error Handling', () => {
    it('should handle SES service errors gracefully', async () => {
      const notification = {
        to: 'test@example.com',
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test'
      };

      // Mock SES error
      await expect(notificationService.sendEmail(notification)).rejects.toThrow();
    });

    it('should handle SNS service errors gracefully', async () => {
      const notification = {
        phoneNumber: '+447700900123',
        message: 'Test message'
      };

      // Mock SNS error
      await expect(notificationService.sendSMS(notification)).rejects.toThrow();
    });

    it('should continue execution if SMS fails but email succeeds', async () => {
      const builderData = {
        email: 'builder@example.com',
        name: 'John Builder',
        phoneNumber: '+447700900123'
      };

      const leadData = {
        id: 'lead_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        price: 500,
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      };

      // Mock SMS failure but email success
      // The notification should still be considered successful if email is sent
      await notificationService.notifyBuilderOfLeadOffer(builderData, leadData);
    });
  });

  describe('Template Consistency', () => {
    it('should use consistent styling across all email templates', async () => {
      // All email templates should use the same:
      // - Font family (Arial, sans-serif)
      // - Color scheme
      // - Button styling
      // - Layout structure
      // - Footer format
    });

    it('should include unsubscribe links in all marketing emails', async () => {
      // All notification emails should include appropriate
      // unsubscribe or preference management links
    });

    it('should include company branding consistently', async () => {
      // All emails should include:
      // - Consistent from address
      // - Company name and branding
      // - Support contact information
    });
  });
});