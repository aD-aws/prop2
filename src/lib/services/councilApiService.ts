// Council API Integration Service for property information retrieval

import { Address, PlanningApplication } from '../types';

export interface CouncilPropertyInfo {
  address: Address;
  isListedBuilding: boolean;
  isInConservationArea: boolean;
  conservationAreaName?: string;
  listingGrade?: 'I' | 'II*' | 'II';
  listingDescription?: string;
  planningApplications: PlanningApplication[];
  councilArea: string;
  uprn?: string; // Unique Property Reference Number
}

export interface CouncilApiResponse {
  success: boolean;
  data?: CouncilPropertyInfo;
  error?: string;
  source: string;
}

export class CouncilApiService {
  
  /**
   * Query council API for property information
   * This is a mock implementation - in production, you'd integrate with actual council APIs
   */
  static async getPropertyInfo(address: Address): Promise<CouncilApiResponse> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data based on postcode patterns for demonstration
      const mockData = this.generateMockPropertyData(address);
      
      return {
        success: true,
        data: mockData,
        source: 'Mock Council API',
      };
    } catch (error) {
      console.error('Council API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Council API request failed',
        source: 'Council API',
      };
    }
  }

  /**
   * Check if property is in a conservation area
   */
  static async checkConservationArea(address: Address): Promise<{
    success: boolean;
    isInConservationArea: boolean;
    conservationAreaName?: string;
    restrictions?: string[];
    error?: string;
  }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock conservation area check based on postcode
      const postcode = address.postcode.replace(/\s/g, '').toUpperCase();
      const isInConservationArea = this.mockConservationAreaCheck(postcode);
      
      if (isInConservationArea) {
        return {
          success: true,
          isInConservationArea: true,
          conservationAreaName: this.getConservationAreaName(postcode),
          restrictions: [
            'Planning permission required for external alterations',
            'Restrictions on window replacements',
            'Materials must be in keeping with area character',
            'Tree work may require consent',
          ],
        };
      } else {
        return {
          success: true,
          isInConservationArea: false,
        };
      }
    } catch (error) {
      console.error('Conservation area check error:', error);
      return {
        success: false,
        isInConservationArea: false,
        error: error instanceof Error ? error.message : 'Conservation area check failed',
      };
    }
  }

  /**
   * Check if property is a listed building
   */
  static async checkListedBuilding(address: Address): Promise<{
    success: boolean;
    isListedBuilding: boolean;
    listingGrade?: 'I' | 'II*' | 'II';
    listingDescription?: string;
    restrictions?: string[];
    error?: string;
  }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock listed building check
      const isListed = this.mockListedBuildingCheck(address);
      
      if (isListed) {
        const grade = this.getListingGrade();
        return {
          success: true,
          isListedBuilding: true,
          listingGrade: grade,
          listingDescription: this.getListingDescription(grade),
          restrictions: this.getListedBuildingRestrictions(grade),
        };
      } else {
        return {
          success: true,
          isListedBuilding: false,
        };
      }
    } catch (error) {
      console.error('Listed building check error:', error);
      return {
        success: false,
        isListedBuilding: false,
        error: error instanceof Error ? error.message : 'Listed building check failed',
      };
    }
  }

  /**
   * Get planning applications for property
   */
  static async getPlanningApplications(address: Address): Promise<{
    success: boolean;
    applications?: PlanningApplication[];
    error?: string;
  }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const applications = this.generateMockPlanningApplications();
      
      return {
        success: true,
        applications,
      };
    } catch (error) {
      console.error('Planning applications error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Planning applications request failed',
      };
    }
  }

  // Mock data generation methods (replace with real API calls in production)

  private static generateMockPropertyData(address: Address): CouncilPropertyInfo {
    const postcode = address.postcode.replace(/\s/g, '').toUpperCase();
    const isInConservationArea = this.mockConservationAreaCheck(postcode);
    const isListedBuilding = this.mockListedBuildingCheck(address);
    
    return {
      address,
      isListedBuilding,
      isInConservationArea,
      conservationAreaName: isInConservationArea ? this.getConservationAreaName(postcode) : undefined,
      listingGrade: isListedBuilding ? this.getListingGrade() : undefined,
      listingDescription: isListedBuilding ? this.getListingDescription(this.getListingGrade()) : undefined,
      planningApplications: this.generateMockPlanningApplications(),
      councilArea: this.extractCouncilArea(postcode),
      uprn: `${Math.floor(Math.random() * 900000000) + 100000000}`,
    };
  }

  private static mockConservationAreaCheck(postcode: string): boolean {
    // Mock logic: certain postcodes are in conservation areas
    const conservationPostcodes = ['SW1', 'WC1', 'EC1', 'N1', 'W1', 'SE1'];
    return conservationPostcodes.some(prefix => postcode.startsWith(prefix));
  }

  private static mockListedBuildingCheck(address: Address): boolean {
    // Mock logic: properties built before 1900 or with certain keywords are more likely to be listed
    const keywords = ['church', 'manor', 'hall', 'house', 'cottage', 'mill'];
    const hasKeyword = keywords.some(keyword => 
      address.line1.toLowerCase().includes(keyword) || 
      (address.line2 && address.line2.toLowerCase().includes(keyword))
    );
    
    // Random chance for demonstration
    return hasKeyword || Math.random() < 0.1;
  }

  private static getConservationAreaName(postcode: string): string {
    const areaNames: Record<string, string> = {
      'SW1': 'Westminster Conservation Area',
      'WC1': 'Bloomsbury Conservation Area',
      'EC1': 'City of London Conservation Area',
      'N1': 'Islington Conservation Area',
      'W1': 'Mayfair Conservation Area',
      'SE1': 'Southwark Conservation Area',
    };
    
    const prefix = postcode.substring(0, 3);
    return areaNames[prefix] || 'Local Conservation Area';
  }

  private static getListingGrade(): 'I' | 'II*' | 'II' {
    // Mock grading logic - simplified for build
    return Math.random() < 0.1 ? 'I' : Math.random() < 0.3 ? 'II*' : 'II';
  }

  private static getListingDescription(grade: 'I' | 'II*' | 'II'): string {
    const descriptions = {
      'I': 'Buildings of exceptional interest, sometimes considered to be internationally important',
      'II*': 'Particularly important buildings of more than special interest',
      'II': 'Buildings of special interest, warranting every effort to preserve them',
    };
    
    return `${descriptions[grade]}. This property is protected under the Planning (Listed Buildings and Conservation Areas) Act 1990.`;
  }

  private static getListedBuildingRestrictions(grade: 'I' | 'II*' | 'II'): string[] {
    const baseRestrictions = [
      'Listed building consent required for all alterations',
      'No permitted development rights',
      'Materials must match original specifications',
      'Professional heritage advice recommended',
    ];

    if (grade === 'I' || grade === 'II*') {
      return [
        ...baseRestrictions,
        'Historic England consultation required',
        'Specialist conservation architect required',
        'Archaeological investigation may be needed',
      ];
    }

    return baseRestrictions;
  }

  private static generateMockPlanningApplications(): PlanningApplication[] {
    const applications: PlanningApplication[] = [];
    
    // Generate 0-3 random planning applications
    const numApplications = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numApplications; i++) {
      const submittedDate = new Date();
      submittedDate.setFullYear(submittedDate.getFullYear() - Math.floor(Math.random() * 5));
      
      const decisionDate = new Date(submittedDate);
      decisionDate.setMonth(decisionDate.getMonth() + Math.floor(Math.random() * 6) + 1);
      
      applications.push({
        id: `app_${Date.now()}_${i}`,
        reference: `${submittedDate.getFullYear()}/${Math.floor(Math.random() * 9000) + 1000}`,
        description: this.getRandomPlanningDescription(),
        status: this.getRandomPlanningStatus(),
        submittedDate,
        decisionDate: Math.random() < 0.8 ? decisionDate : undefined,
      });
    }
    
    return applications;
  }

  private static getRandomPlanningDescription(): string {
    const descriptions = [
      'Single storey rear extension',
      'Loft conversion with dormer windows',
      'Two storey side extension',
      'Replacement windows and doors',
      'Garage conversion to habitable room',
      'Installation of solar panels',
      'New boundary fence',
      'Tree work in conservation area',
      'Change of use from commercial to residential',
      'Basement excavation and conversion',
    ];
    
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private static getRandomPlanningStatus(): string {
    const statuses = ['Approved', 'Refused', 'Pending', 'Withdrawn', 'Appeal Dismissed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private static extractCouncilArea(postcode: string): string {
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

    const prefix = postcode.substring(0, 2);
    return councilMapping[prefix] || 'Unknown Council Area';
  }
}