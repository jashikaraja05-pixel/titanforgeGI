export type CriticalityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type CaseStatus = 
  | 'Submitted' 
  | 'AI Analyzed' 
  | 'Sent to Authority' 
  | 'Under Review' 
  | 'Assigned' 
  | 'Action In Progress' 
  | 'Resolved';

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  city: string;
  state: string;
  country: string;
  district?: string;
  ward?: string;
  isExactGps: boolean;
}

export interface ScoreBreakdown {
  citizenDemand: number; // out of 25
  infrastructureGap: number; // out of 25
  populationImpact: number; // out of 20
  urgency: number; // out of 15
  vulnerability: number; // out of 15
}

export interface TimelineEvent {
  status: CaseStatus;
  timestamp: string;
  actor: string;
  note: string;
}

export interface CitizenFeedback {
  resolved: boolean;
  rating: number; // 1-5
  comment?: string;
  timestamp: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: 'citizen' | 'government' | 'visitor';
  category?: 'platform' | 'government_action' | 'civic_service' | 'ai_accuracy' | 'resolution' | 'general' | 'policy_feedback' | string;
  rating: number; // 1 to 5
  comment: string;
  issueId?: string;
  issueTitle?: string;
  policyId?: string;
  policyTitle?: string;
  inputMode?: 'voice' | 'text';
  language?: string;
  resolved?: boolean;
  createdAt: string;
}

export type PolicyPriority = 'URGENT' | 'HIGH' | 'REGULAR';
export type PolicyScope = 'district' | 'state' | 'national';

export interface GovernmentPolicy {
  id: string;
  title: string;
  summary: string;
  fullContent?: string;
  category: string;
  department: string;
  gazetteRef?: string;
  scope: PolicyScope;
  affectedCountry: string;
  affectedState: string;
  affectedDistrict?: string; // 'Chennai', 'Coimbatore', 'All Districts', etc.
  affectedAreas?: string[]; // Specific wards or neighborhoods
  priority: PolicyPriority;
  actionRequiredForCitizen?: string;
  effectiveDate?: string;
  publishedAt: string;
  officialDocumentUrl?: string;
  isRead?: boolean;
}

export interface CivicIssue {
  id: string; // e.g. GI-2026-000123
  title: string;
  description: string;
  originalLanguage: string;
  detectedLanguageCode: string;
  transcription?: string;
  aiSummary: string;
  aiVoiceResponseText?: string;
  category: string;
  subcategory?: string;
  photoUrl?: string;
  photoAnalysis?: {
    detectedObject: string;
    confidence: number;
    severity: CriticalityLevel;
    details: string;
  };
  resolutionPhotoUrl?: string;
  location: LocationData;
  criticality: CriticalityLevel;
  criticalityReasons: string[];
  priorityScore: number; // 0 - 100
  scoreBreakdown: ScoreBreakdown;
  isUnderRepresentedArea: boolean;
  underRepresentedReason?: string;
  duplicateCount: number; // number of merged citizen reports
  hotspotName?: string;
  recommendedDepartment: string;
  assignedDepartment?: string;
  assignedOfficer?: string;
  status: CaseStatus;
  timeline: TimelineEvent[];
  citizenFeedback?: CitizenFeedback;
  affectedPopulationEstimate: number;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  evidenceTypes: ('voice' | 'text' | 'photo' | 'gps')[];
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  speechLocale: string;
  sampleVoicePrompt: string;
  sampleVoiceText: string;
}

export interface CountryProfile {
  code: string;
  name: string;
  flag: string;
  defaultCoords: { lat: number; lng: number };
  currencySymbol: string;
  currencyName: string;
  regions: string[];
  departments: string[];
}

export interface GovernmentOfficial {
  id: string;
  name: string;
  role: string;
  department: string;
  country: string;
  badgeId: string;
  avatar: string;
}

