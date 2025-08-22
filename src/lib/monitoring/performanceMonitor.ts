import { performance } from 'perf_hooks';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
  timestamp: Date;
}

export interface OperationMetrics {
  operationName: string;
  duration: number;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private operationMetrics: OperationMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private activeOperations: Map<string, number> = new Map();
  private alertThresholds: Map<string, number> = new Map();
  private alertCallbacks: Map<string, (metric: PerformanceMetric) => void> = new Map();

  constructor() {
    // Set default alert thresholds
    this.setAlertThreshold('response_time', 5000); // 5 seconds
    this.setAlertThreshold('memory_usage', 500 * 1024 * 1024); // 500MB
    this.setAlertThreshold('error_rate', 0.1); // 10%

    // Start system monitoring
    this.startSystemMonitoring();
  }

  /**
   * Start timing an operation
   */
  startOperation(operationId: string): void {
    this.activeOperations.set(operationId, performance.now());
  }

  /**
   * End timing an operation and record metrics
   */
  endOperation(
    operationId: string, 
    operationName: string, 
    success: boolean = true,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): number {
    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      throw new Error(`Operation ${operationId} was not started`);
    }

    const duration = performance.now() - startTime;
    this.activeOperations.delete(operationId);

    const operationMetric: OperationMetrics = {
      operationName,
      duration,
      success,
      errorMessage,
      timestamp: new Date(),
      metadata
    };

    this.operationMetrics.push(operationMetric);

    // Record performance metric
    this.recordMetric('operation_duration', duration, 'ms', {
      operation: operationName,
      success: success.toString()
    });

    // Check for alerts
    this.checkAlert('response_time', duration);

