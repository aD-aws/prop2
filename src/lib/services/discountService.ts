import { 
  DiscountCode, 
  DiscountUsage, 
  Payment,
  UserType 
} from '../types';

export class DiscountService {
  /**
   * Create a new discount code
   */
  async createDiscountCode(
    code: string,
    type: 'percentage' | 'fixed_amount',
    value: number,
    description: string,
    validFrom: Date,
    validUntil: Date,
    applicablePlans: string[],
    maxUses?: number,
    createdBy: string = 'admin'
  ): Promise<DiscountCode> {
    try {
      // Validate code uniqueness
      const existingCode = await this.getDiscountCodeByCode(code);
      if (existingCode) {
        throw new Error('Discount code already exists');
      }

      // Validate value
      if (type === 'percentage' && (value < 0 || value > 100)) {
        throw new Error('Percentage discount must be between 0 and 100');
      }
      if (type === 'fixed_amount' && value < 0) {
        throw new Error('Fixed amount discount must be positive');
      }

      const discountCode: DiscountCode = {
        id: `discount_${Date.now()}`,
        code: code.toUpperCase(),
        type,
        value,
        description,
        maxUses,
        usedCount: 0,
        validFrom,
        validUntil,
        applicablePlans,
        isActive: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.saveDiscountCode(discountCode);
      return discountCode;
    } catch (error) {
      console.error('Error creating discount code:', error);
      throw error;
    }
  }

  /**
   * Get discount code by code string
   */
  async getDiscountCodeByCode(code: string): Promise<DiscountCode | null> {
    try {
      // This would query your database for the discount code
      // Placeholder implementation
      return null;
    } catch (error) {
      console.error('Error fetching discount code:', error);
      return null;
    }
  }

  /**
   * Get discount code by ID
   */
  async getDiscountCodeById(id: string): Promise<DiscountCode | null> {
    try {
      // This would query your database for the discount code
      // Placeholder implementation
      return null;
    } catch (error) {
      console.error('Error fetching discount code:', error);
      return null;
    }
  }

  /**
   * Validate a discount code for use
   */
  async validateDiscountCode(
    code: string, 
    planId: string, 
    userId?: string
  ): Promise<{ valid: boolean; discountCode?: DiscountCode; error?: string }> {
    try {
      const discountCode = await this.getDiscountCodeByCode(code);
      
      if (!discountCode) {
        return { valid: false, error: 'Discount code not found' };
      }

      if (!discountCode.isActive) {
        return { valid: false, error: 'Discount code is inactive' };
      }

      const now = new Date();
      if (now < discountCode.validFrom) {
        return { valid: false, error: 'Discount code is not yet valid' };
      }

      if (now > discountCode.validUntil) {
        return { valid: false, error: 'Discount code has expired' };
      }

      if (discountCode.maxUses && discountCode.usedCount >= discountCode.maxUses) {
        return { valid: false, error: 'Discount code usage limit reached' };
      }

      if (!discountCode.applicablePlans.includes(planId)) {
        return { valid: false, error: 'Discount code not applicable to this plan' };
      }

      // Check if user has already used this code (if userId provided)
      if (userId) {
        const hasUsed = await this.hasUserUsedCode(userId, discountCode.id);
        if (hasUsed) {
          return { valid: false, error: 'You have already used this discount code' };
        }
      }

      return { valid: true, discountCode };
    } catch (error) {
      console.error('Error validating discount code:', error);
      return { valid: false, error: 'Error validating discount code' };
    }
  }

  /**
   * Apply discount code to a payment
   */
  async applyDiscountCode(
    discountCodeId: string,
    userId: string,
    paymentId: string,
    originalAmount: number
  ): Promise<{ discountAmount: number; finalAmount: number }> {
    try {
      const discountCode = await this.getDiscountCodeById(discountCodeId);
      if (!discountCode) {
        throw new Error('Discount code not found');
      }

      let discountAmount = 0;
      if (discountCode.type === 'percentage') {
        discountAmount = originalAmount * (discountCode.value / 100);
      } else {
        discountAmount = Math.min(discountCode.value / 100, originalAmount); // Convert pence to pounds
      }

      const finalAmount = Math.max(0, originalAmount - discountAmount);

      // Record the usage
      const usage: DiscountUsage = {
        id: `usage_${Date.now()}`,
        discountCodeId,
        userId,
        paymentId,
        discountAmount,
        usedAt: new Date(),
      };

      await this.recordDiscountUsage(usage);
      await this.incrementUsageCount(discountCodeId);

      return { discountAmount, finalAmount };
    } catch (error) {
      console.error('Error applying discount code:', error);
      throw error;
    }
  }

  /**
   * Get all discount codes (admin function)
   */
  async getAllDiscountCodes(
    includeInactive: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<DiscountCode[]> {
    try {
      // This would query your database for discount codes
      // Placeholder implementation
      return [];
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      throw new Error('Failed to fetch discount codes');
    }
  }

  /**
   * Update discount code
   */
  async updateDiscountCode(
    id: string,
    updates: Partial<Pick<DiscountCode, 'description' | 'validUntil' | 'maxUses' | 'isActive'>>
  ): Promise<DiscountCode> {
    try {
      const discountCode = await this.getDiscountCodeById(id);
      if (!discountCode) {
        throw new Error('Discount code not found');
      }

      const updatedCode: DiscountCode = {
        ...discountCode,
        ...updates,
        updatedAt: new Date(),
      };

      await this.saveDiscountCode(updatedCode);
      return updatedCode;
    } catch (error) {
      console.error('Error updating discount code:', error);
      throw error;
    }
  }

  /**
   * Deactivate discount code
   */
  async deactivateDiscountCode(id: string): Promise<void> {
    try {
      await this.updateDiscountCode(id, { isActive: false });
    } catch (error) {
      console.error('Error deactivating discount code:', error);
      throw error;
    }
  }

  /**
   * Get discount code usage statistics
   */
  async getDiscountCodeStats(id: string): Promise<{
    totalUses: number;
    totalDiscountAmount: number;
    recentUsages: DiscountUsage[];
    topUsers: { userId: string; usageCount: number }[];
  }> {
    try {
      // This would query your database for usage statistics
      // Placeholder implementation
      return {
        totalUses: 0,
        totalDiscountAmount: 0,
        recentUsages: [],
        topUsers: [],
      };
    } catch (error) {
      console.error('Error fetching discount code stats:', error);
      throw new Error('Failed to fetch discount code statistics');
    }
  }

  /**
   * Generate campaign discount codes
   */
  async generateCampaignCodes(
    prefix: string,
    count: number,
    type: 'percentage' | 'fixed_amount',
    value: number,
    description: string,
    validFrom: Date,
    validUntil: Date,
    applicablePlans: string[],
    maxUsesPerCode: number = 1
  ): Promise<DiscountCode[]> {
    try {
      const codes: DiscountCode[] = [];
      
      for (let i = 0; i < count; i++) {
        const code = `${prefix}${String(i + 1).padStart(4, '0')}`;
        const discountCode = await this.createDiscountCode(
          code,
          type,
          value,
          description,
          validFrom,
          validUntil,
          applicablePlans,
          maxUsesPerCode,
          'campaign'
        );
        codes.push(discountCode);
      }

      return codes;
    } catch (error) {
      console.error('Error generating campaign codes:', error);
      throw error;
    }
  }

  /**
   * Get user's discount usage history
   */
  async getUserDiscountHistory(userId: string): Promise<DiscountUsage[]> {
    try {
      // This would query your database for user's discount usage
      // Placeholder implementation
      return [];
    } catch (error) {
      console.error('Error fetching user discount history:', error);
      throw new Error('Failed to fetch discount history');
    }
  }

  // Private helper methods
  private async saveDiscountCode(discountCode: DiscountCode): Promise<void> {
    // This would save the discount code to your database
    // Placeholder implementation
    console.log('Saving discount code:', discountCode.id);
  }

  private async recordDiscountUsage(usage: DiscountUsage): Promise<void> {
    // This would save the usage record to your database
    // Placeholder implementation
    console.log('Recording discount usage:', usage.id);
  }

  private async incrementUsageCount(discountCodeId: string): Promise<void> {
    // This would increment the usage count in your database
    // Placeholder implementation
    console.log('Incrementing usage count for:', discountCodeId);
  }

  private async hasUserUsedCode(userId: string, discountCodeId: string): Promise<boolean> {
    // This would check if user has used the discount code before
    // Placeholder implementation
    return false;
  }
}

export const discountService = new DiscountService();