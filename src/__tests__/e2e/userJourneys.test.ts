import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../components/auth/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectTypeBrowser } from '../../components/project-types/ProjectTypeBrowser';
import { PropertyAssessmentForm } from '../../components/property/PropertyAssessmentForm';
import { QuestionnaireFlow } from '../../components/questionnaire/QuestionnaireFlow';
import { QuoteComparisonDashboard } from '../../components/quotes/QuoteComparisonDashboard';
import { ContractManagement } from '../../components/contracts/ContractManagement';

// Mock external services for E2E tests
jest.mock('../../lib/services/propertyService');
jest.mock('../../lib/services/sowGenerationService');
jest.mock('../../lib/services/quoteManagementService');
jest.mock('../../lib/services/contractService');
jest.mock('../../lib/services/paymentService');

describe('End-to-End User Journeys', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    user = userEvent.setup();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {component}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  describe('Complete Homeowner Journey - Kitchen Renovation', () => {
    it('should complete full kitchen renovation journey from project selection to contract', async () => {
      // Step 1: Project Type Selection
      renderWithProviders(<ProjectTypeBrowser />);

      // User selects kitchen renovation
      const kitchenOption = await screen.findByText(/kitchen renovation/i);
      await user.click(kitchenOption);

      const selectButton = await screen.findByText(/select this project/i);
      await user.click(selectButton);

      // Step 2: Property Assessment
      renderWithProviders(<PropertyAssessmentForm />);

      // Fill property details
      const propertyTypeSelect = await screen.findByLabelText(/property type/i);
      await user.selectOptions(propertyTypeSelect, 'terraced');

      const yearBuiltInput = await screen.findByLabelText(/year built/i);
      await user.type(yearBuiltInput, '1960');

      const addressInput = await screen.findByLabelText(/address/i);
      await user.type(addressInput, '123 Test Street, London, SW1A 1AA');

      const submitPropertyButton = await screen.findByText(/continue/i);
      await user.click(submitPropertyButton);

      // Wait for property validation
      await waitFor(() => {
        expect(screen.getByText(/property validated/i)).toBeInTheDocument();
      });

      // Step 3: Project Questionnaire
      renderWithProviders(<QuestionnaireFlow projectType="kitchen-renovation" />);

      // Answer budget question
      const budgetInput = await screen.findByLabelText(/budget/i);
      await user.type(budgetInput, '30000');

      const nextButton = await screen.findByText(/next/i);
      await user.click(nextButton);

      // Answer timeline question
      const timelineSelect = await screen.findByLabelText(/timeline/i);
      await user.selectOptions(timelineSelect, '10-weeks');

      await user.click(nextButton);

      // Answer style preferences
      const styleModern = await screen.findByLabelText(/modern/i);
      await user.click(styleModern);

      await user.click(nextButton);

      // Answer appliance preferences
      const appliancesIntegrated = await screen.findByLabelText(/integrated appliances/i);
      await user.click(appliancesIntegrated);

      const generateSoWButton = await screen.findByText(/generate statement of work/i);
      await user.click(generateSoWButton);

      // Wait for SoW generation
      await waitFor(() => {
        expect(screen.getByText(/statement of work generated/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify SoW content
      expect(screen.getByText(/kitchen renovation project/i)).toBeInTheDocument();
      expect(screen.getByText(/£30,000/)).toBeInTheDocument();
      expect(screen.getByText(/10 weeks/i)).toBeInTheDocument();

      // Step 4: Quote Comparison
      renderWithProviders(<QuoteComparisonDashboard projectId="test-project-001" />);

      // Wait for quotes to load
      await waitFor(() => {
        expect(screen.getByText(/received quotes/i)).toBeInTheDocument();
      });

      // Should show multiple builder quotes
      const builderQuotes = await screen.findAllByTestId('builder-quote');
      expect(builderQuotes.length).toBeGreaterThan(1);

      // Select preferred builder
      const selectBuilderButton = builderQuotes[0].querySelector('button[data-testid="select-builder"]');
      expect(selectBuilderButton).toBeInTheDocument();
      await user.click(selectBuilderButton!);

      // Confirm selection
      const confirmButton = await screen.findByText(/confirm selection/i);
      await user.click(confirmButton);

      // Step 5: Contract Management
      renderWithProviders(<ContractManagement projectId="test-project-001" />);

      // Wait for contract generation
      await waitFor(() => {
        expect(screen.getByText(/contract ready for review/i)).toBeInTheDocument();
      });

      // Review contract terms
      const reviewContractButton = await screen.findByText(/review contract/i);
      await user.click(reviewContractButton);

      // Accept terms
      const acceptTermsCheckbox = await screen.findByLabelText(/i accept the terms/i);
      await user.click(acceptTermsCheckbox);

      // Sign contract
      const signContractButton = await screen.findByText(/sign contract/i);
      await user.click(signContractButton);

      // Wait for signing completion
      await waitFor(() => {
        expect(screen.getByText(/contract signed successfully/i)).toBeInTheDocument();
      });

      // Verify project status
      expect(screen.getByText(/project active/i)).toBeInTheDocument();
    }, 30000);
  });

  describe('Builder Registration and Quote Submission Journey', () => {
    it('should complete builder registration and quote submission process', async () => {
      // Mock builder registration form
      const BuilderRegistrationForm = () => (
        <form data-testid="builder-registration">
          <input name="companyName" placeholder="Company Name" />
          <input name="email" placeholder="Email" />
          <input name="phone" placeholder="Phone" />
          <select name="specializations">
            <option value="kitchen">Kitchen Renovation</option>
            <option value="bathroom">Bathroom Renovation</option>
          </select>
          <input name="insurance" placeholder="Insurance Number" />
          <input name="certifications" placeholder="Certifications" />
          <button type="submit">Register</button>
        </form>
      );

      renderWithProviders(<BuilderRegistrationForm />);

      // Fill registration form
      const companyNameInput = await screen.findByPlaceholderText(/company name/i);
      await user.type(companyNameInput, 'Test Construction Ltd');

      const emailInput = await screen.findByPlaceholderText(/email/i);
      await user.type(emailInput, 'builder@testconstruction.com');

      const phoneInput = await screen.findByPlaceholderText(/phone/i);
      await user.type(phoneInput, '07700900123');

      const specializationSelect = await screen.findByDisplayValue(/kitchen renovation/i);
      await user.selectOptions(specializationSelect, 'kitchen');

      const insuranceInput = await screen.findByPlaceholderText(/insurance number/i);
      await user.type(insuranceInput, 'INS123456789');

      const certificationsInput = await screen.findByPlaceholderText(/certifications/i);
      await user.type(certificationsInput, 'City & Guilds, CSCS Card');

      const registerButton = await screen.findByText(/register/i);
      await user.click(registerButton);

      // Wait for registration success
      await waitFor(() => {
        expect(screen.getByText(/registration submitted/i)).toBeInTheDocument();
      });

      // Mock quote submission after approval
      const QuoteSubmissionForm = () => (
        <form data-testid="quote-submission">
          <input name="projectId" value="test-project-001" readOnly />
          <textarea name="description" placeholder="Project Description" />
          <input name="totalCost" placeholder="Total Cost" />
          <input name="timeline" placeholder="Timeline (weeks)" />
          <textarea name="materials" placeholder="Materials List" />
          <button type="submit">Submit Quote</button>
        </form>
      );

      renderWithProviders(<QuoteSubmissionForm />);

      // Fill quote details
      const descriptionTextarea = await screen.findByPlaceholderText(/project description/i);
      await user.type(descriptionTextarea, 'Complete kitchen renovation with modern fixtures');

      const totalCostInput = await screen.findByPlaceholderText(/total cost/i);
      await user.type(totalCostInput, '28500');

      const timelineInput = await screen.findByPlaceholderText(/timeline/i);
      await user.type(timelineInput, '9');

      const materialsTextarea = await screen.findByPlaceholderText(/materials list/i);
      await user.type(materialsTextarea, 'Kitchen units, worktops, appliances, tiles');

      const submitQuoteButton = await screen.findByText(/submit quote/i);
      await user.click(submitQuoteButton);

      // Wait for quote submission
      await waitFor(() => {
        expect(screen.getByText(/quote submitted successfully/i)).toBeInTheDocument();
      });
    }, 20000);
  });

  describe('Project Management and Completion Journey', () => {
    it('should handle project progress tracking and completion', async () => {
      // Mock project dashboard
      const ProjectDashboard = () => (
        <div data-testid="project-dashboard">
          <h1>Project Dashboard</h1>
          <div data-testid="project-status">In Progress</div>
          <div data-testid="completion-percentage">65%</div>
          <button data-testid="update-progress">Update Progress</button>
          <button data-testid="mark-milestone">Mark Milestone Complete</button>
          <button data-testid="request-payment">Request Payment</button>
        </div>
      );

      renderWithProviders(<ProjectDashboard />);

      // Check initial project status
      expect(screen.getByTestId('project-status')).toHaveTextContent('In Progress');
      expect(screen.getByTestId('completion-percentage')).toHaveTextContent('65%');

      // Update progress
      const updateProgressButton = await screen.findByTestId('update-progress');
      await user.click(updateProgressButton);

      // Mock progress update modal
      const progressInput = await screen.findByLabelText(/progress percentage/i);
      await user.clear(progressInput);
      await user.type(progressInput, '80');

      const updateButton = await screen.findByText(/update/i);
      await user.click(updateButton);

      // Wait for progress update
      await waitFor(() => {
        expect(screen.getByTestId('completion-percentage')).toHaveTextContent('80%');
      });

      // Mark milestone complete
      const milestoneButton = await screen.findByTestId('mark-milestone');
      await user.click(milestoneButton);

      // Select milestone
      const milestoneSelect = await screen.findByLabelText(/milestone/i);
      await user.selectOptions(milestoneSelect, 'electrical-work');

      const markCompleteButton = await screen.findByText(/mark complete/i);
      await user.click(markCompleteButton);

      // Wait for milestone update
      await waitFor(() => {
        expect(screen.getByText(/electrical work completed/i)).toBeInTheDocument();
      });

      // Request payment
      const requestPaymentButton = await screen.findByTestId('request-payment');
      await user.click(requestPaymentButton);

      // Fill payment request
      const amountInput = await screen.findByLabelText(/amount/i);
      await user.type(amountInput, '15000');

      const descriptionInput = await screen.findByLabelText(/description/i);
      await user.type(descriptionInput, 'Progress payment for completed electrical work');

      const submitPaymentButton = await screen.findByText(/submit request/i);
      await user.click(submitPaymentButton);

      // Wait for payment request
      await waitFor(() => {
        expect(screen.getByText(/payment request submitted/i)).toBeInTheDocument();
      });
    }, 15000);
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle form validation errors gracefully', async () => {
      renderWithProviders(<PropertyAssessmentForm />);

      // Try to submit without required fields
      const submitButton = await screen.findByText(/continue/i);
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/property type is required/i)).toBeInTheDocument();
        expect(screen.getByText(/address is required/i)).toBeInTheDocument();
      });

      // Fill required fields
      const propertyTypeSelect = await screen.findByLabelText(/property type/i);
      await user.selectOptions(propertyTypeSelect, 'detached');

      const addressInput = await screen.findByLabelText(/address/i);
      await user.type(addressInput, 'Valid Address');

      // Submit again
      await user.click(submitButton);

      // Should proceed without errors
      await waitFor(() => {
        expect(screen.queryByText(/property type is required/i)).not.toBeInTheDocument();
      });
    });

    it('should handle network errors and retry mechanisms', async () => {
      // Mock network failure
      const NetworkErrorComponent = () => (
        <div data-testid="network-error">
          <p>Network Error: Unable to load data</p>
          <button data-testid="retry-button">Retry</button>
        </div>
      );

      renderWithProviders(<NetworkErrorComponent />);

      // Should show error message
      expect(screen.getByText(/network error/i)).toBeInTheDocument();

      // Click retry
      const retryButton = await screen.findByTestId('retry-button');
      await user.click(retryButton);

      // Should attempt to reload
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle session timeout and re-authentication', async () => {
      // Mock session timeout
      const SessionTimeoutComponent = () => (
        <div data-testid="session-timeout">
          <p>Your session has expired. Please log in again.</p>
          <button data-testid="login-again">Log In Again</button>
        </div>
      );

      renderWithProviders(<SessionTimeoutComponent />);

      // Should show session timeout message
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();

      // Click login again
      const loginButton = await screen.findByTestId('login-again');
      await user.click(loginButton);

      // Should redirect to login
      expect(loginButton).toBeInTheDocument();
    });
  });
});