import puppeteer, { Browser, Page } from 'puppeteer';
import { CouncilScrapingConfig, PlanningApplication } from './planningPermissionDataMiningService';

export interface ScrapingResult {
  success: boolean;
  applications: Partial<PlanningApplication>[];
  errors: string[];
  scrapedCount: number;
}

export class CouncilWebScraperService {
  private browser: Browser | null = null;
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  /**
   * Initialize browser for scraping
   */
  async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  /**
   * Close browser and cleanup
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape planning applications from a council website
   */
  async scrapeCouncilApplications(config: CouncilScrapingConfig): Promise<ScrapingResult> {
    const result: ScrapingResult = {
      success: false,
      applications: [],
      errors: [],
      scrapedCount: 0
    };

    try {
      await this.initializeBrowser();
      
      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }

      const page = await this.browser.newPage();
      await this.setupPage(page);

      // Navigate to council planning search page
      await page.goto(config.baseUrl + config.searchEndpoint, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Perform search for recent applications
      const applications = await this.searchRecentApplications(page, config);
      
      // Extract detailed information for each application
      for (const app of applications) {
        try {
          const detailedApp = await this.extractApplicationDetails(page, app, config);
          result.applications.push(detailedApp);
          result.scrapedCount++;
          
          // Add delay to respect rate limits
          await this.delay(2000);
        } catch (error) {
          result.errors.push(`Error extracting details for ${app.applicationNumber}: ${error}`);
        }
      }

      await page.close();
      result.success = true;

    } catch (error) {
      result.errors.push(`Scraping failed: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Setup page with proper headers and settings
   */
  private async setupPage(page: Page): Promise<void> {
    await page.setUserAgent(this.userAgent);
    
    // Set viewport
    await page.setViewport({
      width: 1920,
      height: 1080
    });

    // Block unnecessary resources to speed up scraping
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Handle errors gracefully
    page.on('error', (error) => {
      console.error('Page error:', error);
    });

    page.on('pageerror', (error) => {
      console.error('Page error:', error);
    });
  }

  /**
   * Search for recent planning applications
   */
  private async searchRecentApplications(page: Page, config: CouncilScrapingConfig): Promise<Partial<PlanningApplication>[]> {
    const applications: Partial<PlanningApplication>[] = [];

    try {
      // Wait for search form to load
      await page.waitForSelector('form', { timeout: 10000 });

      // Set date range for recent applications (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Fill in search criteria (this would be customized per council)
      await this.fillSearchForm(page, thirtyDaysAgo, new Date());

      // Submit search
      await page.click('input[type="submit"], button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Extract application list
      const applicationElements = await page.$$(config.selectors.applicationList);

      for (const element of applicationElements) {
        try {
          const application = await this.extractBasicApplicationInfo(element, config);
          if (application.applicationNumber) {
            applications.push({
              ...application,
              councilArea: config.councilName,
              source: page.url(),
              scrapedAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error extracting application info:', error);
        }
      }

    } catch (error) {
      console.error('Error searching applications:', error);
      throw error;
    }

    return applications;
  }

  /**
   * Fill search form with date criteria
   */
  private async fillSearchForm(page: Page, fromDate: Date, toDate: Date): Promise<void> {
    try {
      // Common date input selectors
      const dateSelectors = [
        'input[name*="date"]',
        'input[name*="from"]',
        'input[name*="start"]',
        'select[name*="date"]'
      ];

      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = toDate.toISOString().split('T')[0];

      // Try to find and fill date inputs
      for (const selector of dateSelectors) {
        const elements = await page.$$(selector);
        if (elements.length >= 2) {
          await elements[0].type(fromDateStr);
          await elements[1].type(toDateStr);
          break;
        }
      }

      // Look for application type filters and select relevant ones
      const projectTypes = [
        'extension', 'loft', 'conservatory', 'garage', 'kitchen', 'bathroom'
      ];

      for (const type of projectTypes) {
        try {
          const checkbox = await page.$(`input[type="checkbox"][value*="${type}"]`);
          if (checkbox) {
            await checkbox.click();
          }
        } catch (error) {
          // Ignore if checkbox not found
        }
      }

    } catch (error) {
      console.error('Error filling search form:', error);
    }
  }

  /**
   * Extract basic application information from list item
   */
  private async extractBasicApplicationInfo(element: any, config: CouncilScrapingConfig): Promise<Partial<PlanningApplication>> {
    try {
      const applicationNumber = await this.extractText(element, config.selectors.applicationNumber);
      const address = await this.extractText(element, config.selectors.address);
      const description = await this.extractText(element, config.selectors.projectDescription);
      const status = await this.extractText(element, config.selectors.status);
      const submissionDateStr = await this.extractText(element, config.selectors.submissionDate);

      return {
        applicationNumber: applicationNumber?.trim(),
        address: address?.trim(),
        description: description?.trim(),
        status: this.normalizeStatus(status?.trim()),
        submissionDate: this.parseDate(submissionDateStr)
      };
    } catch (error) {
      console.error('Error extracting basic info:', error);
      return {};
    }
  }

  /**
   * Extract detailed application information
   */
  private async extractApplicationDetails(page: Page, application: Partial<PlanningApplication>, config: CouncilScrapingConfig): Promise<Partial<PlanningApplication>> {
    try {
      // Navigate to application details page
      const detailsUrl = `${config.baseUrl}${config.detailsEndpoint}?ref=${application.applicationNumber}`;
      await page.goto(detailsUrl, { waitUntil: 'networkidle2' });

      // Extract applicant information
      const applicantInfo = await this.extractApplicantInfo(page);

      return {
        ...application,
        ...applicantInfo
      };
    } catch (error) {
      console.error('Error extracting application details:', error);
      return application;
    }
  }

  /**
   * Extract applicant contact information
   */
  private async extractApplicantInfo(page: Page): Promise<Partial<PlanningApplication>> {
    const applicantInfo: Partial<PlanningApplication> = {};

    try {
      // Common selectors for applicant information
      const selectors = {
        name: [
          'td:contains("Applicant")+td',
          '.applicant-name',
          '[data-field="applicant"]',
          'span:contains("Name")+span'
        ],
        email: [
          'a[href^="mailto:"]',
          'input[type="email"]',
          'td:contains("Email")+td'
        ],
        phone: [
          'td:contains("Phone")+td',
          'td:contains("Tel")+td',
          '.phone-number'
        ],
        address: [
          'td:contains("Address")+td',
          '.applicant-address',
          '[data-field="address"]'
        ]
      };

      // Extract name
      for (const selector of selectors.name) {
        try {
          const element = await page.$(selector);
          if (element) {
            applicantInfo.applicantName = await page.evaluate(el => el.textContent?.trim(), element);
            if (applicantInfo.applicantName) break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      // Extract email
      for (const selector of selectors.email) {
        try {
          const element = await page.$(selector);
          if (element) {
            if (selector.includes('mailto:')) {
              applicantInfo.applicantEmail = await page.evaluate(el => el.href?.replace('mailto:', ''), element);
            } else {
              applicantInfo.applicantEmail = await page.evaluate(el => el.textContent?.trim(), element);
            }
            if (applicantInfo.applicantEmail) break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      // Extract phone
      for (const selector of selectors.phone) {
        try {
          const element = await page.$(selector);
          if (element) {
            applicantInfo.applicantPhone = await page.evaluate(el => el.textContent?.trim(), element);
            if (applicantInfo.applicantPhone) break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      // Extract address
      for (const selector of selectors.address) {
        try {
          const element = await page.$(selector);
          if (element) {
            applicantInfo.applicantAddress = await page.evaluate(el => el.textContent?.trim(), element);
            if (applicantInfo.applicantAddress) break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

    } catch (error) {
      console.error('Error extracting applicant info:', error);
    }

    return applicantInfo;
  }

  /**
   * Extract text content using selector
   */
  private async extractText(element: any, selector: string): Promise<string | null> {
    try {
      const textElement = await element.$(selector);
      if (textElement) {
        return await textElement.evaluate((el: any) => el.textContent?.trim());
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Normalize application status
   */
  private normalizeStatus(status: string | undefined): PlanningApplication['status'] {
    if (!status) return 'submitted';
    
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('approved') || lowerStatus.includes('granted')) {
      return 'approved';
    } else if (lowerStatus.includes('rejected') || lowerStatus.includes('refused')) {
      return 'rejected';
    } else if (lowerStatus.includes('pending') || lowerStatus.includes('under review')) {
      return 'pending';
    }
    
    return 'submitted';
  }

  /**
   * Parse date string to Date object
   */
  private parseDate(dateStr: string | undefined): Date {
    if (!dateStr) return new Date();
    
    try {
      // Try various date formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
        /(\d{1,2})-(\d{1,2})-(\d{4})/    // DD-MM-YYYY
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          if (format === formats[1]) {
            // YYYY-MM-DD
            return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          } else {
            // DD/MM/YYYY or DD-MM-YYYY
            return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          }
        }
      }

      // Fallback to Date.parse
      return new Date(dateStr);
    } catch (error) {
      return new Date();
    }
  }

  /**
   * Add delay between requests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const councilWebScraperService = new CouncilWebScraperService();