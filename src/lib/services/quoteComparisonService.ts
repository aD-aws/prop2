// Quote comparison and analysis service for homeowners

import { Quote, QuoteAnalysis, RedFlag, BuilderProfile, SoWDocument, Project } from '@/lib/types';
import { DynamoDBService } from '@/lib/aws/dynamodb';
import { AIAgentService } from './aiAgentService';

export interface QuoteComparison {
  quotes: Quote[];
  analysis: ComparisonAnalysis;
  recommendations: ComparisonRecommendation[];
  negotiationTips: NegotiationTip[];
  questionsToAsk: QuestionCategory[];
  redFlagSummary: RedFlagSummary;
}

export interface ComparisonAnalysis {
  priceRange: {
    lowest: number;
    highest: number;
    average: number;
    median: number;
  };
  timelineRange: {
    shortest: number;
    longest: number;
    average: number;
  };
  riskAssessment: {
    lowRisk: string[];
    mediumRisk: string[];
    highRisk: string[];
  };
  bestValue: {
    quoteId: string;
    reasoning: string;
  };
  fastestCompletion: {
    quoteId: string;
    reasoning: string;
  };
}

export interface ComparisonRecommendation {
  type: 'pricing' | 'timeline' | 'quality' | 'risk';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
}

export interface NegotiationTip {
  category: 'pricing' | 'timeline' | 'scope' | 'terms';
  tip: string;
  example?: string;
  whenToUse: string;
}

export interface QuestionCategory {
  category: string;
  questions: Question[];
}

export interface Question {
  question: string;
  importance: 'critical' | 'important' | 'nice-to-know';
  explanation: string;
}

export interface RedFlagSummary {
  totalFlags: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  flagsByBuilder: { [builderId: string]: RedFlag[] };
}

export class QuoteComparisonService {
  private static readonly BUILDERS_TABLE = 'uk-home-improvement-builders';
  private static readonly PROJECTS_TABLE = 'uk-home-improvement-projects';

  /**
   * Compare multiple quotes for a project
   */
  static async compareQuotes(
    projectId: string,
    quotes: Quote[]
  ): Promise<{ success: boolean; comparison?: QuoteComparison; error?: string }> {
    try {
      if (quotes.length < 2) {
        return { success: false, error: 'At least 2 quotes required for comparison' };
      }

      // Get project details for context
      const projectResult = await DynamoDBService.getItem(this.PROJECTS_TABLE, { id: projectId });
      const project = projectResult.Item as Project;
      
      // Get builder profiles for additional context
      const builderProfiles = await this.getBuilderProfiles(quotes.map(q => q.builderId));

      // Perform comprehensive analysis
      const analysis = this.analyzeQuotes(quotes, project?.sowDocument);
      const recommendations = await this.generateRecommendations(quotes, analysis, builderProfiles);
      const negotiationTips = this.getNegotiationTips(quotes, analysis);
      const questionsToAsk = this.getQuestionsToAsk(quotes, project?.projectType);
      const redFlagSummary = this.summarizeRedFlags(quotes);

      const comparison: QuoteComparison = {
        quotes,
        analysis,
        recommendations,
        negotiationTips,
        questionsToAsk,
        redFlagSummary
      };

      return { success: true, comparison };
    } catch (error) {
      console.error('Error comparing quotes:', error);
      return { success: false, error: 'Failed to compare quotes' };
    }
  }

