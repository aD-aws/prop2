import { LaborRequirement, ProjectType } from '../types';

export interface TradeRate {
  trade: string;
  dailyRate: number;
  hourlyRate: number;
  region: string;
  skillLevel: 'apprentice' | 'skilled' | 'specialist';
  lastUpdated: Date;
}

export interface LaborCalculation {
  laborRequirement: LaborRequirement;
  tradeRate: TradeRate;
  totalCost: number;
  breakdown: {
    baseCost: number;
    complexityMultiplier: number;
    regionMultiplier: number;
    urgencyMultiplier: number;
  };
}

export interface ProjectComplexityFactors {
  projectType: ProjectType;
  complexityScore: number; // 1-5 scale
  factors: {
    structural: number;
    electrical: number;
    plumbing: number;
    finishing: number;
    access: number;
  };
}

export class LaborCostService {
  private tradeRates: Map<string, TradeRate[]> = new Map();
  private complexityFactors: Map<ProjectType, ProjectComplexityFactors> = new Map();

  constructor() {
    this.initializeTradeRates();
    this.initializeComplexityFactors();
  }

  /**
   * Calculate labor costs for all requirements
   */
  async calculateLaborCosts(
    laborRequirements: LaborRequirement[],
    projectType: ProjectType,
    userResponses: Record<string, any>
  ): Promise<LaborRequirement[]> {
    const calculations: LaborRequirement[] = [];

    for (const requirement of laborRequirements) {
      const calculation = await this.calculateSingleLaborCost(
        requirement,
        projectType,
        userResponses
      );
      calculations.push(calculation);
    }

    return calculations;
  }

  /**
   * Calculate cost for a single labor requirement
   */
  private async calculateSingleLaborCost(
    requirement: LaborRequirement,
    projectType: ProjectType,
    userResponses: Record<string, any>
  ): Promise<LaborRequirement> {
    // Get trade rate for this requirement
    const tradeRate = this.getTradeRate(requirement.trade, userResponses.region || 'london');
    
    // Get complexity factors
    const complexityFactor = this.getComplexityFactor(projectType, requirement.trade);
    
    // Calculate base cost
    const baseCost = requirement.personDays * tradeRate.dailyRate;
    
    // Apply multipliers
    const complexityMultiplier = complexityFactor;
    const regionMultiplier = this.getRegionMultiplier(userResponses.region || 'london');
    const urgencyMultiplier = this.getUrgencyMultiplier(userResponses.timeline || 'normal');
    
    const totalCost = baseCost * complexityMultiplier * regionMultiplier * urgencyMultiplier;

    return {
      ...requirement,
      estimatedCost: Math.round(totalCost),
      qualifications: [
        ...requirement.qualifications,
        `Daily rate: £${tradeRate.dailyRate}`,
        `Complexity factor: ${complexityMultiplier.toFixed(2)}`,
        `Region: ${userResponses.region || 'London'} (${regionMultiplier.toFixed(2)}x)`,
        `Timeline: ${userResponses.timeline || 'Normal'} (${urgencyMultiplier.toFixed(2)}x)`
      ]
    };
  }

  /**
   * Get trade rate for specific trade and region
   */
  private getTradeRate(trade: string, region: string): TradeRate {
    const rates = this.tradeRates.get(trade.toLowerCase()) || [];
    
    // Find rate for specific region or use default
    let rate = rates.find(r => r.region.toLowerCase() === region.toLowerCase());
    
    if (!rate) {
      // Use London rates as default
      rate = rates.find(r => r.region.toLowerCase() === 'london');
    }
    
    if (!rate) {
      // Fallback to generic rate
      rate = {
        trade,
        dailyRate: 200,
        hourlyRate: 25,
        region: 'UK Average',
        skillLevel: 'skilled',
        lastUpdated: new Date()
      };
    }

    return rate;
  }

