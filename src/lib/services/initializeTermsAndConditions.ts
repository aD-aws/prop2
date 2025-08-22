import { initializeStandardTerms } from './standardTermsTemplates';
import { termsConditionsService } from './termsConditionsService';

/**
 * Initialize all standard terms and conditions for the platform
 * This should be run during application startup or deployment
 */
export async function initializeTermsAndConditions(): Promise<void> {
  try {
    console.log('Initializing standard terms and conditions...');
    
    await initializeStandardTerms();
    
    console.log('Standard terms and conditions initialized successfully');
  } catch (error) {
    console.error('Failed to initialize terms and conditions:', error);
    throw error;
  }
}

/**
 * Validate that all required standard terms exist
 */
export async function validateStandardTermsExist(): Promise<boolean> {
  const requiredProjectTypes = [
    'loft-conversion',
    'rear-extension',
    'side-extension',
    'basement-conversion',
    'garage-conversion',
    'kitchen-renovation',
    'bathroom-renovation',
    'bedroom-renovation',
    'living-room-renovation',
    'electrical-rewiring',
    'plumbing-upgrade',
    'heating-system',
    'roofing',
    'windows-doors',
    'driveway-patio',
    'landscaping',
    'rendering-cladding',
    'insulation',
    'conservatory',
    'garden-room',
    'general-renovation'
  ];

  try {
    for (const projectType of requiredProjectTypes) {
      const terms = await termsConditionsService.getStandardTerms(projectType);
      if (!terms) {
        console.warn(`Missing standard terms for project type: ${projectType}`);
        return false;
      }
    }
    
    console.log('All required standard terms exist');
    return true;
  } catch (error) {
    console.error('Error validating standard terms:', error);
    return false;
  }
}

/**
 * Get terms and conditions statistics
 */
export async function getTermsStatistics(): Promise<{
  totalProjectTypes: number;
  projectTypesWithTerms: number;
  missingTerms: string[];
}> {
  const requiredProjectTypes = [
    'loft-conversion',
    'rear-extension',
    'side-extension',
    'basement-conversion',
    'garage-conversion',
    'kitchen-renovation',
    'bathroom-renovation',
    'bedroom-renovation',
    'living-room-renovation',
    'electrical-rewiring',
    'plumbing-upgrade',
    'heating-system',
    'roofing',
    'windows-doors',
    'driveway-patio',
    'landscaping',
    'rendering-cladding',
    'insulation',
    'conservatory',
    'garden-room',
    'general-renovation'
  ];

  const missingTerms: string[] = [];
  let projectTypesWithTerms = 0;

  for (const projectType of requiredProjectTypes) {
    try {
      const terms = await termsConditionsService.getStandardTerms(projectType);
      if (terms) {
        projectTypesWithTerms++;
      } else {
        missingTerms.push(projectType);
      }
    } catch (error) {
      console.error(`Error checking terms for ${projectType}:`, error);
      missingTerms.push(projectType);
    }
  }

  return {
    totalProjectTypes: requiredProjectTypes.length,
    projectTypesWithTerms,
    missingTerms
  };
}