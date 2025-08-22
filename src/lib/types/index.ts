// Core type definitions for the UK Home Improvement Platform

export type UserType = 'homeowner' | 'builder' | 'admin';

export type ProjectStatus = 
  | 'initial' 
  | 'property_assessment' 
  | 'ai_planning' 
  | 'sow_generation' 
  | 'builder_invitation' 
  | 'quote_collection' 
  | 'builder_selection' 
  | 'contract_generation' 
  | 'project_execution' 
  | 'completion';

export type ProjectType = 
  // Structural Extensions & Conversions
  | 'loft_conversion_dormer'
  | 'loft_conversion_hip_to_gable'
  | 'loft_conversion_mansard'
  | 'loft_conversion_velux'
  | 'loft_conversion_roof_light'
  | 'rear_extension_single_storey'
  | 'rear_extension_double_storey'
  | 'rear_extension_wrap_around'
  | 'rear_extension_glass_box'
  | 'side_extension_single_storey'
  | 'side_extension_double_storey'
  | 'side_extension_infill'
  | 'basement_conversion_full'
  | 'basement_conversion_partial'
  | 'garage_conversion_living_space'
  | 'garage_conversion_office'
  | 'garage_conversion_gym'
  | 'garage_conversion_studio'
  | 'conservatory_traditional'
  | 'conservatory_modern'
  | 'conservatory_lean_to'
  | 'orangery'
  | 'garden_room'
  | 'outbuilding_summer_house'
  | 'outbuilding_workshop'
  | 'outbuilding_studio'
  | 'annex_attached'
  | 'annex_detached'
  | 'annex_granny_flat'
  | 'porch_enclosed'
  | 'porch_open'
  | 'porch_canopy'
  | 'bay_window_installation'
  | 'balcony_addition'
  | 'terrace_addition'
  
  // Room-Specific Renovations
  | 'kitchen_full_refit'
  | 'kitchen_partial_upgrade'
  | 'kitchen_island_installation'
  | 'kitchen_galley'
  | 'kitchen_l_shaped'
  | 'kitchen_u_shaped'
  | 'bathroom_full_refit'
  | 'bathroom_shower_room'
  | 'bathroom_ensuite'
  | 'bathroom_downstairs_wc'
  | 'bathroom_wet_room'
  | 'bathroom_family'
  | 'bedroom_master'
  | 'bedroom_children'
  | 'bedroom_guest'
  | 'bedroom_nursery'
  | 'living_room_open_plan'
  | 'living_room_fireplace'
  | 'living_room_storage'
  | 'living_room_snug'
  | 'dining_room_formal'
  | 'dining_room_kitchen_diner'
  | 'dining_room_breakfast'
  | 'home_office_study'
  | 'home_office_library'
  | 'home_office_workspace'
  | 'utility_room_laundry'
  | 'utility_room_boot_room'
  | 'utility_room_pantry'
  | 'hallway_entrance'
  | 'staircase_replacement'
  | 'staircase_refurbishment'
  | 'staircase_spiral'
  | 'attic_room_conversion'
  | 'cellar_room_conversion'
  
  // External & Structural Work
  | 'roofing_re_roofing'
  | 'roofing_repairs'
  | 'roofing_flat_replacement'
  | 'roofing_green'
  | 'roofing_slate'
  | 'roofing_tile'
  | 'roofing_metal'
  | 'windows_upvc'
  | 'windows_timber'
  | 'windows_aluminium'
  | 'windows_sash'
  | 'doors_bifold'
  | 'doors_sliding'
  | 'doors_french'
  | 'driveway_block_paving'
  | 'driveway_resin'
  | 'driveway_tarmac'
  | 'driveway_natural_stone'
  | 'driveway_gravel'
  | 'driveway_concrete'
  | 'patio_block_paving'
  | 'patio_natural_stone'
  | 'patio_concrete'
  | 'garden_landscaping'
  | 'garden_decking_composite'
  | 'garden_decking_hardwood'
  | 'garden_decking_raised'
  | 'garden_pergola'
  | 'fencing_timber'
  | 'fencing_metal'
  | 'fencing_composite'
  | 'gates_automated'
  | 'rendering_k_rend'
  | 'rendering_pebbledash'
  | 'cladding_timber'
  | 'cladding_brick_slip'
  | 'brickwork_repointing'
  | 'brickwork_rebuilding'
  | 'brickwork_feature_walls'
  | 'stonework'
  | 'chimney_installation'
  | 'chimney_removal'
  | 'chimney_repairs'
  | 'chimney_flue_lining'
  | 'guttering_replacement'
  | 'guttering_repairs'
  | 'drainage_soakaways'
  | 'external_staircase'
  | 'fire_escape'
  
  // Systems & Infrastructure
  | 'heating_boiler_replacement'
  | 'heating_radiator_upgrade'
  | 'heating_underfloor'
  | 'heating_heat_pump'
  | 'electrical_rewiring'
  | 'electrical_consumer_unit'
  | 'electrical_ev_charging'
  | 'electrical_smart_home'
  | 'plumbing_bathroom'
  | 'plumbing_kitchen'
  | 'plumbing_water_pressure'
  | 'plumbing_mains_upgrade'
  | 'insulation_loft'
  | 'insulation_cavity_wall'
  | 'insulation_external_wall'
  | 'insulation_floor'
  | 'insulation_acoustic'
  | 'solar_panels'
  | 'solar_battery_storage'
  | 'renewable_wind_turbine'
  | 'air_conditioning'
  | 'ventilation_mvhr'
  | 'ventilation_extract_fans'
  | 'security_alarms'
  | 'security_cctv'
  | 'security_access_control'
  | 'broadband_networking'
  | 'gas_supply_upgrade'
  | 'gas_connection'
  
  // Flooring & Interior Finishes
  | 'flooring_hardwood_solid'
  | 'flooring_hardwood_engineered'
  | 'flooring_parquet'
  | 'flooring_herringbone'
  | 'flooring_laminate'
  | 'flooring_lvt'
  | 'flooring_carpet_fitted'
  | 'flooring_carpet_rugs'
  | 'flooring_stair_runners'
  | 'tiling_ceramic'
  | 'tiling_porcelain'
  | 'tiling_natural_stone'
  | 'tiling_mosaic'
  | 'flooring_vinyl'
  | 'flooring_linoleum'
  | 'flooring_concrete_polished'
  | 'flooring_resin_epoxy'
  | 'skirting_replacement'
  | 'architrave_replacement'
  | 'coving_installation'
  | 'ceiling_roses'
  
  // Kitchens & Fitted Furniture
  | 'kitchen_bespoke_design'
  | 'kitchen_island'
  | 'kitchen_breakfast_bar'
  | 'pantry_installation'
  | 'larder_installation'
  | 'wardrobes_built_in'
  | 'storage_built_in'
  | 'bookcases_fitted'
  | 'shelving_fitted'
  | 'window_seats'
  | 'storage_benches'
  | 'walk_in_closet'
  | 'dressing_room'
  | 'murphy_bed'
  | 'space_saving_furniture'
  | 'home_bar'
  | 'entertainment_unit'
  
  // Bathrooms & Wet Areas
  | 'bathroom_luxury_suite'
  | 'shower_walk_in'
  | 'shower_steam_room'
  | 'bath_freestanding'
  | 'bath_built_in'
  | 'towel_rail_heated'
  | 'bathroom_ventilation'
  | 'waterproofing_tanking'
  | 'bathroom_accessible'
  | 'bathroom_adaptations'
  | 'cloakroom'
  | 'powder_room'
  | 'spa_bathroom'
  | 'wellness_area'
  
  // Specialist Projects
  | 'swimming_pool_indoor'
  | 'swimming_pool_outdoor'
  | 'swimming_pool_natural'
  | 'hot_tub'
  | 'spa'
  | 'home_cinema'
  | 'media_room'
  | 'soundproofing'
  | 'wine_cellar'
  | 'wine_storage'
  | 'accessibility_ramps'
  | 'accessibility_stairlift'
  | 'accessibility_door_widening'
  | 'period_restoration'
  | 'listed_building_renovation'
  | 'acoustic_treatment'
  | 'panic_room'
  | 'secure_storage'
  | 'art_studio'
  | 'creative_space'
  | 'gym_fitness_room'
  | 'sauna'
  | 'steam_room'
  | 'greenhouse'
  | 'potting_shed'
  | 'outdoor_kitchen'
  | 'bbq_area'
  | 'tree_house'
  | 'play_area'
  
  // Commercial & Mixed-Use
  | 'shop_to_residential'
  | 'office_to_residential'
  | 'barn_conversion'
  | 'church_conversion'
  | 'chapel_conversion'
  | 'pub_conversion'
  | 'restaurant_conversion'
  | 'industrial_conversion'
  | 'mixed_use_development'
  
  // Maintenance & Repairs
  | 'damp_proofing'
  | 'waterproofing'
  | 'structural_repairs_subsidence'
  | 'structural_repairs_settlement'
  | 'roof_repairs_maintenance'
  | 'window_door_repairs'
  | 'heating_servicing'
  | 'heating_repairs'
  | 'electrical_fault_finding'
  | 'electrical_repairs'
  | 'plumbing_repairs_maintenance'
  | 'decorating_interior'
  | 'decorating_exterior'
  | 'painting_interior'
  | 'painting_exterior'
  | 'gutter_cleaning'
  | 'gutter_repairs'
  | 'pest_control'
  
  // Others category for AI categorization
  | 'others';