  /**
   * Get complexity factor for project type and trade
   */
  private getComplexityFactor(projectType: ProjectType, trade: string): number {
    const projectComplexity = this.complexityFactors.get(projectType);
    
    if (!projectComplexity) {
      return 1.0; // Default multiplier
    }

    // Map trade to complexity factor
    const tradeFactorMap: Record<string, keyof ProjectComplexityFactors['factors']> = {
      'carpenter': 'structural',
      'joiner': 'structural',
      'electrician': 'electrical',
      'plumber': 'plumbing',
      'plasterer': 'finishing',
      'decorator': 'finishing',
      'tiler': 'finishing',
      'roofer': 'structural',
      'bricklayer': 'structural',
      'general builder': 'structural'
    };

    const factorKey = tradeFactorMap[trade.toLowerCase()] || 'structural';
    return projectComplexity.factors[factorKey];
  }

  /**
   * Get region multiplier for labor costs
   */
  private getRegionMultiplier(region: string): number {
    const regionMultipliers: Record<string, number> = {
      'london': 1.3,
      'south east': 1.2,
      'south west': 1.1,
      'east': 1.1,
      'west midlands': 1.0,
      'east midlands': 0.95,
      'yorkshire': 0.9,
      'north west': 0.9,
      'north east': 0.85,
      'scotland': 0.9,
      'wales': 0.85,
      'northern ireland': 0.8
    };

    return regionMultipliers[region.toLowerCase()] || 1.0;
  }

  /**
   * Get urgency multiplier based on timeline
   */
  private getUrgencyMultiplier(timeline: string): number {
    const urgencyMultipliers: Record<string, number> = {
      'urgent': 1.3,        // Within 1 month
      'fast': 1.15,         // Within 1-3 months
      'normal': 1.0,        // Within 3-6 months
      'flexible': 0.95      // 6+ months
    };

    return urgencyMultipliers[timeline.toLowerCase()] || 1.0;
  }

  /**
   * Calculate person-days for specific tasks
   */
  calculatePersonDays(
    taskDescription: string,
    projectSize: number,
    complexity: 'low' | 'medium' | 'high'
  ): number {
    // Base person-days calculation
    let baseDays = 1;

    // Task-specific calculations
    const taskLower = taskDescription.toLowerCase();
    
    if (taskLower.includes('kitchen')) {
      baseDays = projectSize * 0.5; // 0.5 days per m²
    } else if (taskLower.includes('bathroom')) {
      baseDays = projectSize * 0.8; // 0.8 days per m²
    } else if (taskLower.includes('electrical rewiring')) {
      baseDays = projectSize * 0.3; // 0.3 days per m²
    } else if (taskLower.includes('plumbing')) {
      baseDays = projectSize * 0.4; // 0.4 days per m²
    } else if (taskLower.includes('plastering')) {
      baseDays = projectSize * 0.2; // 0.2 days per m²
    } else if (taskLower.includes('tiling')) {
      baseDays = projectSize * 0.6; // 0.6 days per m²
    } else if (taskLower.includes('flooring')) {
      baseDays = projectSize * 0.3; // 0.3 days per m²
    } else if (taskLower.includes('painting')) {
      baseDays = projectSize * 0.15; // 0.15 days per m²
    }

    // Apply complexity multiplier
    const complexityMultipliers = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.4
    };

