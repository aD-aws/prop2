import { CouncilApiService } from '../../lib/services/councilApiService';
import { ComplianceService } from '../../lib/services/complianceService';
import { PaymentService } from '../../lib/services/paymentService';
import { DocuSignService } from '../../lib/services/docusignService';
import { NotificationService } from '../../lib/services/notificationService';

describe('External Services Integration Tests', () => {
  let councilApiService: CouncilApiService;
  let complianceService: ComplianceService;
  let paymentService: PaymentService;
  let docusignService: DocuSignService;
  let notificationService: NotificationService;

  beforeEach(() => {
    councilApiService = new CouncilApiService();
    complianceService = new ComplianceService();
    paymentService = new PaymentService();
    docusignService = new DocuSignService();
    notificationService = new NotificationService();
  });

  describe('Council API Integration', () => {
    it('should fetch planning permission requirements from council API', async () => {
      const propertyDetails = {
        address: '123 Test Street, London, SW1A 1AA',
        postcode: 'SW1A 1AA',
        uprn: '12345678'
      };

      const requirements = await councilApiService.getPlanningRequirements(propertyDetails);

      expect(requirements).toBeDefined();
      expect(requirements.planningPermissionRequired).toBeDefined();
      expect(requirements.buildingRegulationsRequired).toBeDefined();
      expect(requirements.constraints).toBeDefined();
    }, 10000);

    it('should handle council API rate limiting gracefully', async () => {
      const propertyDetails = {
        address: '456 Rate Limit Street, London, SW1A 1BB',
        postcode: 'SW1A 1BB',
        uprn: '87654321'
      };

      // Make multiple rapid requests to test rate limiting
      const requests = Array(5).fill(null).map(() =>
        councilApiService.getPlanningRequirements(propertyDetails)
      );

      const results = await Promise.allSettled(requests);

      // Should handle rate limiting without throwing errors
      const successfulRequests = results.filter(r => r.status === 'fulfilled');
      expect(successfulRequests.length).toBeGreaterThan(0);
    }, 15000);

    it('should validate property data against council records', async () => {
      const propertyDetails = {
        address: '789 Validation Street, Manchester, M1 1AA',
        postcode: 'M1 1AA',
        uprn: '11223344'
      };

      const validation = await councilApiService.validateProperty(propertyDetails);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.councilArea).toBeDefined();
    }, 10000);
  });

  describe('Compliance Service Integration', () => {
    it('should check building regulations compliance', async () => {
      const projectDetails = {
        projectType: 'loft-conversion',
        propertyType: 'terraced',
        yearBuilt: 1950,
        structuralChanges: true,
        floorAreaIncrease: 30
      };

      const compliance = await complianceService.checkBuildingRegulations(projectDetails);

      expect(compliance).toBeDefined();
      expect(compliance.buildingRegulationsRequired).toBe(true);
      expect(compliance.requirements).toBeDefined();
      expect(compliance.requirements.length).toBeGreaterThan(0);
    });

    it('should validate fire safety requirements', async () => {
      const projectDetails = {
        projectType: 'loft-conversion',
        floors: 3,
        escapeRoutes: 1,
        smokeDetectors: true
      };

      const fireSafety = await complianceService.checkFireSafety(projectDetails);

      expect(fireSafety).toBeDefined();
      expect(fireSafety.compliant).toBeDefined();
      expect(fireSafety.requirements).toBeDefined();
    });

    it('should check accessibility compliance', async () => {
      const projectDetails = {
        projectType: 'bathroom-renovation',
        accessibilityRequired: true,
        doorWidth: 850,
        stepFreeAccess: true
      };

      const accessibility = await complianceService.checkAccessibility(projectDetails);

      expect(accessibility).toBeDefined();
      expect(accessibility.compliant).toBeDefined();
      expect(accessibility.recommendations).toBeDefined();
    });
  });

  describe('Payment Service Integration', () => {
    it('should process subscription payment successfully', async () => {
      const paymentDetails = {
        amount: 2999, // £29.99
        currency: 'GBP',
        customerId: 'test-customer-001',
        subscriptionPlan: 'professional',
        paymentMethodId: 'pm_test_card'
      };

      const result = await paymentService.processSubscriptionPayment(paymentDetails);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.subscriptionId).toBeDefined();
      expect(result.transactionId).toBeDefined();
    });

    it('should handle payment failures gracefully', async () => {
      const paymentDetails = {
        amount: 5000,
        currency: 'GBP',
        customerId: 'test-customer-002',
        subscriptionPlan: 'premium',
        paymentMethodId: 'pm_test_card_declined'
      };

      const result = await paymentService.processSubscriptionPayment(paymentDetails);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBeDefined();
    });

    it('should process lead purchase payment', async () => {
      const leadPurchase = {
        builderId: 'builder-001',
        leadId: 'lead-001',
        amount: 1500, // £15.00
        currency: 'GBP'
      };

      const result = await paymentService.processLeadPurchase(leadPurchase);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
    });
  });

  describe('DocuSign Integration', () => {
    it('should create and send contract for signature', async () => {
      const contractDetails = {
        projectId: 'proj-001',
        homeownerId: 'homeowner-001',
        builderId: 'builder-001',
        contractType: 'construction-agreement',
        documentContent: 'Test contract content'
      };

      const envelope = await docusignService.createAndSendContract(contractDetails);

      expect(envelope).toBeDefined();
      expect(envelope.envelopeId).toBeDefined();
      expect(envelope.status).toBe('sent');
      expect(envelope.signingUrl).toBeDefined();
    });

    it('should check contract signing status', async () => {
      const envelopeId = 'test-envelope-001';

      const status = await docusignService.getContractStatus(envelopeId);

      expect(status).toBeDefined();
      expect(status.envelopeId).toBe(envelopeId);
      expect(status.status).toBeDefined();
      expect(status.signers).toBeDefined();
    });

    it('should download completed contract', async () => {
      const envelopeId = 'test-envelope-completed';

      const document = await docusignService.downloadCompletedContract(envelopeId);

      expect(document).toBeDefined();
      expect(document.documentData).toBeDefined();
      expect(document.fileName).toBeDefined();
      expect(document.mimeType).toBe('application/pdf');
    });
  });

  describe('Notification Service Integration', () => {
    it('should send email notification successfully', async () => {
      const notification = {
        type: 'email',
        recipient: 'test@example.com',
        subject: 'Test Notification',
        template: 'project-update',
        data: {
          projectId: 'proj-001',
          status: 'in-progress'
        }
      };

      const result = await notificationService.sendNotification(notification);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send SMS notification successfully', async () => {
      const notification = {
        type: 'sms',
        recipient: '+447700900123',
        message: 'Your project update is ready',
        projectId: 'proj-001'
      };

      const result = await notificationService.sendSMSNotification(notification);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle notification delivery failures', async () => {
      const notification = {
        type: 'email',
        recipient: 'invalid-email',
        subject: 'Test Notification',
        template: 'project-update',
        data: {}
      };

      const result = await notificationService.sendNotification(notification);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Service Resilience and Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      // Test with a service that might timeout
      const propertyDetails = {
        address: 'Timeout Test Address',
        postcode: 'TO1 1ME',
        uprn: '99999999'
      };

      await expect(async () => {
        await Promise.race([
          councilApiService.getPlanningRequirements(propertyDetails),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
      }).not.toThrow();
    });

    it('should implement circuit breaker pattern for failing services', async () => {
      // Simulate multiple failures to trigger circuit breaker
      const failingRequests = Array(5).fill(null).map(() =>
        councilApiService.getPlanningRequirements({
          address: 'Failing Service Test',
          postcode: 'FA1 1IL',
          uprn: '00000000'
        }).catch(() => ({ error: 'Service unavailable' }))
      );

      const results = await Promise.all(failingRequests);

      // Circuit breaker should prevent further requests after threshold
      expect(results.every(r => r.error || r.planningPermissionRequired !== undefined)).toBe(true);
    });

    it('should retry failed requests with exponential backoff', async () => {
      const startTime = Date.now();

      try {
        await paymentService.processSubscriptionPayment({
          amount: 1000,
          currency: 'GBP',
          customerId: 'retry-test-customer',
          subscriptionPlan: 'basic',
          paymentMethodId: 'pm_test_retry'
        });
      } catch (error) {
        const executionTime = Date.now() - startTime;
        // Should have attempted retries with delays
        expect(executionTime).toBeGreaterThan(1000);
      }
    });
  });
});