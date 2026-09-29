import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { GovernmentPolicy, PolicyPriority } from '../types';

const POLICIES_COLLECTION = 'policies';
const READ_POLICIES_KEY = 'govinsight_read_policies_v1';

// Seed initial policies data
export const INITIAL_GOVERNMENT_POLICIES: GovernmentPolicy[] = [
  {
    id: 'policy_gcc_flood_mitigation_2026',
    title: 'GCC Urban Monsoon Drainage & Pre-Flood Desilting Directives 2026',
    summary:
      'Greater Chennai Corporation and CMWSSB issue mandatory desilting protocols across 15 zones in Chennai. Citizens in vulnerable low-lying wards are eligible for emergency sump suction pumps.',
    fullContent:
      'In accordance with Government Order GO-MS-GCC/2026/418, all municipal zonal engineers are mandated to complete storm-water drainage desilting and culvert clearance. Low-lying areas including Velachery, Madipakkam, and T. Nagar will have dedicated round-the-clock suction pumping rigs stationed. Citizens are advised to keep drainage inlet grates unblocked and report any overflow or hazardous open manholes immediately on the GovInsight portal for rapid 2-hour response dispatch.',
    category: 'Water & Drainage',
    department: 'Greater Chennai Corporation (GCC) & Municipal Administration',
    gazetteRef: 'GO-MS-GCC/2026/418',
    scope: 'district',
    affectedCountry: 'India',
    affectedState: 'Tamil Nadu',
    affectedDistrict: 'Chennai',
    affectedAreas: ['Velachery', 'Madipakkam', 'T. Nagar', 'Adyar', 'Saidapet', 'Kolathur'],
    priority: 'URGENT',
    actionRequiredForCitizen:
      'Verify household storm-water drain connection. Avoid dumping solid waste in street gutters. Emergency helpline: 1913.',
    effectiveDate: '2026-09-20',
    publishedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
  },
  {
    id: 'policy_tn_pothole_guarantee_2026',
    title: 'Tamil Nadu Zero-Pothole 48-Hour Municipal Action Guarantee',
    summary:
      'State-wide mandatory SLA requiring urban local bodies and Highways Department to repair dangerous arterial road potholes within 48 hours of AI grievance submission.',
    fullContent:
      'Under the Tamil Nadu Urban Road Safety Guarantee Directive (TN-HW-DIR-2026/102), local bodies must deploy mechanized quick-curing asphalt patch units within 48 hours of an issue verified on GovInsight with AI priority score >= 70. Contractors who fail the repair quality audit within 6 months will face automated penalty deductions from performance deposits.',
    category: 'Roads & Infrastructure',
    department: 'Highways & Minor Ports Department, Govt of Tamil Nadu',
    gazetteRef: 'TN-HW-DIR-2026/102',
    scope: 'state',
    affectedCountry: 'India',
    affectedState: 'Tamil Nadu',
    affectedDistrict: 'All Districts',
    priority: 'HIGH',
    actionRequiredForCitizen:
      'Submit photo or voice report on road craters directly via People Portal. Track 48-hour live countdown in timeline.',
    effectiveDate: '2026-09-15',
    publishedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
  },
  {
    id: 'policy_tangedco_solar_grid_2026',
    title: 'TANGEDCO Green Rooftop Solar & Smart Bi-Directional Meter Scheme',
    summary:
      '60% capital subsidy on residential rooftop solar power installations with automated net-metering grid connection for domestic households.',
    fullContent:
      'Tamil Nadu Generation and Distribution Corporation (TANGEDCO) announces Phase 4 of the Residential Clean Power initiative. Subsidies up to 60% for systems up to 3kW capacity are disbursed directly to accredited solar installers. Net-metering approval is streamlined to 7 working days with zero paperwork fees.',
    category: 'Electricity & Power',
    department: 'Energy Department, Government of Tamil Nadu (TANGEDCO)',
    gazetteRef: 'GO-TANGEDCO-2026/99',
    scope: 'state',
    affectedCountry: 'India',
    affectedState: 'Tamil Nadu',
    affectedDistrict: 'All Districts',
    priority: 'REGULAR',
    actionRequiredForCitizen:
      'Check solar feasibility via electricity consumer number and register through the integrated People Dashboard.',
    effectiveDate: '2026-09-01',
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'policy_cmwssb_potable_testing_2026',
    title: 'CMWSSB Drinking Water Quality Standards & Sensor Auditing Alert',
    summary:
      'Comprehensive testing for chlorine residual and pipeline modernization. Citizens can request doorstep municipal water purity testing.',
    fullContent:
      'Chennai Metropolitan Water Supply and Sewerage Board (CMWSSB) has deployed IoT residual chlorine analyzers across 42 distribution mains. Free water quality testing kits are distributed to community resident welfare associations upon request through GovInsight.',
    category: 'Water & Drainage',
    department: 'Chennai Metro Water (CMWSSB)',
    gazetteRef: 'CMWSSB-QA-2026-72',
    scope: 'district',
    affectedCountry: 'India',
    affectedState: 'Tamil Nadu',
    affectedDistrict: 'Chennai',
    affectedAreas: ['Anna Nagar', 'Mylapore', 'Triplicane', 'Royapettah', 'Kilpauk'],
    priority: 'HIGH',
    actionRequiredForCitizen:
      'If pipeline tap water appears discolored, request free laboratory sample testing via the People Dashboard.',
    effectiveDate: '2026-09-18',
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'policy_national_ev_civic_charging_2026',
    title: 'National Urban Public EV Fast-Charging Infrastructure Mandate',
    summary:
      'Ministry of Power directive mandating reserved EV public fast chargers in all municipal market complexes and district collectorate parking lots.',
    fullContent:
      'Under the National Electric Mobility Mission, all municipal corporations across Category-A cities must install at least 4 Type-2 CCS fast chargers per commercial zone by December 2026.',
    category: 'Infrastructure',
    department: 'Ministry of Power, Government of India',
    gazetteRef: 'MOP-EV-2026/55',
    scope: 'national',
    affectedCountry: 'India',
    affectedState: 'All States',
    priority: 'REGULAR',
    actionRequiredForCitizen: 'Public feedback invited on preferred neighborhood charging hub locations.',
    effectiveDate: '2026-08-15',
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

// Helper: play high-fidelity civic chime
export function playCivicAlertChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Pleasant civic chime frequencies: A5 (880Hz) to E6 (1318Hz)
    const now = ctx.currentTime;
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12);

    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (err) {
    // Audio might be blocked by autoplay policies
    console.warn('Audio chime notice:', err);
  }
}

