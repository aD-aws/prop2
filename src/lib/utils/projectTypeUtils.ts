import { ProjectType } from '../types';

/**
 * Get display name for a project type
 */
export function getProjectTypeDisplayName(type: ProjectType): string {
  // For the comprehensive project type system, we'll use a simplified approach
  // that converts the ID to a readable name
  
  // Handle the "others" case specifically
  if (type === 'others') {
    return 'Other Project';
  }
  
  // Convert snake_case to Title Case and handle common abbreviations
  return type
    .split('_')
    .map(word => {
      // Handle common abbreviations
      const abbreviations: Record<string, string> = {
        'upvc': 'UPVC',
        'hvac': 'HVAC',
        'lvt': 'LVT',
        'av': 'AV',
        'ev': 'EV',
        'mvhr': 'MVHR',
        'cctv': 'CCTV',
        'wc': 'WC',
        'k': 'K-',
        'u': 'U-',
        'l': 'L-'
      };
      
      const lowerWord = word.toLowerCase();
      if (abbreviations[lowerWord]) {
        return abbreviations[lowerWord];
      }
      
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Get simplified category name for a project type
 */
export function getProjectTypeCategory(type: ProjectType): string {
  // Map project types to simplified categories for display
  const categoryMap: Record<string, string> = {
    // Loft conversions
    'loft_conversion': 'Loft Conversion',
    
    // Extensions
    'rear_extension': 'Rear Extension',
    'side_extension': 'Side Extension',
    
    // Conversions
    'basement_conversion': 'Basement Conversion',
    'garage_conversion': 'Garage Conversion',
    
    // Room renovations
    'kitchen': 'Kitchen Renovation',
    'bathroom': 'Bathroom Renovation',
    'bedroom': 'Bedroom Renovation',
    'living_room': 'Living Room Renovation',
    
    // Systems
    'electrical': 'Electrical Work',
    'plumbing': 'Plumbing Work',
    'heating': 'Heating & HVAC',
    
    // External
    'windows': 'Windows & Doors',
    'doors': 'Windows & Doors',
    'roofing': 'Roofing Work',
    'rendering': 'Rendering & Cladding',
    'cladding': 'Rendering & Cladding',
    
    // Garden & External
    'garden': 'Landscaping & Garden',
    'landscaping': 'Landscaping & Garden',
    'driveway': 'Driveway & Patio',
    'patio': 'Driveway & Patio',
    
    // Others
    'others': 'Other Project'
  };
  
  // Find the best match by checking if any category key is contained in the project type
  for (const [key, category] of Object.entries(categoryMap)) {
    if (type.includes(key)) {
      return category;
    }
  }
  
  // Fallback to the display name
  return getProjectTypeDisplayName(type);
}