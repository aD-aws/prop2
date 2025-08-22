import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PropertyAssessmentForm from '../PropertyAssessmentForm';

// Mock the services
jest.mock('../../../lib/services/propertyService', () => ({
  PropertyService: {
    validateAddress: jest.fn(() => ({ isValid: true, errors: [] })),
    createProperty: jest.fn(() => Promise.resolve({ success: true, propertyId: 'prop_123' })),
    getPropertyById: jest.fn(() => Promise.resolve({ 
      success: true, 
      property: {
        id: 'prop_123',
        address: {
          line1: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom'
        },
        councilArea: 'Westminster City Council',
        isListedBuilding: false,
        isInConservationArea: false,
        planningHistory: [],
        buildingRegulations: []
      }
    }))
  }
}));

jest.mock('../../../lib/services/councilApiService', () => ({
  CouncilApiService: {
    getPropertyInfo: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        address: {
          line1: '123 Test Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'United Kingdom'
        },
        councilArea: 'Westminster City Council',
        isListedBuilding: false,
        isInConservationArea: false,
        planningApplications: [],
        uprn: '123456789'
      },
      source: 'Mock Council API'
    }))
  }
}));

describe('PropertyAssessmentForm', () => {
  const mockOnPropertyAssessed = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form with all required fields', () => {
    render(
      <PropertyAssessmentForm
        onPropertyAssessed={mockOnPropertyAssessed}
        onError={mockOnError}
      />
    );

    expect(screen.getByLabelText(/Address Line 1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/City/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Postcode/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Country/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Property Information/ })).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    const { PropertyService } = require('../../../lib/services/propertyService');
    PropertyService.validateAddress.mockReturnValue({
      isValid: false,
      errors: ['Address line 1 is required', 'City is required', 'Postcode is required']
    });

    render(
      <PropertyAssessmentForm
        onPropertyAssessed={mockOnPropertyAssessed}
        onError={mockOnError}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Check Property Information/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please correct the following errors/)).toBeInTheDocument();
      expect(screen.getByText(/Address line 1 is required/)).toBeInTheDocument();
    });
  });

  it('should fill form and submit successfully', async () => {
    render(
      <PropertyAssessmentForm
        onPropertyAssessed={mockOnPropertyAssessed}
        onError={mockOnError}
      />
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/Address Line 1/), {
      target: { value: '123 Test Street' }
    });
    fireEvent.change(screen.getByLabelText(/City/), {
      target: { value: 'London' }
    });
    fireEvent.change(screen.getByLabelText(/Postcode/), {
      target: { value: 'SW1A 1AA' }
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Check Property Information/ });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/Checking Property Information/)).toBeInTheDocument();
    });
  });

  it('should handle form input changes', () => {
    render(
      <PropertyAssessmentForm
        onPropertyAssessed={mockOnPropertyAssessed}
        onError={mockOnError}
      />
    );

    const addressInput = screen.getByLabelText(/Address Line 1/);
    fireEvent.change(addressInput, { target: { value: '123 New Street' } });

    expect(addressInput).toHaveValue('123 New Street');
  });
});