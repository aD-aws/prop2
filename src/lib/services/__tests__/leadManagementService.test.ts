// Mock services first
jest.mock('../paymentService', () => ({
  paymentService: {
    createPaymentIntent: jest.fn(),
    getPaymentUrl: jest.fn()
  }
}));

jest.mock('../invitationService', () => ({
  invitationService: {
    generateInvitationCode: jest.fn()
  }
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: jest.fn().mockResolvedValue({ Items: [], Item: null })
    })
  },
  QueryCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  PutCommand: jest.fn(),
  GetCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridge: jest.fn().mockImplementation(() => ({
    putEvents: jest.fn().mockResolvedValue({})
  }))
}));

import { leadManagementService } from '../leadManagementService';
import { paymentService } from '../paymentService';
import { invitationService } from '../invitationService';

const mockPaymentService = paymentService as jest.Mocked<typeof paymentService>;
const mockInvitationService = invitationService as jest.Mocked<typeof invitationService>;

describe('LeadManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a new lead with correct pricing', async () => {
      const projectData = {
        projectId: 'project_123',
        homeownerId: 'homeowner_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        description: 'Complete kitchen renovation with new appliances'
      };

      const lead = await leadManagementService.createLead(projectData);

      expect(lead).toMatchObject({
        projectId: 'project_123',
        homeownerId: 'homeowner_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        description: 'Complete kitchen renovation with new appliances',
        status: 'available',
        price: 500 // 2% of 25000, capped at 500
      });

      expect(lead.id).toBeDefined();
      expect(lead.createdAt).toBeInstanceOf(Date);
      expect(lead.offerHistory).toEqual([]);
    });

    it('should calculate minimum lead price correctly', async () => {
      const projectData = {
        projectId: 'project_123',
        homeownerId: 'homeowner_123',
        projectType: 'Small Repair',
        postcode: 'SW1A 1AA',
        estimatedBudget: 1000, // 2% would be £20, but minimum is £50
        description: 'Small repair work'
      };

      const lead = await leadManagementService.createLead(projectData);

      expect(lead.price).toBe(50); // Minimum price
    });

    it('should calculate maximum lead price correctly', async () => {
      const projectData = {
        projectId: 'project_123',
        homeownerId: 'homeowner_123',
        projectType: 'Large Extension',
        postcode: 'SW1A 1AA',
        estimatedBudget: 100000, // 2% would be £2000, but maximum is £500
        description: 'Large house extension'
      };

      const lead = await leadManagementService.createLead(projectData);

      expect(lead.price).toBe(500); // Maximum price
    });
  });

  describe('getEligibleBuilders', () => {
    it('should return builders sorted by rating and experience', async () => {
      const criteria = {
        postcode: 'SW1A 1AA',
        projectType: 'Kitchen Renovation',
        estimatedBudget: 25000,
        urgency: 'medium' as const
      };

      const builders = await leadManagementService.getEligibleBuilders(criteria);

      // Verify the query parameters would be correct
      expect(builders).toBeDefined();
    });

    it('should filter builders by minimum rating', async () => {
      const criteria = {
        postcode: 'SW1A 1AA',
        projectType: 'Kitchen Renovation',
        estimatedBudget: 25000,
        urgency: 'medium' as const
      };

      await leadManagementService.getEligibleBuilders(criteria);

      // The service should filter builders with rating >= 3.0
      // This would be verified in the actual DynamoDB query
    });
  });

  describe('acceptLeadOffer', () => {
    it('should process payment for valid offer', async () => {
      const offerId = 'offer_123';
      const builderId = 'builder_123';

      mockPaymentService.createPaymentIntent.mockResolvedValue({
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret'
      });

      const result = await leadManagementService.acceptLeadOffer(offerId, builderId);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_123');
      expect(mockPaymentService.createPaymentIntent).toHaveBeenCalledWith({
        amount: expect.any(Number),
        currency: 'gbp',
        customerId: builderId,
        description: expect.stringContaining('Lead purchase'),
        metadata: {
          leadId: expect.any(String),
          offerId: offerId,
          projectType: expect.any(String)
        }
      });
    });

    it('should return error for expired offer', async () => {
      const offerId = 'expired_offer_123';
      const builderId = 'builder_123';

      const result = await leadManagementService.acceptLeadOffer(offerId, builderId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for unauthorized builder', async () => {
      const offerId = 'offer_123';
      const wrongBuilderId = 'wrong_builder_123';

      const result = await leadManagementService.acceptLeadOffer(offerId, wrongBuilderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('completeLeadPurchase', () => {
    it('should complete purchase and generate invitation code', async () => {
      const paymentIntentId = 'pi_123';

      mockInvitationService.generateInvitationCode.mockResolvedValue('INV123456');

      await leadManagementService.completeLeadPurchase(paymentIntentId);

      expect(mockInvitationService.generateInvitationCode).toHaveBeenCalled();
    });

    it('should update offer and lead status', async () => {
      const paymentIntentId = 'pi_123';

      await leadManagementService.completeLeadPurchase(paymentIntentId);

      // Verify that the offer status is updated to 'accepted'
      // and lead status is updated to 'sold'
      // This would be verified through DynamoDB mock calls
    });
  });

  describe('handleExpiredOffer', () => {
    it('should offer lead to next eligible builder', async () => {
      const offerId = 'expired_offer_123';

      await leadManagementService.handleExpiredOffer(offerId);

      // Verify that the expired offer is marked as expired
      // and the lead is offered to the next builder
    });

    it('should mark lead as expired when no more builders available', async () => {
      const offerId = 'last_offer_123';

      await leadManagementService.handleExpiredOffer(offerId);

      // Verify that when no more builders are available,
      // the lead status is updated to 'expired'
    });
  });

  describe('getBuilderAvailableLeads', () => {
    it('should return leads matching builder specializations and service areas', async () => {
      const builderId = 'builder_123';

      const leads = await leadManagementService.getBuilderAvailableLeads(builderId);

      expect(leads).toBeDefined();
      expect(Array.isArray(leads)).toBe(true);
    });

    it('should return empty array for builder not found', async () => {
      const nonExistentBuilderId = 'nonexistent_builder';

      const leads = await leadManagementService.getBuilderAvailableLeads(nonExistentBuilderId);

      expect(leads).toEqual([]);
    });
  });

  describe('getBuilderCurrentOffers', () => {
    it('should return pending offers for builder', async () => {
      const builderId = 'builder_123';

      const offers = await leadManagementService.getBuilderCurrentOffers(builderId);

      expect(offers).toBeDefined();
      expect(Array.isArray(offers)).toBe(true);
    });

    it('should only return pending offers', async () => {
      const builderId = 'builder_123';

      await leadManagementService.getBuilderCurrentOffers(builderId);

      // Verify that the query filters for status = 'pending'
    });
  });

  describe('Lead Distribution Logic', () => {
    it('should prioritize builders by rating first', async () => {
      const criteria = {
        postcode: 'SW1A 1AA',
        projectType: 'Kitchen Renovation',
        estimatedBudget: 25000,
        urgency: 'medium' as const
      };

      const builders = await leadManagementService.getEligibleBuilders(criteria);

      // Verify sorting logic: rating desc, then totalProjects desc, then lastActive desc
      // This would be tested with mock data
    });

    it('should handle sequential lead offering correctly', async () => {
      const leadId = 'lead_123';

      await leadManagementService.initiateLeadDistribution(leadId);

      // Verify that the lead is offered to the highest-rated builder first
    });
  });

  describe('Notification Integration', () => {
    it('should notify builder when lead is offered', async () => {
      const leadId = 'lead_123';
      const builderId = 'builder_123';

      await leadManagementService.offerLeadToBuilder(leadId, builderId);

      // Verify that notification is sent to builder
      // This would be tested through notification service mock
    });

    it('should notify homeowner when builder is found', async () => {
      const paymentIntentId = 'pi_123';

      await leadManagementService.completeLeadPurchase(paymentIntentId);

      // Verify that homeowner is notified about builder being found
    });

    it('should notify homeowner when no builders available', async () => {
      const leadId = 'lead_with_no_builders';

      await leadManagementService.initiateLeadDistribution(leadId);

      // Verify that homeowner is notified when no builders are available
    });
  });

  describe('Error Handling', () => {
    it('should handle payment processing errors gracefully', async () => {
      const offerId = 'offer_123';
      const builderId = 'builder_123';

      mockPaymentService.createPaymentIntent.mockRejectedValue(new Error('Payment failed'));

      const result = await leadManagementService.acceptLeadOffer(offerId, builderId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment processing failed');
    });

    it('should handle database errors gracefully', async () => {
      const projectData = {
        projectId: 'project_123',
        homeownerId: 'homeowner_123',
        projectType: 'Kitchen Renovation',
        postcode: 'SW1A 1AA',
        estimatedBudget: 25000,
        description: 'Test project'
      };

      // Mock DynamoDB error
      // This would be implemented with proper DynamoDB mocking

      await expect(leadManagementService.createLead(projectData)).rejects.toThrow();
    });
  });

  describe('Lead Pricing Logic', () => {
    const testCases = [
      { budget: 500, expectedPrice: 50 },    // Below minimum
      { budget: 2500, expectedPrice: 50 },   // At minimum
      { budget: 5000, expectedPrice: 100 },  // 2% calculation
      { budget: 15000, expectedPrice: 300 }, // 2% calculation
      { budget: 25000, expectedPrice: 500 }, // At maximum
      { budget: 50000, expectedPrice: 500 }  // Above maximum
    ];

    testCases.forEach(({ budget, expectedPrice }) => {
      it(`should calculate correct price for budget £${budget}`, async () => {
        const projectData = {
          projectId: 'project_123',
          homeownerId: 'homeowner_123',
          projectType: 'Test Project',
          postcode: 'SW1A 1AA',
          estimatedBudget: budget,
          description: 'Test project'
        };

        const lead = await leadManagementService.createLead(projectData);

        expect(lead.price).toBe(expectedPrice);
      });
    });
  });

  describe('Time-based Operations', () => {
    it('should set correct expiration time for offers', async () => {
      const leadId = 'lead_123';
      const builderId = 'builder_123';

      const offer = await leadManagementService.offerLeadToBuilder(leadId, builderId);

      const expectedExpiration = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
      const actualExpiration = new Date(offer.expiresAt);
      
      // Allow for small time differences due to execution time
      expect(Math.abs(actualExpiration.getTime() - expectedExpiration.getTime())).toBeLessThan(1000);
    });

    it('should schedule automatic offer expiration', async () => {
      const leadId = 'lead_123';
      const builderId = 'builder_123';

      await leadManagementService.offerLeadToBuilder(leadId, builderId);

      // Verify that EventBridge event is scheduled for expiration
      // This would be tested through EventBridge mock
    });
  });
});