export interface PolicyScenario {
  id: string;
  title: string;
  focus: string;
  budgetAllocated: string;
  beneficiaries: number;
  gapReductionPercent: number;
  accessibilityImprovement: number;
  priorityRegionsAddressed: number;
  estimatedImpactScore: number;
  aiRationale: string;
  recommended?: boolean;
}

export interface FutureTrend {
  category: string;
  currentCount: number;
  previousCount: number;
  growthRatePercent: number;
  risk30Days: string;
  risk6Months: string;
  risk1Year: string;
  urgencyLevel: CriticalityLevel;
  forecastSummary: string;
}

export interface ImpactBeforeAfter {
  metricName: string;
  category: string;
  beforeValue: string;
  afterValue: string;
  improvementPercentage: number;
  description: string;
}

export interface CivicSectorTheme {
  id: string;
  name: string;
  tamilName?: string;
  iconName: string;
  defaultCategory: string;
  samplePrompt: string;
  targetDepartment: string;
  accentColor: string;
  description: string;
}

export const CIVIC_SECTOR_THEMES: CivicSectorTheme[] = [
  {
    id: 'health',
    name: 'Healthcare & Hospitals',
    tamilName: 'மருத்துவம் & ஆரம்ப சுகாதார நிலையம்',
    iconName: 'HeartPulse',
    defaultCategory: 'Healthcare & Public Health Authority',
    samplePrompt: 'Emergency medical supplies and diagnostic equipment are critically unavailable at the general hospital...',
    targetDepartment: 'Health & Family Welfare Department',
    accentColor: '#ef4444',
    description: 'Hospital equipment shortages, doctor availability, ambulance delays, PHC medicines',
  },
  {
    id: 'food',
    name: 'Food Safety & Ration / PDS',
    tamilName: 'உணவு பாதுகாப்பு & ரேஷன் பொருட்கள் (PDS)',
    iconName: 'Utensils',
    defaultCategory: 'Food Safety & Civil Supplies / PDS Authority',
    samplePrompt: 'Substandard essential food grain stock and distribution irregularities at public ration center...',
    targetDepartment: 'Civil Supplies & Consumer Protection Department',
    accentColor: '#f97316',
    description: 'Ration shop stock shortages, adulterated food, mid-day meal quality, price gouging',
  },
  {
    id: 'education',
    name: 'Education & Schools',
    tamilName: 'கல்வி & அரசு பள்ளி உட்கட்டமைப்பு',
    iconName: 'GraduationCap',
    defaultCategory: 'Public Education & School Infrastructure',
    samplePrompt: 'Government primary school has severe roof plaster damage and lacking safe drinking water for students...',
    targetDepartment: 'School Education Department',
    accentColor: '#8b5cf6',
    description: 'School building safety, classroom desks, drinking water for students, teacher vacancies',
  },
  {
    id: 'water',
    name: 'Drinking Water & Sewerage',
    tamilName: 'குடிநீர் & கழிவுநீர் வாரியம்',
    iconName: 'Droplets',
    defaultCategory: 'Water Supply & Sewerage Board',
    samplePrompt: 'Major municipal water supply pipeline burst causing street flooding and acute drinking water shortage...',
    targetDepartment: 'Water Supply & Drainage Board',
    accentColor: '#06b6d4',
    description: 'Pipeline bursts, contaminated tap water, drinking water scarcity, sewage overflows',
  },
  {
    id: 'roads',
    name: 'Roads, Bridges & Transport',
    tamilName: 'சாலை, மேம்பாலம் & பேருந்து போக்குவரத்து',
    iconName: 'Construction',
    defaultCategory: 'Highways & Public Works Department',
    samplePrompt: 'Severe deep road craters and pedestrian bridge structural cracks causing critical transit hazards...',
    targetDepartment: 'Highways & Public Works Department',
    accentColor: '#eab308',
    description: 'Dangerous potholes, bridge cracks, missing road signs, public bus route delays',
  },
  {
    id: 'power',
    name: 'Electricity & Street Lights',
    tamilName: 'மின்சாரம் & எரியாத தெருவிளக்குகள்',
    iconName: 'Zap',
    defaultCategory: 'State Electricity Distribution Board',
    samplePrompt: 'Prolonged night-time corridor blackouts and exposed high-voltage wiring creating severe electrocution hazard...',
    targetDepartment: 'State Electricity Board (Power Grid)',
    accentColor: '#fbbf24',
    description: 'Frequent blackouts, low voltage, hanging electrical cables, burnt streetlights',
  },
  {
    id: 'sanitation',
    name: 'Sanitation & Waste Management',
    tamilName: 'துப்புரவு & குப்பை மேலாண்மை',
    iconName: 'Trash2',
    defaultCategory: 'Municipal Solid Waste & Sanitation',
    samplePrompt: 'Massive decomposing open garbage dump and clogged sewage drains overflowing onto pedestrian walkways...',
    targetDepartment: 'Municipal Corporation Sanitation Wing',
    accentColor: '#10b981',
    description: 'Uncollected street garbage, open drains, clogged storm drains, mosquito breeding',
  },
  {
    id: 'safety',
    name: 'Public Safety & Emergency',
    tamilName: 'பொது பாதுகாப்பு & விபத்து தடுப்பு',
    iconName: 'ShieldAlert',
    defaultCategory: 'Public Safety & Disaster Management',
    samplePrompt: 'Hazardous leaning tree on public road and missing safety barricades near high-traffic school crosswalk...',
    targetDepartment: 'Public Safety & Police Traffic Authority',
    accentColor: '#f43f5e',
    description: 'Hazardous trees, lack of speed breakers near schools, fire hazard, pedestrian safeguards',
  },
];