// Local read tracking
export function getReadPolicyIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_POLICIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markPolicyAsRead(policyId: string): void {
  try {
    const existing = getReadPolicyIds();
    if (!existing.includes(policyId)) {
      existing.push(policyId);
      localStorage.setItem(READ_POLICIES_KEY, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent('govinsight_policy_read_updated', { detail: policyId }));
    }
  } catch (err) {
    console.warn('Failed to save read policy state:', err);
  }
}

export function markAllPoliciesAsRead(policyIds: string[]): void {
  try {
    const existing = new Set([...getReadPolicyIds(), ...policyIds]);
    localStorage.setItem(READ_POLICIES_KEY, JSON.stringify(Array.from(existing)));
    window.dispatchEvent(new CustomEvent('govinsight_policy_read_updated'));
  } catch (err) {
    console.warn('Failed to mark all as read:', err);
  }
}

/**
 * Filter policies matching the user's geographic area
 */
export function isPolicyRelevantToUser(
  policy: GovernmentPolicy,
  userLocation: { country?: string; state?: string; district?: string }
): boolean {
  const userCountry = (userLocation.country || 'India').trim().toLowerCase();
  const userState = (userLocation.state || 'Tamil Nadu').trim().toLowerCase();
  const userDistrict = (userLocation.district || 'Chennai').trim().toLowerCase();

  const polCountry = (policy.affectedCountry || '').toLowerCase();
  const polState = (policy.affectedState || '').toLowerCase();
  const polDistrict = (policy.affectedDistrict || '').toLowerCase();

  // 1. National policies affecting the country
  if (policy.scope === 'national') {
    return polCountry.includes(userCountry) || userCountry.includes(polCountry) || polCountry === 'all';
  }

  // 2. State-wide policies
  if (policy.scope === 'state') {
    const stateMatches =
      polState.includes(userState) ||
      userState.includes(polState) ||
      polState === 'all states' ||
      polState === 'all';
    return stateMatches;
  }

  // 3. District-specific policies
  if (policy.scope === 'district') {
    const districtMatches =
      polDistrict.includes(userDistrict) ||
      userDistrict.includes(polDistrict) ||
      polDistrict === 'all districts' ||
      polDistrict === 'all';

    const stateMatches =
      polState.includes(userState) ||
      userState.includes(polState) ||
      polState === 'all states' ||
      polState === 'all';

    return districtMatches && stateMatches;
  }

  return true;
}

