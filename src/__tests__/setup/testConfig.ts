import { performanceMonitor } from '../../lib/monitoring/performanceMonitor';

// Global test configuration
export const testConfig = {
  // Performance thresholds
  performance: {
    maxResponseTime: 5000, // 5 seconds
    maxMemoryIncrease: 100 * 1024 * 1024, // 100MB
    maxErrorRate: 0.05, // 5%
    minThroughput: 5, // 5 requests per second
  },

  // AI quality thresholds
  aiQuality: {
    minRelevanceScore: 0.6,
    minStructureScore: 0.7,
    minConsistencyScore: 0.8,
    minCompleteness: 0.9,
  },

  // Load testing configuration
  loadTesting: {
    concurrentUsers: 50,
    testDuration: 10000, // 10 seconds
    requestInterval: 200, // 200ms between requests
    sustainedLoadDuration: 30000, // 30 seconds
  },

  // Test data
  testData: {
    sampleProjects: [
      {
        projectType: 'kitchen-renovation',
        propertyType: 'terraced',
        budget: 30000,
        timeline: 10
      },
      {
        projectType: 'bathroom-renovation',
        propertyType: 'detached',
        budget: 18000,
        timeline: 6
      },
      {
        projectType: 'loft-conversion',
        propertyType: 'semi-detached',
        budget: 45000,
        timeline: 20
      }
    ],
    sampleBuilders: [
      {
        id: 'builder-001',
        name: 'Test Construction Ltd',
        specializations: ['kitchen', 'bathroom'],
        rating: 4.5
      },
      {
        id: 'builder-002',
        name: 'Premium Builders',
        specializations: ['loft-conversion', 'extension'],
        rating: 4.8
      }
    ]
  }
};

// Test utilities
export class TestUtils {
  static generateTestId(prefix: string = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const operationId = this.generateTestId('perf');
    
    performanceMonitor.startOperation(operationId);
    
    try {
      const result = await operation();
      const duration = performanceMonitor.endOperation(operationId, operationName, true);
      
      return { result, duration };
    } catch (error) {
      performanceMonitor.endOperation(operationId, operationName, false, error.message);
      throw error;
    }
  }

  static calculateRelevanceScore(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase();
    const matchedKeywords = keywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );
    return matchedKeywords.length / keywords.length;
  }

  static calculateStructureScore(text: string): number {
    let score = 0;
    
    // Check for proper sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) score += 0.3;
    
    // Check for paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) score += 0.3;
    
    // Check for lists or structured content
    if (text.includes('•') || text.includes('-') || text.includes('1.')) {
      score += 0.2;
    }
    
    // Check for proper capitalization
    const properCapitalization = sentences.every(s => 
      s.trim().charAt(0) === s.trim().charAt(0).toUpperCase()
    );
    if (properCapitalization) score += 0.2;
    
    return score;
  }

  static async waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static createMockContext(overrides: any = {}) {
    return {
      projectId: this.generateTestId('proj'),
      projectType: 'kitchen-renovation',
      propertyDetails: {
        propertyType: 'terraced',
        yearBuilt: 1960,
        ...overrides.propertyDetails
      },
      userResponses: {
        budget: '£30000',
        timeline: '10 weeks',
        ...overrides.userResponses
      },
      currentStep: 1,
      ...overrides
    };
  }

  static async runConcurrentOperations<T>(
    operations: (() => Promise<T>)[],
    maxConcurrency: number = 10
  ): Promise<PromiseSettledResult<T>[]> {
    const results: PromiseSettledResult<T>[] = [];
    
    for (let i = 0; i < operations.length; i += maxConcurrency) {
      const batch = operations.slice(i, i + maxConcurrency);
      const batchResults = await Promise.allSettled(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    return results;
  }

  static calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  static generateLoadTestData(count: number, baseData: any = {}) {
    return Array(count).fill(null).map((_, index) => ({
      ...baseData,
      id: this.generateTestId('load'),
      index,
      timestamp: new Date()
    }));
  }
}

// Test reporters
export class TestReporter {
  private static results: any[] = [];

  static addResult(testName: string, result: any): void {
    this.results.push({
      testName,
      result,
      timestamp: new Date()
    });
  }

  static generateReport(): string {
    const report = {
      summary: {
        totalTests: this.results.length,
        timestamp: new Date(),
        performance: this.generatePerformanceSummary(),
        quality: this.generateQualitySummary()
      },
      details: this.results
    };

    return JSON.stringify(report, null, 2);
  }

  private static generatePerformanceSummary() {
    const performanceResults = this.results.filter(r => 
      r.result.duration !== undefined
    );

    if (performanceResults.length === 0) return null;

    const durations = performanceResults.map(r => r.result.duration);
    
    return {
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95ResponseTime: TestUtils.calculatePercentile(durations, 95),
      p99ResponseTime: TestUtils.calculatePercentile(durations, 99),
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations)
    };
  }

  private static generateQualitySummary() {
    const qualityResults = this.results.filter(r => 
      r.result.qualityScore !== undefined
    );

    if (qualityResults.length === 0) return null;

    const scores = qualityResults.map(r => r.result.qualityScore);
    
    return {
      averageQualityScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      minQualityScore: Math.min(...scores),
      maxQualityScore: Math.max(...scores)
    };
  }

  static reset(): void {
    this.results = [];
  }
}

// This is a configuration file, not a test file
// Export configuration and utilities for use in actual test files