export type VettingStatus = 'pending' | 'approved' | 'rejected';

export type QuoteStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';

export interface User {
  id: string;
  email: string;
  userType: UserType;
  profile: UserProfile;
  createdAt: Date;
  lastLogin: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: Address;
}

export interface BuilderProfile extends UserProfile {
  id: string;
  companyName: string;
  companiesHouseNumber: string;
  insuranceDocuments: Document[];
  vettingStatus: VettingStatus;
  specializations: ProjectType[];
  serviceAreas: string[];
  rating?: number;
  completedProjects?: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
}

export interface Property {
  id: string;
  address: Address;
  councilArea: string;
  isListedBuilding: boolean;
  isInConservationArea: boolean;
  planningHistory: PlanningApplication[];
  buildingRegulations: RegulationRequirement[];
}

export interface PlanningApplication {
  id: string;
  reference: string;
  description: string;
  status: string;
  submittedDate: Date;
  decisionDate?: Date;
}

export interface RegulationRequirement {
  id: string;
  type: string;
  description: string;
  mandatory: boolean;
}

export interface Project {
  id: string;
  homeownerId: string;
  propertyId: string;
  projectType: ProjectType;
  status: ProjectStatus;
  sowDocument?: SoWDocument;
  ganttChart?: GanttChart;
  quotes: Quote[];
  invitedBuilders: BuilderInvitation[];
  selectedBuilderId?: string;
  contract?: Contract;
  timeline: ProjectTimeline;
  builderReview?: BuilderReviewResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuilderInvitation {
  builderId: string;
  invitationCode: string;
  invitedAt: Date;
  accessedAt?: Date;
  quoteSubmitted: boolean;
  quoteId?: string;
  status: 'invited' | 'accessed' | 'quoted' | 'selected' | 'rejected';
}

export interface SoWDocument {
  id: string;
  projectId: string;
  version: number;
  sections: SoWSection[];
  materials: MaterialSpecification[];
  laborRequirements: LaborRequirement[];
  timeline: TaskTimeline[];
  estimatedCosts: CostBreakdown;
  regulatoryRequirements: RegulationRequirement[];
  generatedAt: Date;
  lastModified?: Date;
  reviewApplied?: boolean;
  appliedRecommendations?: string[];
}

export interface SoWSection {
  id: string;
  title: string;
  description: string;
  specifications: string[];
  dependencies: string[];
}

export interface MaterialSpecification {
  id: string;
  name: string;
  category: 'builder_provided' | 'homeowner_provided';
  quantity: number;
  unit: string;
  estimatedCost?: number;
  specifications: string[];
}

export interface LaborRequirement {
  id: string;
  trade: string;
  description: string;
  personDays: number;
  estimatedCost?: number;
  qualifications: string[];
}

export interface TaskTimeline {
  id: string;
  name: string;
  description: string;
  duration: number; // in days
  dependencies: string[];
  canRunInParallel: boolean;
  trade: string;
}

export interface CostBreakdown {
  totalEstimate: number;
  laborCosts: number;
  materialCosts: number;
  builderMaterials: number;
  homeownerMaterials: number;
  breakdown: CostItem[];
}

export interface CostItem {
  category: string;
  description: string;
  amount: number;
}

export interface GanttChart {
  id: string;
  projectId: string;
  tasks: GanttTask[];
  totalDuration: number;
  criticalPath: string[];
  generatedAt: Date;
}

export interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  dependencies: string[];
  trade: string;
  progress: number;
}