    return duration;
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string, 
    value: number, 
    unit: string = '', 
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);

    // Check for alerts
    this.checkAlert(name, value);
  }

  /**
   * Record system metrics
   */
  recordSystemMetrics(): SystemMetrics {
    const systemMetric: SystemMetrics = {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      timestamp: new Date()
    };

    this.systemMetrics.push(systemMetric);

    // Record individual metrics for alerting
    this.recordMetric('memory_heap_used', systemMetric.memoryUsage.heapUsed, 'bytes');
    this.recordMetric('memory_heap_total', systemMetric.memoryUsage.heapTotal, 'bytes');
    this.recordMetric('memory_external', systemMetric.memoryUsage.external, 'bytes');
    this.recordMetric('cpu_user', systemMetric.cpuUsage.user, 'microseconds');
    this.recordMetric('cpu_system', systemMetric.cpuUsage.system, 'microseconds');

    return systemMetric;
  }

  /**
   * Get metrics by name within a time range
   */
  getMetrics(
    name?: string, 
    startTime?: Date, 
    endTime?: Date
  ): PerformanceMetric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === name);
    }

    if (startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
    }

    return filteredMetrics;
  }

  /**
   * Get operation metrics
   */
  getOperationMetrics(
    operationName?: string,
    startTime?: Date,
    endTime?: Date
  ): OperationMetrics[] {
    let filteredMetrics = this.operationMetrics;

    if (operationName) {
      filteredMetrics = filteredMetrics.filter(m => m.operationName === operationName);
    }

    if (startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
    }

    return filteredMetrics;
  }

  /**
   * Calculate statistics for a metric
   */
  calculateStatistics(metricName: string, timeWindow?: number): {
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const now = new Date();
    const startTime = timeWindow ? new Date(now.getTime() - timeWindow) : undefined;
    
    const metrics = this.getMetrics(metricName, startTime);
    const values = metrics.map(m => m.value).sort((a, b) => a - b);

    if (values.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;

    return {
      count: values.length,
      average,
      min: values[0],
      max: values[values.length - 1],
      p50: this.calculatePercentile(values, 50),
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99)
    };
  }

  /**
   * Calculate error rate for operations
   */
  calculateErrorRate(operationName?: string, timeWindow?: number): number {
    const now = new Date();
    const startTime = timeWindow ? new Date(now.getTime() - timeWindow) : undefined;
    
    const operations = this.getOperationMetrics(operationName, startTime);
    
    if (operations.length === 0) return 0;

    const errorCount = operations.filter(op => !op.success).length;
    return errorCount / operations.length;
  }

  /**
   * Set alert threshold for a metric
   */
  setAlertThreshold(metricName: string, threshold: number): void {
    this.alertThresholds.set(metricName, threshold);
  }

  /**
   * Set alert callback for a metric
   */
  setAlertCallback(metricName: string, callback: (metric: PerformanceMetric) => void): void {
    this.alertCallbacks.set(metricName, callback);
  }

  /**
   * Check if metric exceeds threshold and trigger alert
   */
  private checkAlert(metricName: string, value: number): void {
    const threshold = this.alertThresholds.get(metricName);
    const callback = this.alertCallbacks.get(metricName);

    if (threshold && value > threshold && callback) {
      const metric: PerformanceMetric = {
        name: metricName,
        value,
        unit: '',
        timestamp: new Date()
      };
      
      callback(metric);
    }
  }

  /**
   * Start periodic system monitoring
   */
  private startSystemMonitoring(): void {
    // Record system metrics every 30 seconds
    setInterval(() => {
      this.recordSystemMetrics();
    }, 30000);
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)] || 0;
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      memoryUsage: number;
      cpuUsage: number;
      errorRate: number;
      averageResponseTime: number;
    };
    alerts: string[];
  } {
    const recentMetrics = this.calculateStatistics('operation_duration', 300000); // Last 5 minutes
    const errorRate = this.calculateErrorRate(undefined, 300000);
    const latestSystemMetrics = this.systemMetrics[this.systemMetrics.length - 1];

    const memoryUsagePercent = latestSystemMetrics ? 
      (latestSystemMetrics.memoryUsage.heapUsed / latestSystemMetrics.memoryUsage.heapTotal) * 100 : 0;

    const alerts: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // Check memory usage
    if (memoryUsagePercent > 90) {
      alerts.push('High memory usage');
      status = 'critical';
    } else if (memoryUsagePercent > 75) {
      alerts.push('Elevated memory usage');
      if (status === 'healthy') status = 'warning';
    }

    // Check error rate
    if (errorRate > 0.2) {
      alerts.push('High error rate');
      status = 'critical';
    } else if (errorRate > 0.1) {
      alerts.push('Elevated error rate');
      if (status === 'healthy') status = 'warning';
    }

    // Check response time
    if (recentMetrics.p95 > 10000) {
      alerts.push('High response times');
      status = 'critical';
    } else if (recentMetrics.p95 > 5000) {
      alerts.push('Elevated response times');
      if (status === 'healthy') status = 'warning';
    }

    return {
      status,
      metrics: {
        memoryUsage: memoryUsagePercent,
        cpuUsage: 0, // Would need more complex calculation for actual CPU usage
        errorRate: errorRate * 100,
        averageResponseTime: recentMetrics.average
      },
      alerts
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.exportPrometheusMetrics();
    }

    return JSON.stringify({
      metrics: this.metrics,
      operationMetrics: this.operationMetrics,
      systemMetrics: this.systemMetrics,
      statistics: {
        operationDuration: this.calculateStatistics('operation_duration'),
        memoryUsage: this.calculateStatistics('memory_heap_used'),
        errorRate: this.calculateErrorRate()
      }
    }, null, 2);
  }

  /**
   * Export metrics in Prometheus format
   */
  private exportPrometheusMetrics(): string {
    const lines: string[] = [];

    // Group metrics by name
    const metricGroups = new Map<string, PerformanceMetric[]>();
    this.metrics.forEach(metric => {
      if (!metricGroups.has(metric.name)) {
        metricGroups.set(metric.name, []);
      }
      metricGroups.get(metric.name)!.push(metric);
    });

    // Export each metric group
    metricGroups.forEach((metrics, name) => {
      const sanitizedName = name.replace(/[^a-zA-Z0-9_]/g, '_');
      
      lines.push(`# HELP ${sanitizedName} ${name} metric`);
      lines.push(`# TYPE ${sanitizedName} gauge`);
      
      metrics.forEach(metric => {
        const labels = metric.tags ? 
          Object.entries(metric.tags).map(([key, value]) => `${key}="${value}"`).join(',') : '';
        
        lines.push(`${sanitizedName}{${labels}} ${metric.value} ${metric.timestamp.getTime()}`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanup(retentionPeriod: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = new Date(Date.now() - retentionPeriod);

    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    this.operationMetrics = this.operationMetrics.filter(m => m.timestamp > cutoffTime);
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffTime);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();