import { GovernmentPolicy, PolicyCitizenImpact, CitizenInterestsProfile, AVAILABLE_CIVIC_INTERESTS } from '../types';

const CITIZEN_INTERESTS_KEY = 'govinsight_citizen_interests_v1';
const POLICY_IMPACT_CACHE_KEY = 'govinsight_policy_impact_cache_v1';

// Default initial interests for a citizen
export const DEFAULT_CITIZEN_INTERESTS: CitizenInterestsProfile = {
  topics: [
    'Drinking Water & Drainage',
    'Roads & Daily Commute',
    'Monsoon Floods & Storm Drains',
    'Rooftop Solar & Power Subsidies',
  ],
  customInterests: 'Local resident, daily commuter, concerned about monsoon flood preparedness and drinking water purity',
  occupation: 'Resident Commuter',
  householdType: 'Domestic Family',
  district: 'Chennai',
  state: 'Tamil Nadu',
  ward: 'Velachery / Ward 114',
};

// Retrieve citizen interests from localStorage or defaults
export function getCitizenInterests(userData?: any): CitizenInterestsProfile {
  try {
    const raw = localStorage.getItem(CITIZEN_INTERESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CITIZEN_INTERESTS,
        ...parsed,
        district: userData?.district || parsed.district || DEFAULT_CITIZEN_INTERESTS.district,
        state: userData?.state || parsed.state || DEFAULT_CITIZEN_INTERESTS.state,
        ward: userData?.ward || parsed.ward || DEFAULT_CITIZEN_INTERESTS.ward,
      };
    }
  } catch (err) {
    console.warn('Error reading citizen interests:', err);
  }

  return {
    ...DEFAULT_CITIZEN_INTERESTS,
    district: userData?.district || DEFAULT_CITIZEN_INTERESTS.district,
    state: userData?.state || DEFAULT_CITIZEN_INTERESTS.state,
    ward: userData?.ward || DEFAULT_CITIZEN_INTERESTS.ward,
  };
}

// Save updated citizen interests and trigger reactive update
export function saveCitizenInterests(interests: CitizenInterestsProfile): void {
  try {
    localStorage.setItem(CITIZEN_INTERESTS_KEY, JSON.stringify(interests));
    // Clear old impact cache so re-calculation occurs with new interests
    localStorage.removeItem(POLICY_IMPACT_CACHE_KEY);
    window.dispatchEvent(new CustomEvent('govinsight_citizen_interests_updated', { detail: interests }));
  } catch (err) {
    console.warn('Error saving citizen interests:', err);
  }
}

// In-memory cache
const memoryImpactCache: Record<string, PolicyCitizenImpact> = {};

export function getCachedPolicyImpact(policyId: string): PolicyCitizenImpact | null {
  if (memoryImpactCache[policyId]) {
    return memoryImpactCache[policyId];
  }
  try {
    const raw = localStorage.getItem(POLICY_IMPACT_CACHE_KEY);
    if (raw) {
      const cache = JSON.parse(raw);
      if (cache[policyId]) {
        memoryImpactCache[policyId] = cache[policyId];
        return cache[policyId];
      }
    }
  } catch {
    // fallback
  }
  return null;
}