export interface ProjectTimeline {
  estimatedStartDate?: Date;
  estimatedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
}

export interface Quote {
  id: string;
  projectId: string;
  builderId: string;
  pricing: QuotePricing;
  timeline: number; // working days
  startDate: Date;
  projectedCompletionDate: Date;
  amendments: SoWAmendment[];
  termsAndConditions: string;
  insuranceDocuments: Document[];
  referenceProjects: ReferenceProject[];
  status: QuoteStatus;
  submittedAt: Date;
  aiAnalysis?: QuoteAnalysis;
}

export interface QuotePricing {
  totalAmount: number;
  laborCosts: number;
  materialCosts: number;
  breakdown: PricingBreakdown[];
  varianceFromEstimate?: number;
}

export interface PricingBreakdown {
  category: string;
  description: string;
  amount: number;
  unit?: string;
  quantity?: number;
}

export interface SoWAmendment {
  id: string;
  section: string;
  originalText: string;
  proposedText: string;
  reason: string;
  status: 'proposed' | 'accepted' | 'rejected';
}

export interface ReferenceProject {
  address: string;
  projectType: string;
  completionDate: Date;
  contactAllowed: boolean;
  visitAllowed: boolean;
  description: string;
}

export interface QuoteAnalysis {
  redFlags: RedFlag[];
  timelineAnalysis: TimelineAnalysis;
  pricingAnalysis: PricingAnalysis;
  overallRisk: 'low' | 'medium' | 'high';
}