// Predictive Policy Impact Analysis Types
export type PotentialImpactScore = 'Low' | 'Medium' | 'High';

export interface PolicyCitizenImpact {
  policyId: string;
  policyTitle: string;
  potentialImpactScore: PotentialImpactScore;
  numericScore: number; // 0 to 100
  impactSummary: string; // Tailored explanation based on citizen's stated interests
  keyBenefits: string[];
  actionSteps: string[];
  urgencyLevel: 'Immediate' | 'Upcoming' | 'Informational';
  relevantInterestMatches: string[];
  riskOrWatchpoints: string[];
  analyzedAt: string;
  source: 'gemini-3.8-flash' | 'predictive-heuristic-engine';
}

export interface CitizenInterestsProfile {
  topics: string[];
  customInterests?: string;
  occupation?: string;
  householdType?: string;
  district?: string;
  state?: string;
  ward?: string;
}

export const AVAILABLE_CIVIC_INTERESTS: { id: string; label: string; icon: string; category: string }[] = [
  { id: 'water_drainage', label: 'Drinking Water & Drainage', icon: 'Droplets', category: 'Water & Drainage' },
  { id: 'roads_transit', label: 'Roads & Daily Commute', icon: 'Construction', category: 'Roads & Infrastructure' },
  { id: 'solar_energy', label: 'Rooftop Solar & Power Subsidies', icon: 'Zap', category: 'Electricity & Power' },
  { id: 'flood_monsoon', label: 'Monsoon Floods & Storm Drains', icon: 'ShieldAlert', category: 'Disaster Preparedness' },
  { id: 'healthcare_phc', label: 'Public Healthcare & Hospitals', icon: 'HeartPulse', category: 'Healthcare' },
  { id: 'schools_education', label: 'Public Schools & Education', icon: 'GraduationCap', category: 'Education' },
  { id: 'sanitation_waste', label: 'Sanitation & Garbage Clearance', icon: 'Trash2', category: 'Sanitation' },
  { id: 'ev_green_transit', label: 'Electric Vehicles & Clean Mobility', icon: 'Sparkles', category: 'Infrastructure' },
  { id: 'pds_ration', label: 'PDS Ration & Food Security', icon: 'Utensils', category: 'Food Safety' },
  { id: 'senior_safety', label: 'Pedestrian Safety & Senior Care', icon: 'ShieldCheck', category: 'Public Safety' },
];