/**
 * Real-time subscription to government policies affecting user's area
 */
export function subscribeToAreaPolicies(
  userLocation: { country?: string; state?: string; district?: string },
  onUpdate: (policies: GovernmentPolicy[], newAlert?: GovernmentPolicy) => void
): () => void {
  let isInitialLoad = true;
  let previousPolicyIds = new Set<string>();

  // Fallback initial in-memory seed
  const fallbackPolicies = INITIAL_GOVERNMENT_POLICIES.filter((p) =>
    isPolicyRelevantToUser(p, userLocation)
  );
  onUpdate(fallbackPolicies);
  fallbackPolicies.forEach((p) => previousPolicyIds.add(p.id));

  try {
    const policiesQuery = query(collection(db, POLICIES_COLLECTION), orderBy('publishedAt', 'desc'), limit(30));

    const unsubscribe = onSnapshot(
      policiesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          // If empty, seed initial policies to Firestore in background
          seedInitialPoliciesToFirestore().catch((err) => {
            console.warn('Policy seeding notice:', err);
          });
          onUpdate(fallbackPolicies);
          isInitialLoad = false;
          return;
        }

        const readIds = getReadPolicyIds();
        const firestoreList: GovernmentPolicy[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as GovernmentPolicy;
          const policy: GovernmentPolicy = {
            ...data,
            id: docSnap.id,
            isRead: readIds.includes(docSnap.id),
          };

          if (isPolicyRelevantToUser(policy, userLocation)) {
            firestoreList.push(policy);
          }
        });

        // Merge with initial fallback if needed
        const combinedMap = new Map<string, GovernmentPolicy>();
        firestoreList.forEach((p) => combinedMap.set(p.id, p));
        fallbackPolicies.forEach((p) => {
          if (!combinedMap.has(p.id)) {
            combinedMap.set(p.id, { ...p, isRead: readIds.includes(p.id) });
          }
        });

        const sorted = Array.from(combinedMap.values()).sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );

        // Check if there is a newly published policy affecting the user's area!
        let newlyArrivedAlert: GovernmentPolicy | undefined;

        if (!isInitialLoad) {
          for (const item of sorted) {
            if (!previousPolicyIds.has(item.id)) {
              newlyArrivedAlert = item;
              break;
            }
          }
        }

        // Update tracking
        sorted.forEach((p) => previousPolicyIds.add(p.id));
        isInitialLoad = false;

        onUpdate(sorted, newlyArrivedAlert);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, POLICIES_COLLECTION);
        onUpdate(fallbackPolicies);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Real-time policy subscription exception:', err);
    return () => {};
  }
}

/**
 * Publish a new Government Policy (Used by Government officials or simulation)
 */
