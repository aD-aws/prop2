import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BuilderReviewDisplay } from '../BuilderReviewDisplay';
import { BuilderReviewAnalysis } from '../../../lib/types';

const mockAnalysis: BuilderReviewAnalysis = {
  overallScore: 75,
  issues: [
    {
      id: 'issue-1',
      category: 'missing_work',
      severity: 'major',
      title: 'Missing electrical specifications',
      description: 'No electrical work specified for new appliances',
      location: 'Kitchen Installation section',
      impact: 'Could delay project and increase costs'
    },
    {
      id: 'issue-2',
      category: 'regulatory',
      severity: 'minor',
      title: 'Minor regulatory note',
      description: 'Consider additional ventilation',
      location: 'Ventilation section',
      impact: 'Minor compliance improvement'
    }
  ],
  recommendations: [
    {
      id: 'rec-1',
      issueId: 'issue-1',
      type: 'addition',
      title: 'Add electrical specifications',
      description: 'Include electrical work for appliance installation',
      suggestedText: 'Install dedicated circuits for dishwasher and oven',
      reasoning: 'New appliances require proper electrical connections',
      priority: 'high'
    },
    {
      id: 'rec-2',
      issueId: 'issue-2',
      type: 'modification',
      title: 'Improve ventilation specs',
      description: 'Add mechanical ventilation details',
      reasoning: 'Better air quality and compliance',
      priority: 'medium'
    }
  ],
  missingElements: ['Electrical work specifications', 'Ventilation details'],
  unrealisticSpecifications: [],
  regulatoryIssues: ['Part P electrical notification required'],
  costAccuracyIssues: [],
  materialImprovements: ['Specify appliance electrical requirements'],
  timelineIssues: [],
  qualityIndicator: 'good',
  reviewedAt: new Date('2024-01-15T10:00:00Z'),
  reviewAgentType: 'kitchen'
};

describe('BuilderReviewDisplay', () => {
  const mockOnApplyRecommendations = jest.fn();
  const mockOnRegenerateSoW = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render review analysis with correct quality score', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('AI Builder Review Results')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('GOOD')).toBeInTheDocument();
    expect(screen.getByText(/kitchen specialist/)).toBeInTheDocument();
  });

  it('should display issues with correct severity styling', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    // Expand issues section
    fireEvent.click(screen.getByText(/Issues Identified/));

    expect(screen.getByText('Missing electrical specifications')).toBeInTheDocument();
    expect(screen.getByText('MAJOR')).toBeInTheDocument();
    expect(screen.getByText('Minor regulatory note')).toBeInTheDocument();
    expect(screen.getByText('MINOR')).toBeInTheDocument();
  });

  it('should display recommendations with priority indicators', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    // Expand recommendations section
    fireEvent.click(screen.getByText('Recommendations (2)'));

    expect(screen.getByText('Add electrical specifications')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Improve ventilation specs')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('should allow selecting and applying recommendations', async () => {
    render(
      <BuilderReviewDisplay 
        analysis={mockAnalysis} 
        onApplyRecommendations={mockOnApplyRecommendations}
      />
    );

    // Expand recommendations section
    fireEvent.click(screen.getByText('Recommendations (2)'));

    // Select first recommendation
    const checkbox1 = screen.getByLabelText('Add electrical specifications');
    fireEvent.click(checkbox1);

    // Select second recommendation
    const checkbox2 = screen.getByLabelText('Improve ventilation specs');
    fireEvent.click(checkbox2);

    // Apply recommendations
    const applyButton = screen.getByText('Apply 2 Recommendations');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockOnApplyRecommendations).toHaveBeenCalledWith(['rec-1', 'rec-2']);
    });
  });

  it('should show loading state when applying recommendations', () => {
    render(
      <BuilderReviewDisplay 
        analysis={mockAnalysis} 
        onApplyRecommendations={mockOnApplyRecommendations}
        isApplyingRecommendations={true}
      />
    );

    // Expand recommendations section
    fireEvent.click(screen.getByText('Recommendations (2)'));

    // Select a recommendation
    const checkbox = screen.getByLabelText('Add electrical specifications');
    fireEvent.click(checkbox);

    const applyButton = screen.getByText('Applying...');
    expect(applyButton).toBeDisabled();
  });

  it('should display detailed analysis when expanded', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    // Expand detailed analysis section
    fireEvent.click(screen.getByText('Detailed Analysis'));

    expect(screen.getByText('Missing Elements')).toBeInTheDocument();
    expect(screen.getByText('• Electrical work specifications')).toBeInTheDocument();
    expect(screen.getByText('• Ventilation details')).toBeInTheDocument();

    expect(screen.getByText('Regulatory Issues')).toBeInTheDocument();
    expect(screen.getByText('• Part P electrical notification required')).toBeInTheDocument();
  });

  it('should show regenerate SoW button when callback provided', () => {
    render(
      <BuilderReviewDisplay 
        analysis={mockAnalysis} 
        onRegenerateSoW={mockOnRegenerateSoW}
      />
    );

    const regenerateButton = screen.getByText('Regenerate SoW with All Improvements');
    expect(regenerateButton).toBeInTheDocument();

    fireEvent.click(regenerateButton);
    expect(mockOnRegenerateSoW).toHaveBeenCalled();
  });

  it('should handle excellent quality indicator correctly', () => {
    const excellentAnalysis: BuilderReviewAnalysis = {
      ...mockAnalysis,
      overallScore: 95,
      qualityIndicator: 'excellent',
      issues: []
    };

    render(<BuilderReviewDisplay analysis={excellentAnalysis} />);

    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('EXCELLENT')).toBeInTheDocument();
  });

  it('should handle poor quality indicator correctly', () => {
    const poorAnalysis: BuilderReviewAnalysis = {
      ...mockAnalysis,
      overallScore: 35,
      qualityIndicator: 'poor',
      issues: [
        {
          id: 'critical-issue',
          category: 'regulatory',
          severity: 'critical',
          title: 'Critical safety issue',
          description: 'Major safety concern',
          location: 'Safety section',
          impact: 'High safety risk'
        }
      ]
    };

    render(<BuilderReviewDisplay analysis={poorAnalysis} />);

    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('POOR')).toBeInTheDocument();
  });

  it('should toggle sections correctly', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    // Initially overview should be expanded
    expect(screen.getByText('Quality Score')).toBeInTheDocument();

    // Click to collapse overview
    fireEvent.click(screen.getByText('Overview'));
    expect(screen.queryByText('Quality Score')).not.toBeInTheDocument();

    // Click to expand issues
    fireEvent.click(screen.getByText(/Issues Identified/));
    expect(screen.getByText('Missing electrical specifications')).toBeInTheDocument();
  });

  it('should display suggested text for recommendations', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    // Expand recommendations section
    fireEvent.click(screen.getByText('Recommendations (2)'));

    expect(screen.getByText('Suggested Text:')).toBeInTheDocument();
    expect(screen.getByText('Install dedicated circuits for dishwasher and oven')).toBeInTheDocument();
  });

  it('should show correct issue and recommendation counts', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    expect(screen.getByText('Issues Identified (2)')).toBeInTheDocument();
    expect(screen.getByText('Recommendations (2)')).toBeInTheDocument();
  });

  it('should display review date correctly', () => {
    render(<BuilderReviewDisplay analysis={mockAnalysis} />);

    expect(screen.getByText(/Reviewed on 1\/15\/2024/)).toBeInTheDocument();
  });
});