export interface RedFlag {
  type: 'pricing' | 'timeline' | 'documentation' | 'references';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface TimelineAnalysis {
  isRealistic: boolean;
  comparedToAverage: number; // percentage difference
  concerns: string[];
  recommendations: string[];
}

export interface PricingAnalysis {
  comparedToEstimate: number; // percentage difference
  comparedToMarket: number; // percentage difference
  unusualItems: string[];
  recommendations: string[];
}

export type ContractStatus = 'draft' | 'pending_signatures' | 'sent_for_signing' | 'partially_signed' | 'signed' | 'completed' | 'cancelled' | 'expired';

export interface Contract {
  id: string;
  projectId: string;
  homeownerId: string;
  builderId: string;
  quoteId: string;
  sowId: string;
  content: string;
  status: ContractStatus;
  templateVersion: string;
  totalAmount: number;
  projectTimeline: number;
  startDate: Date;
  projectedCompletionDate: Date;
  termsAndConditions: string;
  projectTermsId?: string; // Reference to agreed project terms
  createdAt: Date;
  updatedAt: Date;
  signedAt?: Date;
  homeownerSignedAt?: Date;
  builderSignedAt?: Date;
  docuSignEnvelopeId?: string;
  signatureData?: ContractSignatureData;
  complianceChecks: ContractComplianceChecks;
}

export interface ContractSignatureData {
  homeownerSignature?: {
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
    signatureImage?: string;
  };
  builderSignature?: {
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
    signatureImage?: string;
  };
  docuSignData?: {
    envelopeId: string;
    status: string;
    completedAt?: Date;
    documentUrl?: string;
  };
}

export interface ContractComplianceChecks {
  ukBuildingRegulations: boolean;
  industryStandards: boolean;
  unambiguousTerms: boolean;
  termsAgreed?: boolean; // Whether terms and conditions have been agreed by both parties
  validatedAt: Date;
  validatedBy?: string;
}

export interface ContractTemplate {
  id: string;
  projectType: string;
  version: string;
  content: string;
  standardTerms: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

export interface ContractGenerationRequest {
  projectId: string;
  selectedQuoteId: string;
  homeownerId: string;
  builderId: string;
  meetingCompleted?: boolean;
  additionalTerms?: string;
}

export interface ContractDownloadRequest {
  contractId: string;
  userId: string;
  userType: UserType;
  format: 'pdf' | 'html';
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  size: number;
}

export interface AIAgent {
  id: string;
  name: string;
  specialization: string;
  projectTypes: ProjectType[];
  promptTemplate: string;
  knowledgeBase: KnowledgeBase;
  dependencies: string[];
  isOrchestrator: boolean;
}

export interface KnowledgeBase {
  id: string;
  domain: string;
  facts: string[];
  regulations: string[];
  bestPractices: string[];
  lastUpdated: Date;
}

export interface AgentResponse {
  agentId: string;
  response: string;
  confidence: number;
  recommendations: string[];
  nextQuestions: string[];
  data: Record<string, unknown>;
}

export interface ProjectContext {
  projectId: string;
  projectType: ProjectType;
  property: Property;
  userResponses: Record<string, unknown>;
  previousAgentResponses: AgentResponse[];
}

// Project Type Management Interfaces
export interface ProjectTypeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  projectTypes: ProjectTypeInfo[];
}

export interface ProjectTypeInfo {
  id: ProjectType;
  name: string;
  description: string;
  category: string;
  estimatedCostRange: {
    min: number;
    max: number;
  };
  estimatedDuration: {
    min: number; // weeks
    max: number;
  };
  complexity: 'low' | 'medium' | 'high';
  requiresPlanning: boolean;
  requiresBuildingRegs: boolean;
  popularityRank: number;
  imageUrl?: string;
  tags: string[];
  relatedTypes: ProjectType[];
}

export interface ProjectTypeSelection {
  selectedType: ProjectType;
  customDescription?: string; // For "others" category
  aiCategorization?: {
    suggestedType: ProjectType;
    confidence: number;
    reasoning: string;
  };
}

// Builder Review Agent Interfaces
export interface BuilderReviewResult {
  id: string;
  projectId: string;
  analysis: BuilderReviewAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuilderReviewAnalysis {
  overallScore: number; // 0-100 quality score
  issues: BuilderReviewIssue[];
  recommendations: BuilderReviewRecommendation[];
  missingElements: string[];
  unrealisticSpecifications: string[];
  regulatoryIssues: string[];
  costAccuracyIssues: string[];
  materialImprovements: string[];
  timelineIssues: string[];
  qualityIndicator: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  reviewedAt: Date;
  reviewAgentType: string;
}

export interface BuilderReviewIssue {
  id: string;
  category: 'missing_work' | 'unrealistic_timeline' | 'regulatory' | 'cost_accuracy' | 'material_spec' | 'sequencing';
  severity: 'critical' | 'major' | 'minor';
  title: string;
  description: string;
  location: string; // section of SoW where issue was found
  impact: string;
}

export interface BuilderReviewRecommendation {
  id: string;
  issueId: string;
  type: 'addition' | 'modification' | 'removal' | 'clarification';
  title: string;
  description: string;
  suggestedText?: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
}

// Payment and Subscription Types
export type SubscriptionTier = 'free' | 'basic' | 'premium';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  userType: 'homeowner' | 'builder';
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  limits: UsageLimits;
  stripePriceId: string;
  stripeYearlyPriceId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface UsageLimits {
  maxProjects?: number;
  maxBuilderInvitations?: number;
  maxLeadPurchases?: number;
  maxAnalyticsAccess?: boolean;
  pdfDownloads?: boolean;
  detailedCosting?: boolean;
  professionalQuoteGeneration?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  type: 'subscription' | 'lead_purchase' | 'upgrade' | 'one_time';
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId: string;
  stripeChargeId?: string;
  description: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  refundedAt?: Date;
  refundAmount?: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number; // percentage (0-100) or fixed amount in pence
  description: string;
  maxUses?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  applicablePlans: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountUsage {
  id: string;
  discountCodeId: string;
  userId: string;
  paymentId: string;
  discountAmount: number;
  usedAt: Date;
}

export interface LeadPurchase {
  id: string;
  builderId: string;
  projectId: string;
  amount: number;
  status: PaymentStatus;
  paymentId: string;
  purchasedAt: Date;
  accessGrantedAt?: Date;
  expiresAt?: Date;
}

export interface FinancialSummary {
  userId: string;
  userType: UserType;
  currentSubscription?: UserSubscription;
  totalSpent: number;
  monthlySpend: number;
  yearlySpend: number;
  leadPurchases: LeadPurchase[];
  recentPayments: Payment[];
  upcomingCharges: UpcomingCharge[];
  generatedAt: Date;
}

export interface UpcomingCharge {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  type: 'subscription' | 'usage';
}

// Feedback and Rating System Types
export interface ProjectFeedback {
  id: string;
  projectId: string;
  homeownerId: string;
  builderId: string;
  rating: number; // 1-5 stars
  overallSatisfaction: number; // 1-5 scale
  qualityRating: number; // 1-5 scale
  timelinessRating: number; // 1-5 scale
  communicationRating: number; // 1-5 scale
  cleanlinessRating: number; // 1-5 scale
  professionalismRating: number; // 1-5 scale
  valueForMoneyRating: number; // 1-5 scale
  writtenFeedback: string;
  wouldRecommend: boolean;
  completionPhotos: CompletionPhoto[];
  improvementSuggestions?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean; // Whether feedback can be shown to other homeowners
}

export interface CompletionPhoto {
  id: string;
  feedbackId: string;
  url: string;
  caption?: string;
  beforePhoto?: boolean; // true for before, false for after
  roomType?: string;
  uploadedAt: Date;
  fileSize: number;
  fileName: string;
}

export interface BuilderRating {
  builderId: string;
  overallRating: number; // Average of all ratings
  totalReviews: number;
  qualityAverage: number;
  timelinessAverage: number;
  communicationAverage: number;
  cleanlinessAverage: number;
  professionalismAverage: number;
  valueForMoneyAverage: number;
  recommendationPercentage: number; // Percentage who would recommend
  recentFeedback: ProjectFeedback[];
  ratingDistribution: RatingDistribution;
  lastUpdated: Date;
}

export interface RatingDistribution {
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

export interface FeedbackSubmissionRequest {
  projectId: string;
  rating: number;
  overallSatisfaction: number;
  qualityRating: number;
  timelinessRating: number;
  communicationRating: number;
  cleanlinessRating: number;
  professionalismRating: number;
  valueForMoneyRating: number;
  writtenFeedback: string;
  wouldRecommend: boolean;
  improvementSuggestions?: string;
  isPublic: boolean;
  photos: File[];
}

export interface BuilderLeadPriority {
  builderId: string;
  priority: number; // Higher number = higher priority
  rating: number;
  totalReviews: number;
  responseTime: number; // Average response time in hours
  acceptanceRate: number; // Percentage of leads accepted
  completionRate: number; // Percentage of projects completed successfully
  lastActive: Date;
  serviceAreas: string[];
  specializations: ProjectType[];
}

// Builder Analytics and Financial Summary Types
export interface BuilderAnalytics {
  totalLeadsPurchased: number;
  totalSpentOnLeads: number;
  monthlyLeadSpend: number;
  averageLeadCost: number;
  conversionRate: number;
  projectsWon: number;
  totalRevenue: number;
  averageProjectValue: number;
  topProjectTypes: { projectType: string; count: number; winRate: number }[];
  geographicPerformance: { area: string; leadsCount: number; winRate: number }[];
  professionalQuotesGenerated: number;
  monthlyQuoteGeneration: number;
}

export interface BuilderFinancialSummary extends FinancialSummary {
  analytics: BuilderAnalytics;
  leadPurchaseHistory: LeadPurchase[];
  subscriptionHistory: UserSubscription[];
}

// Lead Management Types
export interface LeadOffer {
  id: string;
  projectId: string;
  builderId: string;
  price: number;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired' | 'declined';
  offeredAt: Date;
}