    return Math.max(0.5, baseDays * complexityMultipliers[complexity]);
  }

  /**
   * Get labor cost breakdown by trade
   */
  getLaborCostBreakdown(laborRequirements: LaborRequirement[]): {
    byTrade: Record<string, number>;
    totalCost: number;
    totalPersonDays: number;
  } {
    const byTrade: Record<string, number> = {};
    let totalCost = 0;
    let totalPersonDays = 0;

    laborRequirements.forEach(req => {
      const cost = req.estimatedCost || 0;
      byTrade[req.trade] = (byTrade[req.trade] || 0) + cost;
      totalCost += cost;
      totalPersonDays += req.personDays;
    });

    return {
      byTrade,
      totalCost,
      totalPersonDays
    };
  }

  /**
   * Estimate project duration based on labor requirements
   */
  estimateProjectDuration(laborRequirements: LaborRequirement[]): {
    sequentialDays: number;
    parallelDays: number;
    recommendedDuration: number;
  } {
    // Calculate if all work done sequentially
    const sequentialDays = laborRequirements.reduce((sum, req) => sum + req.personDays, 0);

    // Estimate parallel work opportunities
    const tradeGroups = this.groupTradesByParallelism(laborRequirements);
    const parallelDays = Math.max(...tradeGroups.map(group => 
      group.reduce((sum, req) => sum + req.personDays, 0)
    ));

    // Recommended duration considers dependencies and coordination
    const recommendedDuration = Math.ceil(parallelDays * 1.2); // 20% buffer for coordination

    return {
      sequentialDays,
      parallelDays,
      recommendedDuration
    };
  }

  /**
   * Group trades by parallel work opportunities
   */
  private groupTradesByParallelism(laborRequirements: LaborRequirement[]): LaborRequirement[][] {
    // Simplified grouping - in reality this would be more complex
    const firstFix = laborRequirements.filter(req => 
      ['electrician', 'plumber', 'carpenter'].includes(req.trade.toLowerCase())
    );
    
    const secondFix = laborRequirements.filter(req => 
      ['plasterer', 'decorator', 'tiler', 'flooring specialist'].includes(req.trade.toLowerCase())
    );

    const structural = laborRequirements.filter(req => 
      ['bricklayer', 'roofer', 'general builder'].includes(req.trade.toLowerCase())
    );

    return [structural, firstFix, secondFix].filter(group => group.length > 0);
  }

  /**
   * Initialize trade rates database
   */
  private initializeTradeRates(): void {
    const trades = [
      {
        trade: 'electrician',
        rates: [
          { region: 'London', dailyRate: 280, hourlyRate: 35, skillLevel: 'skilled' as const },
          { region: 'South East', dailyRate: 240, hourlyRate: 30, skillLevel: 'skilled' as const },
          { region: 'North', dailyRate: 200, hourlyRate: 25, skillLevel: 'skilled' as const }
        ]
      },
      {
        trade: 'plumber',
        rates: [
          { region: 'London', dailyRate: 260, hourlyRate: 32, skillLevel: 'skilled' as const },
          { region: 'South East', dailyRate: 220, hourlyRate: 28, skillLevel: 'skilled' as const },
          { region: 'North', dailyRate: 180, hourlyRate: 23, skillLevel: 'skilled' as const }
        ]
      },
      {
        trade: 'carpenter',
        rates: [
          { region: 'London', dailyRate: 240, hourlyRate: 30, skillLevel: 'skilled' as const },
          { region: 'South East', dailyRate: 200, hourlyRate: 25, skillLevel: 'skilled' as const },
          { region: 'North', dailyRate: 170, hourlyRate: 21, skillLevel: 'skilled' as const }
        ]
      },
      {
        trade: 'plasterer',
        rates: [
          { region: 'London', dailyRate: 220, hourlyRate: 28, skillLevel: 'skilled' as const },
          { region: 'South East', dailyRate: 190, hourlyRate: 24, skillLevel: 'skilled' as const },
          { region: 'North', dailyRate: 160, hourlyRate: 20, skillLevel: 'skilled' as const }
        ]
      },
      {
        trade: 'tiler',
        rates: [
          { region: 'London', dailyRate: 200, hourlyRate: 25, skillLevel: 'skilled' as const },
          { region: 'South East', dailyRate: 170, hourlyRate: 21, skillLevel: 'skilled' as const },
          { region: 'North', dailyRate: 140, hourlyRate: 18, skillLevel: 'skilled' as const }
        ]
      },
      {
        trade: 'decorator',
        rates: [
          { region: 'London', dailyRate: 180, hourlyRate: 23, skillLevel: 'skilled' as const },
          { region: 'South East', dailyRate: 150, hourlyRate: 19, skillLevel: 'skilled' as const },
          { region: 'North', dailyRate: 130, hourlyRate: 16, skillLevel: 'skilled' as const }
        ]
      },
      {
        trade: 'general builder',
        rates: [
          { region: 'London', dailyRate: 250, hourlyRate: 31, skillLevel: 'skilled' as const },
          { region: 'South East', dailyRate: 210, hourlyRate: 26, skillLevel: 'skilled' as const },
          { region: 'North', dailyRate: 180, hourlyRate: 23, skillLevel: 'skilled' as const }
        ]
      }
    ];

    trades.forEach(({ trade, rates }) => {
      const tradeRates = rates.map(rate => ({
        trade,
        ...rate,
        lastUpdated: new Date()
      }));
      this.tradeRates.set(trade, tradeRates);
    });
  }

  /**
   * Initialize complexity factors for different project types
   */
  private initializeComplexityFactors(): void {
    const complexityData: Array<{ projectType: ProjectType; factors: ProjectComplexityFactors }> = [
      {
        projectType: 'kitchen_full_refit',
        factors: {
          projectType: 'kitchen_full_refit',
          complexityScore: 3,
          factors: {
            structural: 1.2,
            electrical: 1.4,
            plumbing: 1.5,
            finishing: 1.3,
            access: 1.1
          }
        }
      },
      {
        projectType: 'bathroom_full_refit',
        factors: {
          projectType: 'bathroom_full_refit',
          complexityScore: 4,
          factors: {
            structural: 1.1,
            electrical: 1.3,
            plumbing: 1.6,
            finishing: 1.4,
            access: 1.2
          }
        }
      },
      {
        projectType: 'loft_conversion_dormer',
        factors: {
          projectType: 'loft_conversion_dormer',
          complexityScore: 5,
          factors: {
            structural: 1.8,
            electrical: 1.3,
            plumbing: 1.2,
            finishing: 1.2,
            access: 1.5
          }
        }
      },
      {
        projectType: 'rear_extension_single_storey',
        factors: {
          projectType: 'rear_extension_single_storey',
          complexityScore: 4,
          factors: {
            structural: 1.6,
            electrical: 1.2,
            plumbing: 1.3,
            finishing: 1.2,
            access: 1.1
          }
        }
      }
    ];

    complexityData.forEach(({ projectType, factors }) => {
      this.complexityFactors.set(projectType, factors);
    });
  }

  /**
   * Update trade rate
   */
  updateTradeRate(trade: string, region: string, newRate: Omit<TradeRate, 'trade' | 'lastUpdated'>): void {
    const rates = this.tradeRates.get(trade.toLowerCase()) || [];
    const existingIndex = rates.findIndex(r => r.region.toLowerCase() === region.toLowerCase());
    
    const updatedRate: TradeRate = {
      trade,
      ...newRate,
      lastUpdated: new Date()
    };

    if (existingIndex >= 0) {
      rates[existingIndex] = updatedRate;
    } else {
      rates.push(updatedRate);
    }

    this.tradeRates.set(trade.toLowerCase(), rates);
  }

  /**
   * Get all trade rates
   */
  getAllTradeRates(): Map<string, TradeRate[]> {
    return new Map(this.tradeRates);
  }

  /**
   * Get average daily rate for a trade
   */
  getAverageDailyRate(trade: string): number {
    const rates = this.tradeRates.get(trade.toLowerCase()) || [];
    if (rates.length === 0) return 200; // Default rate

    const sum = rates.reduce((total, rate) => total + rate.dailyRate, 0);
    return sum / rates.length;
  }
}

export const laborCostService = new LaborCostService();