export function savePolicyImpactCache(impact: PolicyCitizenImpact): void {
  memoryImpactCache[impact.policyId] = impact;
  try {
    const raw = localStorage.getItem(POLICY_IMPACT_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[impact.policyId] = impact;
    localStorage.setItem(POLICY_IMPACT_CACHE_KEY, JSON.stringify(cache));
    window.dispatchEvent(new CustomEvent('govinsight_policy_impact_updated', { detail: impact }));
  } catch {
    // fallback
  }
}

/**
 * Predict potential impact score for a single policy using the Gemini API backend
 */
export async function predictPolicyImpact(
  policy: GovernmentPolicy,
  interests?: CitizenInterestsProfile
): Promise<PolicyCitizenImpact> {
  const citizen = interests || getCitizenInterests();

  // Check cache first for instant responsiveness
  const cached = getCachedPolicyImpact(policy.id);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch('/api/policy/predict-impact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        policy: {
          id: policy.id,
          title: policy.title,
          summary: policy.summary,
          fullContent: policy.fullContent,
          category: policy.category,
          department: policy.department,
          gazetteRef: policy.gazetteRef,
          scope: policy.scope,
          affectedCountry: policy.affectedCountry,
          affectedState: policy.affectedState,
          affectedDistrict: policy.affectedDistrict,
          affectedAreas: policy.affectedAreas,
          priority: policy.priority,
          actionRequiredForCitizen: policy.actionRequiredForCitizen,
          effectiveDate: policy.effectiveDate,
        },
        citizenInterests: {
          topics: citizen.topics,
          customInterests: citizen.customInterests,
          occupation: citizen.occupation,
          householdType: citizen.householdType,
          district: citizen.district,
          state: citizen.state,
          ward: citizen.ward,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data: PolicyCitizenImpact = await response.json();
    savePolicyImpactCache(data);
    return data;
  } catch (err) {
    console.warn('Network call to predict-impact failed, computing immediate fallback:', err);
    // Instant fallback calculation
    const fallback = computeClientHeuristicImpact(policy, citizen);
    savePolicyImpactCache(fallback);
    return fallback;
  }
}

/**
 * Predict potential impact scores for all active policies
 */
export async function predictBatchPoliciesImpact(
  policies: GovernmentPolicy[],
  interests?: CitizenInterestsProfile
): Promise<Record<string, PolicyCitizenImpact>> {
  const citizen = interests || getCitizenInterests();
  const results: Record<string, PolicyCitizenImpact> = {};

  // For instant responsiveness, fill any missing from client heuristic or batch API
  const uncachedPolicies: GovernmentPolicy[] = [];

  for (const policy of policies) {
    const cached = getCachedPolicyImpact(policy.id);
    if (cached) {
      results[policy.id] = cached;
    } else {
      uncachedPolicies.push(policy);
    }
  }

  if (uncachedPolicies.length === 0) {
    return results;
  }

  try {
    const response = await fetch('/api/policy/predict-impact-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        policies: uncachedPolicies,
        citizenInterests: citizen,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.results)) {
        for (const item of data.results) {
          results[item.policyId] = item;
          savePolicyImpactCache(item);
        }
        return results;
      }
    }
  } catch (err) {
    console.warn('Batch prediction fallback:', err);
  }

  // Client-side heuristic if server was unreachable
  for (const policy of uncachedPolicies) {
    const impact = computeClientHeuristicImpact(policy, citizen);
    results[policy.id] = impact;
    savePolicyImpactCache(impact);
  }

  return results;
}

/**
 * Client-side heuristic calculation for instant preview without delay
 */
function computeClientHeuristicImpact(
  policy: GovernmentPolicy,
  citizen: CitizenInterestsProfile
): PolicyCitizenImpact {
  const topics = citizen.topics || [];
  const text = `${policy.title} ${policy.summary} ${policy.fullContent || ''} ${policy.category} ${policy.department}`.toLowerCase();

  let score = 25;
  const matched: string[] = [];

  for (const t of topics) {
    const words = t.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const match = words.some((w) => text.includes(w));
    if (match) {
      score += 35;
      matched.push(t);
    }
  }

  if (citizen.district && (policy.affectedDistrict || '').toLowerCase().includes(citizen.district.toLowerCase())) {
    score += 15;
  }

  if (policy.priority === 'URGENT') score += 15;
  else if (policy.priority === 'HIGH') score += 10;

  const finalScore = Math.min(96, Math.max(20, score));
  let impactScore: 'Low' | 'Medium' | 'High' = 'Low';
  if (finalScore >= 70) impactScore = 'High';
  else if (finalScore >= 40) impactScore = 'Medium';

  return {
    policyId: policy.id,
    policyTitle: policy.title,
    potentialImpactScore: impactScore,
    numericScore: finalScore,
    impactSummary:
      impactScore === 'High'
        ? `Direct high impact on your household based on your interest in ${matched.join(', ') || 'essential civic services'}.`
        : impactScore === 'Medium'
        ? `Moderate potential impact on your neighborhood aligning with ${matched[0] || 'civic directives'}.`
        : `Informational impact for your profile. Establishes baseline municipal service levels.`,
    keyBenefits: [
      `Direct relevance to your interests: ${matched.join(', ') || 'Public Infrastructure'}`,
      `Verified SLA tracking from ${policy.department}`,
    ],
    actionSteps: [
      policy.actionRequiredForCitizen || 'Review full gazette directive and helpline contacts.',
      'Track real-time progress on GovInsight People Portal.',
    ],
    urgencyLevel: policy.priority === 'URGENT' ? 'Immediate' : policy.priority === 'HIGH' ? 'Upcoming' : 'Informational',
    relevantInterestMatches: matched,
    riskOrWatchpoints: ['Follow official advisory guidelines and report municipal delays.'],
    analyzedAt: new Date().toISOString(),
    source: 'predictive-heuristic-engine',
  };
}
