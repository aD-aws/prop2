import { performance } from 'perf_hooks';
import { AIAgentService } from '../../lib/services/aiAgentService';
import { AgentOrchestrator } from '../../lib/services/agentOrchestrator';
import { SoWGenerationService } from '../../lib/services/sowGenerationService';
import { QuoteManagementService } from '../../lib/services/quoteManagementService';
import { PaymentService } from '../../lib/services/paymentService';
import { ProjectType, ProjectContext } from '../../lib/types';

interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

describe('Performance and Load Testing', () => {
  let aiAgentService: AIAgentService;
  let orchestrator: AgentOrchestrator;
  let sowService: SoWGenerationService;
  let quoteService: QuoteManagementService;
  let paymentService: PaymentService;

  beforeEach(() => {
    aiAgentService = new AIAgentService();
    orchestrator = new AgentOrchestrator();
    sowService = new SoWGenerationService();
    quoteService = new QuoteManagementService();
    paymentService = new PaymentService();
  });

  describe('AI Agent Performance Testing', () => {
    it('should handle concurrent agent invocations efficiently', async () => {
      const concurrentRequests = 50;
      const context: ProjectContext = {
        projectId: 'load-test-001',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'terraced' },
        userResponses: { budget: '£30000' },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        context.projectType,
        context.propertyDetails
      );

      const orchestratorAgent = agents.find(a => a.isOrchestrator);
      expect(orchestratorAgent).toBeDefined();

      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      // Create concurrent requests
      const requests = Array(concurrentRequests).fill(null).map((_, index) => ({
        ...context,
        projectId: `load-test-${index}`
      }));

      const results = await Promise.allSettled(
        requests.map(ctx => aiAgentService.invokeAgent(orchestratorAgent!.id, ctx))
      );

      const endTime = performance.now();
      const endMemory = process.memoryUsage();

      // Calculate metrics
      const executionTime = endTime - startTime;
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
      const errorRate = (concurrentRequests - successfulRequests) / concurrentRequests;
      const throughput = successfulRequests / (executionTime / 1000); // requests per second
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

      // Performance assertions
      expect(errorRate).toBeLessThan(0.05); // Less than 5% error rate
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
      expect(executionTime).toBeLessThan(15000); // Complete within 15 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase

      console.log(`Concurrent Agent Performance:
        - Requests: ${concurrentRequests}
        - Success Rate: ${((1 - errorRate) * 100).toFixed(2)}%
        - Throughput: ${throughput.toFixed(2)} req/sec
        - Total Time: ${executionTime.toFixed(2)}ms
        - Memory Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }, 30000);

    it('should maintain performance under sustained load', async () => {
      const testDuration = 10000; // 10 seconds
      const requestInterval = 200; // Request every 200ms
      const context: ProjectContext = {
        projectId: 'sustained-load-test',
        projectType: ProjectType.BATHROOM_RENOVATION,
        propertyDetails: { propertyType: 'detached' },
        userResponses: { budget: '£20000' },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        context.projectType,
        context.propertyDetails
      );

      const orchestratorAgent = agents.find(a => a.isOrchestrator);
      const responseTimes: number[] = [];
      const errors: Error[] = [];

      const startTime = performance.now();
      let requestCount = 0;

      // Sustained load test
      const loadTest = new Promise<void>((resolve) => {
        const interval = setInterval(async () => {
          if (performance.now() - startTime > testDuration) {
            clearInterval(interval);
            resolve();
            return;
          }

          const requestStart = performance.now();
          requestCount++;

          try {
            await aiAgentService.invokeAgent(orchestratorAgent!.id, {
              ...context,
              projectId: `sustained-${requestCount}`
            });
            
            const requestEnd = performance.now();
            responseTimes.push(requestEnd - requestStart);
          } catch (error) {
            errors.push(error as Error);
          }
        }, requestInterval);
      });

      await loadTest;

      // Calculate sustained load metrics
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const p95ResponseTime = calculatePercentile(responseTimes, 95);
      const p99ResponseTime = calculatePercentile(responseTimes, 99);
      const errorRate = errors.length / requestCount;

      // Performance assertions for sustained load
      expect(averageResponseTime).toBeLessThan(3000); // Average under 3 seconds
      expect(p95ResponseTime).toBeLessThan(5000); // 95th percentile under 5 seconds
      expect(p99ResponseTime).toBeLessThan(8000); // 99th percentile under 8 seconds
      expect(errorRate).toBeLessThan(0.1); // Less than 10% error rate

      console.log(`Sustained Load Performance:
        - Duration: ${testDuration}ms
        - Total Requests: ${requestCount}
        - Average Response Time: ${averageResponseTime.toFixed(2)}ms
        - P95 Response Time: ${p95ResponseTime.toFixed(2)}ms
        - P99 Response Time: ${p99ResponseTime.toFixed(2)}ms
        - Error Rate: ${(errorRate * 100).toFixed(2)}%`);
    }, 20000);
  });

  describe('SoW Generation Performance', () => {
    it('should generate SoW within acceptable time limits', async () => {
      const testCases = [
        {
          name: 'Simple Kitchen',
          context: {
            projectId: 'sow-perf-001',
            projectType: ProjectType.KITCHEN_RENOVATION,
            propertyDetails: { propertyType: 'terraced' },
            userResponses: { budget: '£25000', timeline: '8 weeks' },
            currentStep: 1
          },
          maxTime: 10000
        },
        {
          name: 'Complex Loft Conversion',
          context: {
            projectId: 'sow-perf-002',
            projectType: ProjectType.LOFT_CONVERSION,
            propertyDetails: { 
              propertyType: 'terraced',
              loftSpace: { headHeight: '2.2m', floorArea: '30sqm' }
            },
            userResponses: { 
              budget: '£50000', 
              timeline: '20 weeks',
              structuralWork: 'yes'
            },
            currentStep: 1
          },
          maxTime: 15000
        }
      ];

      for (const testCase of testCases) {
        const startTime = performance.now();

        const agents = await orchestrator.selectAgents(
          testCase.context.projectType,
          testCase.context.propertyDetails
        );

        const sowResult = await orchestrator.coordinateAgents(agents, testCase.context);

        const executionTime = performance.now() - startTime;

        expect(executionTime).toBeLessThan(testCase.maxTime);
        expect(sowResult.sowDocument).toBeDefined();
        expect(sowResult.ganttChart).toBeDefined();

        console.log(`${testCase.name} SoW Generation: ${executionTime.toFixed(2)}ms`);
      }
    });

    it('should handle multiple concurrent SoW generations', async () => {
      const concurrentSoWs = 10;
      const contexts = Array(concurrentSoWs).fill(null).map((_, index) => ({
        projectId: `concurrent-sow-${index}`,
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'detached' },
        userResponses: { budget: `£${30000 + index * 1000}` },
        currentStep: 1
      }));

      const startTime = performance.now();

      const results = await Promise.allSettled(
        contexts.map(async context => {
          const agents = await orchestrator.selectAgents(
            context.projectType,
            context.propertyDetails
          );
          return orchestrator.coordinateAgents(agents, context);
        })
      );

      const executionTime = performance.now() - startTime;
      const successfulResults = results.filter(r => r.status === 'fulfilled').length;

      expect(successfulResults).toBeGreaterThan(concurrentSoWs * 0.8); // At least 80% success
      expect(executionTime).toBeLessThan(20000); // Complete within 20 seconds

      console.log(`Concurrent SoW Generation:
        - Count: ${concurrentSoWs}
        - Success Rate: ${(successfulResults / concurrentSoWs * 100).toFixed(2)}%
        - Total Time: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Database Performance Testing', () => {
    it('should handle high-volume quote operations efficiently', async () => {
      const operationCount = 100;
      const operations: Promise<any>[] = [];

      const startTime = performance.now();

      // Mix of read and write operations
      for (let i = 0; i < operationCount; i++) {
        if (i % 3 === 0) {
          // Create quote
          operations.push(
            quoteService.createQuote({
              projectId: `perf-test-${i}`,
              builderId: `builder-${i}`,
              totalCost: 25000 + i * 100,
              timeline: 8 + (i % 4),
              materials: [`Material ${i}`, `Material ${i + 1}`],
              laborRequirements: [`Labor ${i}`]
            })
          );
        } else {
          // Read quotes
          operations.push(
            quoteService.getQuotesByProject(`perf-test-${i % 10}`)
          );
        }
      }

      const results = await Promise.allSettled(operations);
      const executionTime = performance.now() - startTime;

      const successfulOperations = results.filter(r => r.status === 'fulfilled').length;
      const throughput = successfulOperations / (executionTime / 1000);

      expect(successfulOperations / operationCount).toBeGreaterThan(0.95); // 95% success rate
      expect(throughput).toBeGreaterThan(10); // At least 10 operations per second

      console.log(`Database Performance:
        - Operations: ${operationCount}
        - Success Rate: ${(successfulOperations / operationCount * 100).toFixed(2)}%
        - Throughput: ${throughput.toFixed(2)} ops/sec
        - Total Time: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Payment Processing Performance', () => {
    it('should process payments efficiently under load', async () => {
      const paymentCount = 50;
      const payments = Array(paymentCount).fill(null).map((_, index) => ({
        amount: 1000 + index * 10,
        currency: 'GBP',
        customerId: `customer-${index}`,
        subscriptionPlan: 'professional',
        paymentMethodId: 'pm_test_card'
      }));

      const startTime = performance.now();

      const results = await Promise.allSettled(
        payments.map(payment => paymentService.processSubscriptionPayment(payment))
      );

      const executionTime = performance.now() - startTime;
      const successfulPayments = results.filter(r => r.status === 'fulfilled').length;

      expect(successfulPayments / paymentCount).toBeGreaterThan(0.9); // 90% success rate
      expect(executionTime).toBeLessThan(30000); // Complete within 30 seconds

      console.log(`Payment Processing Performance:
        - Payments: ${paymentCount}
        - Success Rate: ${(successfulPayments / paymentCount * 100).toFixed(2)}%
        - Total Time: ${executionTime.toFixed(2)}ms`);
    });
  });

  describe('Memory and Resource Monitoring', () => {
    it('should not have memory leaks during extended operations', async () => {
      const initialMemory = process.memoryUsage();
      const operationCount = 100;

      // Perform many operations
      for (let i = 0; i < operationCount; i++) {
        const context: ProjectContext = {
          projectId: `memory-test-${i}`,
          projectType: ProjectType.KITCHEN_RENOVATION,
          propertyDetails: { propertyType: 'terraced' },
          userResponses: { budget: '£30000' },
          currentStep: 1
        };

        const agents = await orchestrator.selectAgents(
          context.projectType,
          context.propertyDetails
        );

        const orchestratorAgent = agents.find(a => a.isOrchestrator);
        if (orchestratorAgent) {
          await aiAgentService.invokeAgent(orchestratorAgent.id, context);
        }

        // Force garbage collection periodically
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }

      // Force final garbage collection
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase

      console.log(`Memory Usage:
        - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }, 60000);
  });

  describe('Stress Testing', () => {
    it('should handle extreme load gracefully', async () => {
      const extremeLoad = 200;
      const context: ProjectContext = {
        projectId: 'stress-test',
        projectType: ProjectType.KITCHEN_RENOVATION,
        propertyDetails: { propertyType: 'terraced' },
        userResponses: { budget: '£30000' },
        currentStep: 1
      };

      const agents = await orchestrator.selectAgents(
        context.projectType,
        context.propertyDetails
      );

      const orchestratorAgent = agents.find(a => a.isOrchestrator);

      const startTime = performance.now();

      const results = await Promise.allSettled(
        Array(extremeLoad).fill(null).map((_, index) =>
          aiAgentService.invokeAgent(orchestratorAgent!.id, {
            ...context,
            projectId: `stress-${index}`
          })
        )
      );

      const executionTime = performance.now() - startTime;
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;

      // Under extreme load, we expect some degradation but not complete failure
      expect(successfulRequests / extremeLoad).toBeGreaterThan(0.5); // At least 50% success
      expect(executionTime).toBeLessThan(60000); // Complete within 60 seconds

      console.log(`Stress Test Results:
        - Load: ${extremeLoad} requests
        - Success Rate: ${(successfulRequests / extremeLoad * 100).toFixed(2)}%
        - Total Time: ${executionTime.toFixed(2)}ms
        - Throughput: ${(successfulRequests / (executionTime / 1000)).toFixed(2)} req/sec`);
    }, 90000);
  });

  // Helper function to calculate percentiles
  function calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
});