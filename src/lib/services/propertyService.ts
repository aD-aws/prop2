// Property Service for property assessment and compliance checking

import { DynamoDBService } from '../aws/dynamodb';
import { awsConfig } from '../config/aws';
import { Property, Address, PlanningApplication, RegulationRequirement } from '../types';

export class PropertyService extends DynamoDBService {
  private static tableName = awsConfig.dynamodb.propertiesTable;

  /**
   * Create a new property record
   */
  static async createProperty(property: Omit<Property, 'id'>): Promise<{ success: boolean; propertyId?: string; error?: string }> {
    try {
      const propertyId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const propertyData = {
        ...property,
        id: propertyId,
        propertyId,
        postcode: property.address.postcode, // For GSI lookup
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await this.putItem(this.tableName, propertyData);
      
      if (result.success) {
        return { success: true, propertyId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error creating property:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create property',
      };
    }
  }

  /**
   * Get property by ID
   */
  static async getPropertyById(propertyId: string): Promise<{ success: boolean; property?: Property; error?: string }> {
    try {
      const result = await this.getItem(this.tableName, { propertyId });
      
      if (result.success && result.Item) {
        return { success: true, property: result.Item as Property };
      } else {
        return { success: false, error: 'Property not found' };
      }
    } catch (error) {
      console.error('Error getting property:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get property',
      };
    }
  }

  /**
   * Update property information
   */
  static async updateProperty(propertyId: string, updates: Partial<Property>): Promise<{ success: boolean; property?: Property; error?: string }> {
    try {
      const result = await this.updateItem(this.tableName, { propertyId }, updates);
      
      if (result.success) {
        return { success: true, property: result.item as Property };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating property:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update property',
      };
    }
  }

  /**
   * Get properties by postcode
   */
  static async getPropertiesByPostcode(postcode: string): Promise<{ success: boolean; properties?: Property[]; error?: string }> {
    try {
      const result = await this.queryItems(
        this.tableName,
        'PostcodeIndex',
        { postcode }
      );
      
      if (result.success) {
        return { success: true, properties: result.Items as Property[] };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error getting properties by postcode:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get properties',
      };
    }
  }

  /**
   * Validate property address format
   */
  static validateAddress(address: Address): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address.line1 || address.line1.trim().length === 0) {
      errors.push('Address line 1 is required');
    }

    if (!address.city || address.city.trim().length === 0) {
      errors.push('City is required');
    }

    if (!address.postcode || address.postcode.trim().length === 0) {
      errors.push('Postcode is required');
    } else {
      // UK postcode validation regex
      const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
      if (!postcodeRegex.test(address.postcode.replace(/\s/g, ''))) {
        errors.push('Invalid UK postcode format');
      }
    }

    if (!address.country || address.country.trim().length === 0) {
      errors.push('Country is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract council area from postcode
   */
  static extractCouncilArea(postcode: string): string {
    // This is a simplified mapping - in production, you'd use a comprehensive postcode to council mapping
    const postcodePrefix = postcode.replace(/\s/g, '').substring(0, 2).toUpperCase();
    
    const councilMapping: Record<string, string> = {
      'SW': 'Wandsworth Borough Council',
      'SE': 'Southwark Council',
      'N1': 'Islington Council',
      'E1': 'Tower Hamlets Council',
      'W1': 'Westminster City Council',
      'NW': 'Camden Council',
      'EC': 'City of London Corporation',
      'WC': 'Westminster City Council',
      'M1': 'Manchester City Council',
      'M2': 'Manchester City Council',
      'B1': 'Birmingham City Council',
      'B2': 'Birmingham City Council',
      'L1': 'Liverpool City Council',
      'L2': 'Liverpool City Council',
      'LS': 'Leeds City Council',
      'S1': 'Sheffield City Council',
      'BS': 'Bristol City Council',
      'CF': 'Cardiff Council',
      'EH': 'City of Edinburgh Council',
      'G1': 'Glasgow City Council',
      'BT': 'Belfast City Council',
    };

    return councilMapping[postcodePrefix] || 'Unknown Council Area';
  }

  /**
   * Add planning application to property
   */
  static async addPlanningApplication(
    propertyId: string, 
    planningApplication: PlanningApplication
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current property
      const propertyResult = await this.getPropertyById(propertyId);
      if (!propertyResult.success || !propertyResult.property) {
        return { success: false, error: 'Property not found' };
      }

      const currentProperty = propertyResult.property;
      const updatedPlanningHistory = [
        ...currentProperty.planningHistory,
        planningApplication,
      ];

      const result = await this.updateProperty(propertyId, {
        planningHistory: updatedPlanningHistory,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('Error adding planning application:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add planning application',
      };
    }
  }

  /**
   * Add building regulation requirement to property
   */
  static async addRegulationRequirement(
    propertyId: string, 
    requirement: RegulationRequirement
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current property
      const propertyResult = await this.getPropertyById(propertyId);
      if (!propertyResult.success || !propertyResult.property) {
        return { success: false, error: 'Property not found' };
      }

      const currentProperty = propertyResult.property;
      const updatedRequirements = [
        ...currentProperty.buildingRegulations,
        requirement,
      ];

      const result = await this.updateProperty(propertyId, {
        buildingRegulations: updatedRequirements,
      });

      return { success: result.success, error: result.error };
    } catch (error) {
      console.error('Error adding regulation requirement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add regulation requirement',
      };
    }
  }
}