export async function publishGovernmentPolicy(
  policyData: Omit<GovernmentPolicy, 'id' | 'publishedAt'> & { id?: string }
): Promise<GovernmentPolicy> {
  const id = policyData.id || `policy_${Date.now()}`;
  const publishedAt = new Date().toISOString();

  const newPolicy: GovernmentPolicy = {
    ...policyData,
    id,
    publishedAt,
    isRead: false,
  };

  try {
    await setDoc(doc(db, POLICIES_COLLECTION, id), newPolicy);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${POLICIES_COLLECTION}/${id}`);
  }

  // Also dispatch custom DOM event for immediate app-wide UI reaction
  window.dispatchEvent(
    new CustomEvent('govinsight_new_policy_published', { detail: newPolicy })
  );

  return newPolicy;
}

/**
 * Helper to seed initial policies to Firestore if not already present
 */
export async function seedInitialPoliciesToFirestore(): Promise<void> {
  try {
    const snap = await getDocs(collection(db, POLICIES_COLLECTION));
    if (snap.empty) {
      for (const policy of INITIAL_GOVERNMENT_POLICIES) {
        await setDoc(doc(db, POLICIES_COLLECTION, policy.id), policy);
      }
    }
  } catch (err) {
    console.warn('Error during policy seeding:', err);
  }
}

/**
 * Simulate publishing a live breaking policy in the citizen's area for instant demonstration
 */
export async function simulateAreaPolicyAlert(
  userDistrict: string = 'Chennai',
  userState: string = 'Tamil Nadu'
): Promise<GovernmentPolicy> {
  const breakingTitles = [
    {
      title: `${userDistrict} 24-Hour Emergency Drinking Water & Pipeline Cleansing Advisory`,
      category: 'Water & Drainage',
      priority: 'URGENT' as PolicyPriority,
      summary: `GCC and Metro Water initiate ultrasonic cleansing of municipal reservoirs supplying ${userDistrict}. Complimentary tanker water available at all ward centers.`,
      action: 'Boil tap drinking water until 18:00 today. Emergency water supply dispatch: 1913.',
    },
    {
      title: `${userState} Heavy Rain Monsoon Protocol & Smart Pumping Deployment`,
      category: 'Disaster Preparedness',
      priority: 'URGENT' as PolicyPriority,
      summary: `High alert issued for ${userDistrict} and coastal belts. 180 high-capacity submersible de-watering pumps positioned at subway underpasses.`,
      action: 'Avoid parking vehicles in low-lying subways. Report waterlogging on GovInsight for 15-minute response.',
    },
    {
      title: `${userDistrict} Zero-Emission Green Electric Bus & Feeder Transit Expansion`,
      category: 'Infrastructure',
      priority: 'HIGH' as PolicyPriority,
      summary: `35 new electric low-floor smart transit buses launched connecting ${userDistrict} metro corridors with free passenger Wi-Fi.`,
      action: 'Review updated bus schedule and bus-stop charging bays in the public transit map.',
    },
  ];

  const template = breakingTitles[Math.floor(Math.random() * breakingTitles.length)];
  const policyId = `sim_policy_${Date.now()}`;

  const policy: GovernmentPolicy = {
    id: policyId,
    title: template.title,
    summary: template.summary,
    fullContent: `Official notification by the Municipal Administration and District Disaster Management Authority: ${template.summary}. Standard Operating Procedures (SOP) activated under Disaster Management Protocol 2026. Citizens are requested to adhere to civic directives.`,
    category: template.category,
    department: `${userDistrict} District Administration & Municipal Corporation`,
    gazetteRef: `GO-MS-EMERG-${Math.floor(1000 + Math.random() * 9000)}/2026`,
    scope: 'district',
    affectedCountry: 'India',
    affectedState: userState,
    affectedDistrict: userDistrict,
    affectedAreas: [`${userDistrict} Central`, 'Ward 114', 'Ward 120', 'Ward 135'],
    priority: template.priority,
    actionRequiredForCitizen: template.action,
    effectiveDate: new Date().toISOString().split('T')[0],
    publishedAt: new Date().toISOString(),
    isRead: false,
  };

  try {
    await setDoc(doc(db, POLICIES_COLLECTION, policyId), policy);
  } catch (err) {
    console.warn('Simulated policy save notice:', err);
  }

  // Play auditory alert chime
  playCivicAlertChime();

  // Dispatch live event
  window.dispatchEvent(
    new CustomEvent('govinsight_new_policy_published', { detail: policy })
  );

  return policy;
}