  /**
   * Analyze quotes for comparison
   */
  private static analyzeQuotes(quotes: Quote[], sowDocument?: SoWDocument): ComparisonAnalysis {
    const prices = quotes.map(q => q.pricing.totalAmount);
    const timelines = quotes.map(q => q.timeline);

    // Price analysis
    const priceRange = {
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      average: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      median: this.calculateMedian(prices)
    };

    // Timeline analysis
    const timelineRange = {
      shortest: Math.min(...timelines),
      longest: Math.max(...timelines),
      average: timelines.reduce((sum, timeline) => sum + timeline, 0) / timelines.length
    };

    // Risk assessment
    const riskAssessment = this.assessRisks(quotes);

    // Best value analysis
    const bestValue = this.findBestValue(quotes, priceRange, timelineRange);

    // Fastest completion
    const fastestCompletion = this.findFastestCompletion(quotes);

    return {
      priceRange,
      timelineRange,
      riskAssessment,
      bestValue,
      fastestCompletion
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private static async generateRecommendations(
    quotes: Quote[],
    analysis: ComparisonAnalysis,
    builderProfiles: { [builderId: string]: BuilderProfile }
  ): Promise<ComparisonRecommendation[]> {
    const recommendations: ComparisonRecommendation[] = [];

    // Price variance recommendation
    const priceVariance = ((analysis.priceRange.highest - analysis.priceRange.lowest) / analysis.priceRange.average) * 100;
    if (priceVariance > 30) {
      recommendations.push({
        type: 'pricing',
        priority: 'high',
        title: 'Significant Price Variation Detected',
        description: `There's a ${priceVariance.toFixed(1)}% difference between the highest and lowest quotes. This warrants careful investigation.`,
        actionItems: [
          'Request detailed breakdowns from all builders',
          'Verify that all quotes include the same scope of work',
          'Ask about any exclusions or additional costs',
          'Consider if the lowest quote might be missing essential elements'
        ]
      });
    }

    // Timeline variance recommendation
    const timelineVariance = ((analysis.timelineRange.longest - analysis.timelineRange.shortest) / analysis.timelineRange.average) * 100;
    if (timelineVariance > 40) {
      recommendations.push({
        type: 'timeline',
        priority: 'high',
        title: 'Large Timeline Differences',
        description: `Project timelines vary by ${timelineVariance.toFixed(1)}%. Understand why some builders need significantly more time.`,
        actionItems: [
          'Ask builders to explain their timeline reasoning',
          'Verify availability and resource allocation',
          'Consider if faster timelines are realistic',
          'Check if longer timelines include weather contingencies'
        ]
      });
    }

    // High-risk builders recommendation
    if (analysis.riskAssessment.highRisk.length > 0) {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        title: 'High-Risk Quotes Identified',
        description: `${analysis.riskAssessment.highRisk.length} quote(s) have been flagged as high-risk due to various concerns.`,
        actionItems: [
          'Review red flags carefully for high-risk quotes',
          'Request additional documentation from flagged builders',
          'Consider excluding high-risk options',
          'Verify insurance and credentials thoroughly'
        ]
      });
    }

    // Builder experience recommendation
    const experiencedBuilders = Object.entries(builderProfiles)
      .filter(([_, profile]) => (profile.completedProjects || 0) > 10 && (profile.rating || 0) > 4.0)
      .map(([builderId, _]) => builderId);

    if (experiencedBuilders.length > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        title: 'Experienced Builders Available',
        description: `${experiencedBuilders.length} builder(s) have strong track records with 10+ completed projects and high ratings.`,
        actionItems: [
          'Prioritize builders with proven experience',
          'Review their reference projects',
          'Consider paying a premium for quality and reliability',
          'Check their specialization matches your project type'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Get negotiation tips based on quote analysis
   */
  private static getNegotiationTips(quotes: Quote[], analysis: ComparisonAnalysis): NegotiationTip[] {
    const tips: NegotiationTip[] = [
      {
        category: 'pricing',
        tip: 'Use competitive quotes as leverage, but focus on value rather than just price',
        example: '"Builder A quoted £X for similar work. Can you explain the difference in your pricing?"',
        whenToUse: 'When there\'s a significant price difference between quotes'
      },
      {
        category: 'timeline',
        tip: 'Negotiate start dates and completion guarantees',
        example: '"Can you commit to starting by [date] and completing by [date] with a penalty clause?"',
        whenToUse: 'When timeline is critical to your project'
      },
      {
        category: 'scope',
        tip: 'Clarify what\'s included and excluded to avoid surprises',
        example: '"Does this include all materials, permits, and cleanup? What would be additional?"',
        whenToUse: 'Always - scope creep is a common issue'
      },
      {
        category: 'terms',
        tip: 'Negotiate payment terms to protect yourself',
        example: '"I\'d prefer to pay 10% upfront, 40% at halfway point, and 50% on completion"',
        whenToUse: 'When builders ask for large upfront payments'
      }
    ];

    // Add specific tips based on analysis
    if (analysis.priceRange.highest / analysis.priceRange.lowest > 1.5) {
      tips.push({
        category: 'pricing',
        tip: 'With such varied pricing, focus on understanding what each quote includes',
        example: '"Your quote is significantly higher/lower. Can you walk me through what\'s included?"',
        whenToUse: 'When there\'s a wide price range between quotes'
      });
    }

    if (analysis.timelineRange.longest / analysis.timelineRange.shortest > 1.5) {
      tips.push({
        category: 'timeline',
        tip: 'When timelines vary significantly, question both very fast and very slow estimates',
        example: '"How are you able to complete this faster than others?" or "Why do you need more time?"',
        whenToUse: 'When timelines vary significantly'
      });
    }

    return tips;
  }

  /**
   * Get questions to ask builders based on project type and quotes
   */
  private static getQuestionsToAsk(quotes: Quote[], projectType?: string): QuestionCategory[] {
    const categories: QuestionCategory[] = [
      {
        category: 'Experience & Credentials',
        questions: [
          {
            question: 'How many similar projects have you completed in the last 2 years?',
            importance: 'critical',
            explanation: 'Recent experience is crucial for quality and efficiency'
          },
          {
            question: 'Can I visit a recent project similar to mine?',
            importance: 'critical',
            explanation: 'Seeing their work firsthand is the best quality indicator'
          },
          {
            question: 'What certifications and qualifications do you and your team have?',
            importance: 'important',
            explanation: 'Proper qualifications ensure work meets standards'
          },
          {
            question: 'Are you registered with any trade associations?',
            importance: 'important',
            explanation: 'Trade association membership indicates professionalism'
          }
        ]
      },
      {
        category: 'Project Planning & Timeline',
        questions: [
          {
            question: 'Can you provide a detailed project schedule with milestones?',
            importance: 'critical',
            explanation: 'A detailed schedule shows proper planning and helps track progress'
          },
          {
            question: 'What happens if the project runs over the agreed timeline?',
            importance: 'critical',
            explanation: 'Understanding delay policies protects you from extended disruption'
          },
          {
            question: 'How do you handle weather delays or unforeseen issues?',
            importance: 'important',
            explanation: 'Good builders have contingency plans for common delays'
          },
          {
            question: 'Will you be working on other projects simultaneously?',
            importance: 'important',
            explanation: 'Divided attention can lead to delays and quality issues'
          }
        ]
      },
      {
        category: 'Pricing & Payment',
        questions: [
          {
            question: 'Can you provide a detailed breakdown of all costs?',
            importance: 'critical',
            explanation: 'Transparency in pricing helps avoid surprises and disputes'
          },
          {
            question: 'What payment schedule do you require?',
            importance: 'critical',
            explanation: 'Avoid builders who demand large upfront payments'
          },
          {
            question: 'Are there any potential additional costs I should be aware of?',
            importance: 'critical',
            explanation: 'Understanding potential extras helps budget accurately'
          },
          {
            question: 'Do you offer any guarantees or warranties on your work?',
            importance: 'important',
            explanation: 'Good builders stand behind their work with guarantees'
          }
        ]
      },
      {
        category: 'Insurance & Legal',
        questions: [
          {
            question: 'Can I see current certificates for public liability and employer liability insurance?',
            importance: 'critical',
            explanation: 'Insurance protects you from liability if accidents occur'
          },
          {
            question: 'Do you handle all necessary permits and building regulations approval?',
            importance: 'critical',
            explanation: 'Proper permits are legally required and protect property value'
          },
          {
            question: 'What happens if your work doesn\'t pass building control inspection?',
            importance: 'important',
            explanation: 'The builder should be responsible for meeting regulations'
          }
        ]
      },
      {
        category: 'Communication & Management',
        questions: [
          {
            question: 'Who will be my main point of contact during the project?',
            importance: 'important',
            explanation: 'Clear communication channels prevent misunderstandings'
          },
          {
            question: 'How often will you provide progress updates?',
            importance: 'important',
            explanation: 'Regular updates help you stay informed and address issues early'
          },
          {
            question: 'How do you handle changes to the original scope?',
            importance: 'important',
            explanation: 'Clear change management prevents disputes over additional work'
          },
          {
            question: 'What are your working hours and will you notify neighbors?',
            importance: 'nice-to-know',
            explanation: 'Considerate builders maintain good neighbor relations'
          }
        ]
      }
    ];

    // Add project-specific questions based on project type
    if (projectType?.includes('extension') || projectType?.includes('loft') || projectType?.includes('basement')) {
      categories.push({
        category: 'Structural Work Specific',
        questions: [
          {
            question: 'Do you have a structural engineer on your team or do you work with one regularly?',
            importance: 'critical',
            explanation: 'Structural work requires proper engineering expertise'
          },
          {
            question: 'How do you ensure the existing structure isn\'t compromised during work?',
            importance: 'critical',
            explanation: 'Protecting existing structure is crucial for safety and value'
          },
          {
            question: 'What measures do you take to minimize disruption to the rest of the house?',
            importance: 'important',
            explanation: 'Good builders minimize dust, noise, and access issues'
          }
        ]
      });
    }

    return categories;
  }

  /**
   * Summarize red flags across all quotes
   */
  private static summarizeRedFlags(quotes: Quote[]): RedFlagSummary {
    const flagsByBuilder: { [builderId: string]: RedFlag[] } = {};
    let totalFlags = 0;
    let highSeverity = 0;
    let mediumSeverity = 0;
    let lowSeverity = 0;

    quotes.forEach(quote => {
      const flags = quote.aiAnalysis?.redFlags || [];
      flagsByBuilder[quote.builderId] = flags;
      totalFlags += flags.length;

      flags.forEach(flag => {
        switch (flag.severity) {
          case 'high':
            highSeverity++;
            break;
          case 'medium':
            mediumSeverity++;
            break;
          case 'low':
            lowSeverity++;
            break;
        }
      });
    });

    return {
      totalFlags,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      flagsByBuilder
    };
  }

  /**
   * Get builder profiles for quotes
   */
  private static async getBuilderProfiles(builderIds: string[]): Promise<{ [builderId: string]: BuilderProfile }> {
    const profiles: { [builderId: string]: BuilderProfile } = {};

    try {
      for (const builderId of builderIds) {
        const result = await DynamoDBService.getItem(this.BUILDERS_TABLE, { id: builderId });
        if (result.Item) {
          profiles[builderId] = result.Item as BuilderProfile;
        }
      }
    } catch (error) {
      console.error('Error getting builder profiles:', error);
    }

    return profiles;
  }

  /**
   * Assess risk levels for quotes
   */
  private static assessRisks(quotes: Quote[]): { lowRisk: string[]; mediumRisk: string[]; highRisk: string[] } {
    const lowRisk: string[] = [];
    const mediumRisk: string[] = [];
    const highRisk: string[] = [];

    quotes.forEach(quote => {
      const overallRisk = quote.aiAnalysis?.overallRisk || 'medium';
      
      switch (overallRisk) {
        case 'low':
          lowRisk.push(quote.id);
          break;
        case 'medium':
          mediumRisk.push(quote.id);
          break;
        case 'high':
          highRisk.push(quote.id);
          break;
      }
    });

    return { lowRisk, mediumRisk, highRisk };
  }

  /**
   * Find best value quote
   */
  private static findBestValue(
    quotes: Quote[],
    priceRange: ComparisonAnalysis['priceRange'],
    timelineRange: ComparisonAnalysis['timelineRange']
  ): { quoteId: string; reasoning: string } {
    // Score quotes based on price, timeline, and risk
    const scoredQuotes = quotes.map(quote => {
      const priceScore = 1 - ((quote.pricing.totalAmount - priceRange.lowest) / (priceRange.highest - priceRange.lowest));
      const timelineScore = 1 - ((quote.timeline - timelineRange.shortest) / (timelineRange.longest - timelineRange.shortest));
      const riskScore = quote.aiAnalysis?.overallRisk === 'low' ? 1 : quote.aiAnalysis?.overallRisk === 'medium' ? 0.5 : 0;
      
      const totalScore = (priceScore * 0.4) + (timelineScore * 0.3) + (riskScore * 0.3);
      
      return {
        quoteId: quote.id,
        score: totalScore,
        priceScore,
        timelineScore,
        riskScore
      };
    });

    const bestQuote = scoredQuotes.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      quoteId: bestQuote.quoteId,
      reasoning: `Best overall value considering price (${(bestQuote.priceScore * 100).toFixed(0)}%), timeline (${(bestQuote.timelineScore * 100).toFixed(0)}%), and risk assessment (${(bestQuote.riskScore * 100).toFixed(0)}%)`
    };
  }

  /**
   * Find fastest completion quote
   */
  private static findFastestCompletion(quotes: Quote[]): { quoteId: string; reasoning: string } {
    const fastestQuote = quotes.reduce((fastest, current) => 
      current.timeline < fastest.timeline ? current : fastest
    );

    const riskLevel = fastestQuote.aiAnalysis?.overallRisk || 'medium';
    const riskWarning = riskLevel === 'high' ? ' (Note: This quote has been flagged as high-risk)' : '';

    return {
      quoteId: fastestQuote.id,
      reasoning: `Shortest timeline at ${fastestQuote.timeline} working days${riskWarning}`
    };
  }

  /**
   * Calculate median value
   */
  private static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 !== 0 
      ? sorted[mid] 
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}