'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { planningPermissionDataMiningService, PlanningApplication, MarketingCampaign } from '../../lib/services/planningPermissionDataMiningService';
import { marketingCampaignService, CampaignMetrics, CampaignTemplate, CampaignAudience } from '../../lib/services/marketingCampaignService';
import { gdprComplianceService } from '../../lib/services/gdprComplianceService';

interface DashboardStats {
  totalApplications: number;
  totalProspects: number;
  activeCampaigns: number;
  optedOutCount: number;
  recentScrapes: number;
  complianceIssues: number;
}

export const PlanningPermissionDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    totalProspects: 0,
    activeCampaigns: 0,
    optedOutCount: 0,
    recentScrapes: 0,
    complianceIssues: 0
  });

  const [applications, setApplications] = useState<PlanningApplication[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [audiences, setAudiences] = useState<CampaignAudience[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'scraping' | 'campaigns' | 'compliance'>('overview');
  const [loading, setLoading] = useState(false);

  // Scraping form state
  const [scrapingForm, setScrapingForm] = useState({
    councilName: '',
    enabled: true
  });

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    messageTemplate: '',
    channel: 'email' as 'email' | 'sms' | 'postal',
    targetCriteria: {
      councilAreas: [] as string[],
      projectTypes: [] as string[],
      postcodes: [] as string[]
    }
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    channel: 'email' as 'email' | 'sms' | 'postal'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load dashboard statistics and data
      // This would typically involve API calls to get the data
      console.log('Loading dashboard data...');
      
      // Mock data for demonstration
      setStats({
        totalApplications: 1250,
        totalProspects: 890,
        activeCampaigns: 3,
        optedOutCount: 45,
        recentScrapes: 12,
        complianceIssues: 2
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeCouncil = async () => {
    if (!scrapingForm.councilName) return;

    setLoading(true);
    try {
      const results = await planningPermissionDataMiningService.scrapeCouncilWebsite(scrapingForm.councilName);
      console.log(`Scraped ${results.length} applications from ${scrapingForm.councilName}`);
      
      // Refresh data
      await loadDashboardData();
      
      // Reset form
      setScrapingForm({ councilName: '', enabled: true });
    } catch (error) {
      console.error('Error scraping council:', error);
      alert('Error scraping council website. Please check the configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.messageTemplate) return;

    setLoading(true);
    try {
      const campaign = await marketingCampaignService.createCampaign({
        name: campaignForm.name,
        messageTemplate: campaignForm.messageTemplate,
        channel: campaignForm.channel,
        targetCriteria: campaignForm.targetCriteria,
        status: 'draft'
      });

      console.log('Created campaign:', campaign);
      
      // Refresh campaigns
      await loadDashboardData();
      
      // Reset form
      setCampaignForm({
        name: '',
        messageTemplate: '',
        channel: 'email',
        targetCriteria: {
          councilAreas: [],
          projectTypes: [],
          postcodes: []
        }
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign. Please check the form data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.content) return;

    setLoading(true);
    try {
      const template = await marketingCampaignService.createTemplate({
        name: templateForm.name,
        subject: templateForm.subject,
        content: templateForm.content,
        channel: templateForm.channel,
        variables: ['name', 'address', 'projectType', 'councilArea'],
        isActive: true
      });

      console.log('Created template:', template);
      
      // Reset form
      setTemplateForm({
        name: '',
        subject: '',
        content: '',
        channel: 'email'
      });
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptOutRequest = async (email: string) => {
    try {
      await gdprComplianceService.recordOptOut({
        email,
        optOutType: 'marketing',
        optOutSource: 'admin_request',
        isGlobal: false
      });
      
      console.log(`Processed opt-out for ${email}`);
      await loadDashboardData();
    } catch (error) {
      console.error('Error processing opt-out:', error);
    }
  };

  const handleDataDeletion = async (email: string) => {
    try {
      await gdprComplianceService.handleErasureRequest(email, undefined, 'Admin requested data deletion');
      console.log(`Initiated data deletion for ${email}`);
    } catch (error) {
      console.error('Error initiating data deletion:', error);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Applications</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalApplications.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Planning applications scraped</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Marketing Prospects</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalProspects.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Eligible for marketing</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.activeCampaigns}</p>
          <p className="text-sm text-gray-500">Currently running</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Opted Out</h3>
          <p className="text-3xl font-bold text-red-600">{stats.optedOutCount}</p>
          <p className="text-sm text-gray-500">Marketing opt-outs</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Recent Scrapes</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.recentScrapes}</p>
          <p className="text-sm text-gray-500">Last 24 hours</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Issues</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.complianceIssues}</p>
          <p className="text-sm text-gray-500">Requiring attention</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-gray-600">Scraped 45 applications from Westminster Council</span>
            <span className="text-xs text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-gray-600">Campaign "Kitchen Extension Leads" sent to 120 prospects</span>
            <span className="text-xs text-gray-400">4 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-gray-600">3 opt-out requests processed</span>
            <span className="text-xs text-gray-400">6 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScrapingTab = () => (
    <div className="space-y-6">
      {/* Scraping Configuration */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Council Website Scraping</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Council Name
            </label>
            <input
              type="text"
              value={scrapingForm.councilName}
              onChange={(e) => setScrapingForm({ ...scrapingForm, councilName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Westminster, Camden, Islington"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={handleScrapeCouncil}
              disabled={loading || !scrapingForm.councilName}
              className="w-full"
            >
              {loading ? 'Scraping...' : 'Start Scraping'}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="mb-2"><strong>Note:</strong> Scraping respects rate limits and GDPR compliance.</p>
          <p>Only public planning application data is collected with proper opt-out mechanisms.</p>
        </div>
      </div>

      {/* Scraping Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scraping Status</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Westminster Council</span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Camden Council</span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium">Islington Council</span>
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Rate Limited</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCampaignsTab = () => (
    <div className="space-y-6">
      {/* Create Campaign */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Marketing Campaign</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Kitchen Extension Leads Q1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channel
            </label>
            <select
              value={campaignForm.channel}
              onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="postal">Postal Mail</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Template
            </label>
            <textarea
              value={campaignForm.messageTemplate}
              onChange={(e) => setCampaignForm({ ...campaignForm, messageTemplate: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hi {name}, we noticed your planning application for {projectType} at {address}. Our platform can help you find qualified builders..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Available variables: {'{name}'}, {'{address}'}, {'{projectType}'}, {'{councilArea}'}
            </p>
          </div>
          
          <Button
            onClick={handleCreateCampaign}
            disabled={loading || !campaignForm.name || !campaignForm.messageTemplate}
          >
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </div>

      {/* Create Template */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Message Template</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Extension Lead Email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject (Email only)
            </label>
            <input
              type="text"
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transform Your {projectType} Project with Expert Guidance"
              disabled={templateForm.channel !== 'email'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={templateForm.content}
              onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dear {name},&#10;&#10;We noticed your recent planning application for {projectType} at {address}...&#10;&#10;To opt out, click here: [OPT_OUT_LINK]"
            />
          </div>
          
          <Button
            onClick={handleCreateTemplate}
            disabled={loading || !templateForm.name || !templateForm.content}
          >
            {loading ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-6">
      {/* GDPR Compliance Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GDPR Compliance Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Processing</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Lawful basis documented
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Retention periods defined
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Opt-out mechanisms active
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Subject Rights</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Access requests handled
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Erasure requests processed
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                2 pending verification requests
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Manual Compliance Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Compliance Actions</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Process Opt-Out Request
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => {
                  const email = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value;
                  if (email) handleOptOutRequest(email);
                }}
              >
                Process Opt-Out
              </Button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delete Personal Data
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address for data deletion"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                onClick={() => {
                  const inputs = document.querySelectorAll('input[type="email"]');
                  const email = (inputs[1] as HTMLInputElement)?.value;
                  if (email && confirm(`Are you sure you want to delete all data for ${email}?`)) {
                    handleDataDeletion(email);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice Generator */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Notice</h3>
        <div className="bg-gray-50 p-4 rounded-md text-sm">
          <p className="font-medium mb-2">Current Privacy Notice for Data Collection:</p>
          <p className="text-gray-700">
            {gdprComplianceService.generatePrivacyNotice(
              ['Contact information', 'Property details', 'Project information'],
              ['Marketing communications', 'Service recommendations'],
              'Legitimate interests for business development'
            )}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Planning Permission Data Mining</h1>
        <p className="mt-2 text-gray-600">
          Manage council website scraping, marketing campaigns, and GDPR compliance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'scraping', label: 'Data Scraping' },
            { id: 'campaigns', label: 'Marketing Campaigns' },
            { id: 'compliance', label: 'GDPR Compliance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && renderOverviewTab()}
      {selectedTab === 'scraping' && renderScrapingTab()}
      {selectedTab === 'campaigns' && renderCampaignsTab()}
      {selectedTab === 'compliance' && renderComplianceTab()}
    </div>
  );
};

export default PlanningPermissionDashboard;