import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Globe,
  Flame,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Building2,
  MapPin,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  TrendingUp,
  Users,
  Compass,
  ChevronRight,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { SupportedLanguage } from '../../types';

export interface RegionalCivicData {
  id: string;
  countryCode: string;
  name: string;
  continent: string;
  flag: string;
  lat: number;
  lng: number;
  activePolicyDiscussions: number;
  governmentServiceRequests: number;
  resolvedRequests: number;
  criticalIssues: number;
  civicHealthScore: number; // 0 - 100
  dominantCategory: string;
  topPolicies: Array<{
    title: string;
    department: string;
    participants: number;
    sentimentPositive: number;
    status: 'Public Debate' | 'Drafting' | 'Enacted' | 'Review';
  }>;
  recentServiceRequests: Array<{
    id: string;
    category: string;
    title: string;
    status: 'Resolved' | 'In Progress' | 'Investigating';
    timeAgo: string;
  }>;
}

// Global dataset across key regions
export const GLOBAL_CIVIC_REGIONS: RegionalCivicData[] = [
  {
    id: 'ind',
    countryCode: 'IN',
    name: 'India',
    continent: 'Asia',
    flag: '🇮🇳',
    lat: 20.5937,
    lng: 78.9629,
    activePolicyDiscussions: 428,
    governmentServiceRequests: 1845,
    resolvedRequests: 1420,
    criticalIssues: 86,
    civicHealthScore: 89,
    dominantCategory: 'Infrastructure & Water Supply',
    topPolicies: [
      {
        title: 'National Digital Public Infrastructure & Grievance SLA Mandate',
        department: 'Ministry of Electronics & IT',
        participants: 18400,
        sentimentPositive: 84,
        status: 'Public Debate',
      },
      {
        title: 'Urban Water Drainage & Monsoon Flood Mitigation Act',
        department: 'Urban Development & Public Works',
        participants: 12900,
        sentimentPositive: 76,
        status: 'Review',
      },
      {
        title: 'Solar Rooftop & Clean Energy Citizen Subsidy Policy',
        department: 'Ministry of New & Renewable Energy',
        participants: 9400,
        sentimentPositive: 91,
        status: 'Drafting',
      },
    ],
    recentServiceRequests: [
      { id: 'IN-4821', category: 'Highways', title: 'Main Highway Sinkhole Repair on NH-45', status: 'Resolved', timeAgo: '8m ago' },
      { id: 'IN-4819', category: 'Water', title: 'Feeder Canal Pump Valve Overhaul', status: 'In Progress', timeAgo: '24m ago' },
      { id: 'IN-4812', category: 'Sanitation', title: 'Biowaste Segregation Plant Clearance', status: 'Resolved', timeAgo: '1h ago' },
    ],
  },
  {
    id: 'usa',
    countryCode: 'US',
    name: 'United States',
    continent: 'North America',
    flag: '🇺🇸',
    lat: 37.0902,
    lng: -95.7129,
    activePolicyDiscussions: 382,
    governmentServiceRequests: 1240,
    resolvedRequests: 980,
    criticalIssues: 42,
    civicHealthScore: 86,
    dominantCategory: 'Public Transit & Environmental Safety',
    topPolicies: [
      {
        title: 'Federal Clean Transit & Municipal EV Grid Expansion',
        department: 'Department of Transportation',
        participants: 14200,
        sentimentPositive: 79,
        status: 'Public Debate',
      },
      {
        title: 'Municipal Open Data Transparency & Police Accountability',
        department: 'Civic Oversight Committee',
        participants: 11800,
        sentimentPositive: 88,
        status: 'Review',
      },
    ],
    recentServiceRequests: [
      { id: 'US-9214', category: 'Transit', title: 'Downtown Light Rail Signaling Glitch', status: 'Resolved', timeAgo: '12m ago' },
      { id: 'US-9201', category: 'Environment', title: 'Industrial Storm Drain Runoff Inspection', status: 'Investigating', timeAgo: '45m ago' },
    ],
  },
  {
    id: 'gbr',
    countryCode: 'GB',
    name: 'United Kingdom',
    continent: 'Europe',
    flag: '🇬🇧',
    lat: 55.3781,
    lng: -3.436,
    activePolicyDiscussions: 215,
    governmentServiceRequests: 890,
    resolvedRequests: 740,
    criticalIssues: 28,
    civicHealthScore: 91,
    dominantCategory: 'Healthcare Access & Housing Standards',
    topPolicies: [
      {
        title: 'NHS Community Outpatient Facility Modernisation Bill',
        department: 'Department of Health & Social Care',
        participants: 16500,
        sentimentPositive: 82,
        status: 'Public Debate',
      },
      {
        title: 'Clean Air Zones & Urban Emissions Citizen Relief',
        department: 'Environment & Climate Council',
        participants: 8700,
        sentimentPositive: 71,
        status: 'Drafting',
      },
    ],
    recentServiceRequests: [
      { id: 'UK-3104', category: 'Health', title: 'Regional Urgent Care Triage Queue Redundancy', status: 'Resolved', timeAgo: '19m ago' },
      { id: 'UK-3098', category: 'Roads', title: 'B-Road Pothole Surface Cold-Fill', status: 'Resolved', timeAgo: '38m ago' },
    ],
  },
  {
    id: 'bra',
    countryCode: 'BR',
    name: 'Brazil',
    continent: 'South America',
    flag: '🇧🇷',
    lat: -14.235,
    lng: -51.9253,
    activePolicyDiscussions: 198,
    governmentServiceRequests: 1120,
    resolvedRequests: 810,
    criticalIssues: 64,
    civicHealthScore: 81,
    dominantCategory: 'Sanitation & Rainforest Preservation',
    topPolicies: [
      {
        title: 'Amazonian Watershed Protection & Indigenous Land Monitoring',
        department: 'Ministry of Environment',
        participants: 21000,
        sentimentPositive: 94,
        status: 'Public Debate',
      },
      {
        title: 'Metropolitan Basic Sanitation & Clean Piped Water Access',
        department: 'National Sanitation Agency',
        participants: 14200,
        sentimentPositive: 87,
        status: 'Review',
      },
    ],
    recentServiceRequests: [
      { id: 'BR-7140', category: 'Sanitation', title: 'Favela Drainage Channel Unblocking', status: 'Resolved', timeAgo: '30m ago' },
      { id: 'BR-7132', category: 'Safety', title: 'Hillside Slope Soil Stabilization Check', status: 'In Progress', timeAgo: '1h ago' },
    ],
  },
  {
    id: 'ken',
    countryCode: 'KE',
    name: 'Kenya',
    continent: 'Africa',
    flag: '🇰🇪',
    lat: -0.0236,
    lng: 37.9062,
    activePolicyDiscussions: 164,
    governmentServiceRequests: 740,
    resolvedRequests: 590,
    criticalIssues: 39,
    civicHealthScore: 84,
    dominantCategory: 'Digital Public Services & Agricultural Water',
    topPolicies: [
      {
        title: 'Universal Citizen Mobile ID & e-Government Land Registry',
        department: 'Ministry of ICT & Innovation',
        participants: 13400,
        sentimentPositive: 89,
        status: 'Enacted',
      },
      {
        title: 'Smallholder Farmer Solar Irrigation Subsidy Framework',
        department: 'Ministry of Agriculture',
        participants: 9800,
        sentimentPositive: 92,
        status: 'Drafting',
      },
    ],
    recentServiceRequests: [
      { id: 'KE-2290', category: 'Agriculture', title: 'Borehole Solar Inverter Replacement', status: 'Resolved', timeAgo: '15m ago' },
      { id: 'KE-2281', category: 'Power', title: 'Sub-County Feeder Transformer Reconnection', status: 'Resolved', timeAgo: '50m ago' },
    ],
  },
  {
    id: 'jpn',
    countryCode: 'JP',
    name: 'Japan',
    continent: 'Asia',
    flag: '🇯🇵',
    lat: 36.2048,
    lng: 138.2529,
    activePolicyDiscussions: 240,
    governmentServiceRequests: 620,
    resolvedRequests: 580,
    criticalIssues: 14,
    civicHealthScore: 95,
    dominantCategory: 'Disaster Preparedness & Elderly Care AI',
    topPolicies: [
      {
        title: 'Autonomous Transit in Depopulated Rural Prefectures',
        department: 'Digital Agency & Ministry of Transport',
        participants: 11200,
        sentimentPositive: 86,
        status: 'Public Debate',
      },
      {
        title: 'Seismic Retrofitting Subsidy for Pre-1981 Structures',
        department: 'Ministry of Land, Infrastructure & Transport',
        participants: 8400,
        sentimentPositive: 95,
        status: 'Review',
      },
    ],
    recentServiceRequests: [
      { id: 'JP-1094', category: 'Safety', title: 'Coastal Tsunami Siren Circuit Diagnostic', status: 'Resolved', timeAgo: '22m ago' },
      { id: 'JP-1088', category: 'Infrastructure', title: 'Overpass Vibration Sensor Calibration', status: 'Resolved', timeAgo: '1h ago' },
    ],
  },
  {
    id: 'deu',
    countryCode: 'DE',
    name: 'Germany',
    continent: 'Europe',
    flag: '🇩🇪',
    lat: 51.1657,
    lng: 10.4515,
    activePolicyDiscussions: 210,
    governmentServiceRequests: 690,
    resolvedRequests: 610,
    criticalIssues: 22,
    civicHealthScore: 92,
    dominantCategory: 'Energy Grid Transition & Digital Bürgeramt',
    topPolicies: [
      {
        title: 'Federal Renewable Energy Sharing & Grid De-Bottlenecking',
        department: 'Federal Ministry for Economic Affairs & Climate Action',
        participants: 15300,
        sentimentPositive: 80,
        status: 'Public Debate',
      },
      {
        title: 'Standardised Digital Identity for Municipal Bürgeramt Services',
        department: 'Federal Ministry of the Interior',
        participants: 12100,
        sentimentPositive: 84,
        status: 'Drafting',
      },
    ],
    recentServiceRequests: [
      { id: 'DE-5520', category: 'Energy', title: 'Substation Relay Maintenance Alert', status: 'Resolved', timeAgo: '35m ago' },
      { id: 'DE-5511', category: 'Transit', title: 'Bike Superhighway Barrier Repair', status: 'Resolved', timeAgo: '1h 10m ago' },
    ],
  },
  {
    id: 'aus',
    countryCode: 'AU',
    name: 'Australia',
    continent: 'Oceania',
    flag: '🇦🇺',
    lat: -25.2744,
    lng: 133.7751,
    activePolicyDiscussions: 185,
    governmentServiceRequests: 540,
    resolvedRequests: 470,
    criticalIssues: 19,
    civicHealthScore: 90,
    dominantCategory: 'Bushfire Resilience & Clean Water Distribution',
    topPolicies: [
      {
        title: 'National Bushfire Early Warning & Drone Detection Matrix',
        department: 'National Emergency Management Agency',
        participants: 12400,
        sentimentPositive: 93,
        status: 'Review',
      },
      {
        title: 'Murray-Darling Basin Sustainable Water Allocation Plan',
        department: 'Department of Climate Change, Energy, the Environment & Water',
        participants: 9100,
        sentimentPositive: 74,
        status: 'Public Debate',
      },
    ],
    recentServiceRequests: [
      { id: 'AU-8021', category: 'Emergency', title: 'Rural Fire Hydrant Pressure Verification', status: 'Resolved', timeAgo: '40m ago' },
      { id: 'AU-8015', category: 'Roads', title: 'Outback Highway Flood Culvert Clearing', status: 'Resolved', timeAgo: '2h ago' },
    ],
  },
  {
    id: 'can',
    countryCode: 'CA',
    name: 'Canada',
    continent: 'North America',
    flag: '🇨🇦',
    lat: 56.1304,
    lng: -106.3468,
    activePolicyDiscussions: 172,
    governmentServiceRequests: 580,
    resolvedRequests: 510,
    criticalIssues: 16,
    civicHealthScore: 92,
    dominantCategory: 'Northern Community Infrastructure & Affordable Housing',
    topPolicies: [
      {
        title: 'Arctic Clean Energy & High-Speed Broadband Connectivity Program',
        department: 'Crown-Indigenous Relations & Northern Affairs',
        participants: 8200,
        sentimentPositive: 88,
        status: 'Drafting',
      },
      {
        title: 'Municipal Housing Density & Rapid Permitting Accord',
        department: 'Infrastructure Canada',
        participants: 14600,
        sentimentPositive: 77,
        status: 'Public Debate',
      },
    ],
    recentServiceRequests: [
      { id: 'CA-4412', category: 'Highways', title: 'Trans-Canada Ice Melt Spray Resupply', status: 'Resolved', timeAgo: '55m ago' },
      { id: 'CA-4405', category: 'Water', title: 'Winter Water Main Insulation Replacement', status: 'In Progress', timeAgo: '2h ago' },
    ],
  },
  {
    id: 'zaf',
    countryCode: 'ZA',
    name: 'South Africa',
    continent: 'Africa',
    flag: '🇿🇦',
    lat: -30.5595,
    lng: 22.9375,
    activePolicyDiscussions: 154,
    governmentServiceRequests: 860,
    resolvedRequests: 620,
    criticalIssues: 51,
    civicHealthScore: 78,
    dominantCategory: 'Electricity Grid Stability & Municipal Water Security',
    topPolicies: [
      {
        title: 'Municipal Microgrid Integration & Load-Reduction Bylaw',
        department: 'Department of Mineral Resources & Energy',
        participants: 17800,
        sentimentPositive: 85,
        status: 'Public Debate',
      },
      {
        title: 'Township Infrastructure Revitalization & Pipe Relining Plan',
        department: 'Department of Water & Sanitation',
        participants: 11200,
        sentimentPositive: 81,
        status: 'Drafting',
      },
    ],
    recentServiceRequests: [
      { id: 'ZA-6201', category: 'Power', title: 'Suburban Distribution Transformer Repair', status: 'Resolved', timeAgo: '28m ago' },
      { id: 'ZA-6192', category: 'Water', title: 'Bulk Water Supply Valve Replacement', status: 'In Progress', timeAgo: '1h 30m ago' },
    ],
  },
];

interface Props {
  currentLanguage: SupportedLanguage;
  onSelectCountry?: (countryCode: string) => void;
  className?: string;
}

export const GlobalCivicActivityHeatMap: React.FC<Props> = ({
  currentLanguage,
  onSelectCountry,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [selectedCountry, setSelectedCountry] = useState<RegionalCivicData | null>(
    GLOBAL_CIVIC_REGIONS[0] // Default India
  );
  const [activeLayer, setActiveLayer] = useState<'all' | 'discussions' | 'requests' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pulseLive, setPulseLive] = useState(true);
  const [liveTickerIndex, setLiveTickerIndex] = useState(0);

  // Maps Grounding state
  const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
  const [groundedPlaces, setGroundedPlaces] = useState<Array<{ title?: string; uri?: string }>>([]);
  const [groundingSummary, setGroundingSummary] = useState<string>('');

  // Live ticker cycling
  useEffect(() => {
    if (!pulseLive) return;
    const interval = setInterval(() => {
      setLiveTickerIndex((prev) => (prev + 1) % GLOBAL_CIVIC_REGIONS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [pulseLive]);

  // Aggregate totals
  const totalStats = useMemo(() => {
    return GLOBAL_CIVIC_REGIONS.reduce(
      (acc, r) => ({
        discussions: acc.discussions + r.activePolicyDiscussions,
        requests: acc.requests + r.governmentServiceRequests,
        resolved: acc.resolved + r.resolvedRequests,
        critical: acc.critical + r.criticalIssues,
      }),
      { discussions: 0, requests: 0, resolved: 0, critical: 0 }
    );
  }, []);

  // Filtered regions
  const filteredRegions = useMemo(() => {
    return GLOBAL_CIVIC_REGIONS.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.continent.toLowerCase().includes(q) ||
          r.dominantCategory.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery]);

  // Google Maps Grounding fetcher for selected country
  const fetchMapsGroundingForCountry = async (country: RegionalCivicData) => {
    setIsFetchingPlaces(true);
    setGroundedPlaces([]);
    setGroundingSummary('');
    try {
      const res = await fetch('/api/civic/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: country.name,
          country: country.name,
          latitude: country.lat,
          longitude: country.lng,
          query: `Identify the main national civic grievance centers, municipal headquarters, and public ombudsman offices in ${country.name}.`,
        }),
      });
      const data = await res.json();
      if (data.places && data.places.length > 0) {
        setGroundedPlaces(data.places);
      }
      if (data.text) {
        setGroundingSummary(data.text);
      }
    } catch (e) {
      console.warn('Maps grounding fetch notice:', e);
    } finally {
      setIsFetchingPlaces(false);
    }
  };

  // Trigger maps grounding when country is selected
  useEffect(() => {
    if (selectedCountry) {
      fetchMapsGroundingForCountry(selectedCountry);
    }
  }, [selectedCountry?.id]);

  // D3 Map Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .style('cursor', 'grab');

    // Create defs for gradients and glow filters
    const defs = svg.append('defs');

    // Filter: Glow effect
    const filter = defs.append('filter').attr('id', 'civic-glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Heat gradient for circles
    const heatGradient = defs
      .append('radialGradient')
      .attr('id', 'heat-radial')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    heatGradient.append('stop').attr('offset', '0%').attr('stop-color', '#EF4444').attr('stop-opacity', '0.9');
    heatGradient.append('stop').attr('offset', '60%').attr('stop-color', '#F59E0B').attr('stop-opacity', '0.5');
    heatGradient.append('stop').attr('offset', '100%').attr('stop-color', '#EF4444').attr('stop-opacity', '0');

    // Policy gradient
    const policyGradient = defs
      .append('radialGradient')
      .attr('id', 'policy-radial')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    policyGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3B82F6').attr('stop-opacity', '0.9');
    policyGradient.append('stop').attr('offset', '60%').attr('stop-color', '#8B5CF6').attr('stop-opacity', '0.5');
    policyGradient.append('stop').attr('offset', '100%').attr('stop-color', '#3B82F6').attr('stop-opacity', '0');

    // D3 Projection: Natural Earth projection
    const projection = d3
      .geoNaturalEarth1()
      .scale(width / 5.6)
      .translate([width / 2, height / 1.85]);

    const pathGenerator = d3.geoPath().projection(projection);

    // Zoom container
    const g = svg.append('g').attr('class', 'map-content');

    // Setup D3 Zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Draw Graticule (lat/lng grid lines)
    const graticule = d3.geoGraticule()();
    g.append('path')
      .datum(graticule)
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#ffffff')
      .attr('stroke-opacity', 0.04)
      .attr('stroke-width', 0.6);

    // Draw stylized background world outline / continents using sphere
    g.append('path')
      .datum({ type: 'Sphere' } as any)
      .attr('d', pathGenerator)
      .attr('fill', '#090B10')
      .attr('stroke', '#1E293B')
      .attr('stroke-width', 1);

    // Approximate continent shapes with graceful polygons
    const continentPaths: Array<{ name: string; coordinates: [number, number][] }> = [
      // North America approx
      {
        name: 'North America',
        coordinates: [
          [-168, 68], [-140, 70], [-100, 75], [-60, 60], [-55, 48], [-70, 42],
          [-80, 25], [-90, 16], [-105, 20], [-120, 34], [-125, 48], [-140, 58], [-168, 68],
        ],
      },
      // South America approx
      {
        name: 'South America',
        coordinates: [
          [-80, 10], [-50, -5], [-35, -7], [-40, -22], [-50, -35], [-70, -55],
          [-75, -45], [-72, -20], [-80, 0], [-80, 10],
        ],
      },
      // Europe approx
      {
        name: 'Europe',
        coordinates: [
          [-10, 36], [0, 43], [10, 46], [20, 40], [30, 42], [40, 55], [30, 65],
          [10, 60], [-5, 55], [-10, 45], [-10, 36],
        ],
      },
      // Africa approx
      {
        name: 'Africa',
        coordinates: [
          [-15, 30], [10, 36], [32, 32], [50, 12], [42, -5], [32, -28], [20, -35],
          [15, -20], [8, 5], [-15, 12], [-15, 30],
        ],
      },
      // Asia approx
      {
        name: 'Asia',
        coordinates: [
          [40, 40], [60, 45], [90, 50], [130, 50], [140, 35], [120, 25], [105, 10],
          [80, 10], [70, 25], [50, 25], [40, 40],
        ],
      },
      // Australia approx
      {
        name: 'Australia',
        coordinates: [
          [115, -22], [130, -12], [145, -15], [153, -28], [148, -38], [130, -35],
          [115, -34], [115, -22],
        ],
      },
    ];

    // Render land silhouettes
    continentPaths.forEach((cont) => {
      const geoFeature: any = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [cont.coordinates],
        },
      };
      g.append('path')
        .datum(geoFeature)
        .attr('d', pathGenerator)
        .attr('fill', '#111624')
        .attr('stroke', '#1E293B')
        .attr('stroke-width', 1.2)
        .attr('stroke-opacity', 0.7);
    });

    // Color and radius scale for activity
    const activityScale = d3
      .scaleSqrt()
      .domain([0, d3.max(GLOBAL_CIVIC_REGIONS, (d) => d.governmentServiceRequests + d.activePolicyDiscussions) || 2000])
      .range([16, 42]);

    // Draw Heat & Activity Nodes
    filteredRegions.forEach((region) => {
      const coords = projection([region.lng, region.lat]);
      if (!coords) return;
      const [cx, cy] = coords;

      const isSelected = selectedCountry?.id === region.id;
      const totalVolume = region.governmentServiceRequests + region.activePolicyDiscussions;
      const baseRadius = activityScale(totalVolume);

      // Node Group
      const nodeGroup = g
        .append('g')
        .attr('class', `region-node region-${region.id}`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedCountry(region);
          if (onSelectCountry) onSelectCountry(region.countryCode);

          // Smooth D3 animated zoom to the selected region
          svg
            .transition()
            .duration(850)
            .call(
              zoomBehavior.transform as any,
              d3.zoomIdentity.translate(width / 2 - cx * 1.6, height / 2 - cy * 1.6).scale(1.6)
            );
        });

      // 1. Outer Pulse Ring (Animated in CSS/JS)
      if (pulseLive) {
        nodeGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', baseRadius * 1.4)
          .attr('fill', activeLayer === 'discussions' ? '#3B82F6' : '#EF4444')
          .attr('fill-opacity', 0.15)
          .attr('stroke', activeLayer === 'discussions' ? '#60A5FA' : '#F87171')
          .attr('stroke-width', 1.2)
          .attr('stroke-opacity', 0.4)
          .attr('stroke-dasharray', '3,3');
      }

      // 2. Heat Aura Radial Circle
      nodeGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', baseRadius)
        .attr('fill', activeLayer === 'discussions' ? 'url(#policy-radial)' : 'url(#heat-radial)')
        .attr('opacity', isSelected ? 0.95 : 0.7);

      // 3. Central Core Marker
      nodeGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', isSelected ? 10 : 8)
        .attr('fill', isSelected ? '#FFFFFF' : activeLayer === 'discussions' ? '#60A5FA' : '#EF4444')
        .attr('stroke', '#0F172A')
        .attr('stroke-width', 2.5)
        .style('filter', 'url(#civic-glow)');

      // 4. Country Label & Live Count Badge
      const labelGroup = nodeGroup.append('g').attr('transform', `translate(${cx}, ${cy - baseRadius - 8})`);

      labelGroup
        .append('rect')
        .attr('x', -46)
        .attr('y', -12)
        .attr('width', 92)
        .attr('height', 20)
        .attr('rx', 6)
        .attr('fill', isSelected ? '#DC2626' : '#0B0F19')
        .attr('stroke', isSelected ? '#F87171' : '#334155')
        .attr('stroke-width', 1)
        .attr('opacity', 0.92);

      labelGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 2)
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', '#FFFFFF')
        .text(`${region.flag} ${region.name}`);

      // Activity indicator number under marker
      nodeGroup
        .append('text')
        .attr('x', cx)
        .attr('y', cy + baseRadius + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#94A3B8')
        .text(
          activeLayer === 'discussions'
            ? `${region.activePolicyDiscussions} debates`
            : activeLayer === 'requests'
            ? `${region.governmentServiceRequests} requests`
            : `${totalVolume} events`
        );
    });
  }, [filteredRegions, selectedCountry, activeLayer, pulseLive]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Active Policy Debates</span>
            <span className="text-xl font-black text-white">{totalStats.discussions.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Service Requests Logged</span>
            <span className="text-xl font-black text-white">{totalStats.requests.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Verified Resolved</span>
            <span className="text-xl font-black text-emerald-400">{totalStats.resolved.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Critical Urgent Hotspots</span>
            <span className="text-xl font-black text-amber-400">{totalStats.critical}</span>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME MAP CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-[#06080F] via-[#090D17] to-[#04060A] shadow-2xl">
        {/* Map Header Toolbar */}
        <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white tracking-wide">
                  Real-Time Global Civic Activity Heat Map
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950 text-red-300 border border-red-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  <span>D3.js Live</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Visualizing active policy discussions & government service requests across continents. Click any country to drill down.
              </p>
            </div>
          </div>

          {/* Layer and Mode Filters */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveLayer('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeLayer === 'all' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Civic Pulse
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer('discussions')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeLayer === 'discussions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Policy Debates
              </button>
              <button
                type="button"
                onClick={() => setActiveLayer('requests')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  activeLayer === 'requests' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Service Requests
              </button>
            </div>

            {/* Live Pulse Toggle */}
            <button
              type="button"
              onClick={() => setPulseLive(!pulseLive)}
              className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${
                pulseLive
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-black/60 border-white/10 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${pulseLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>{pulseLive ? 'Live Stream On' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* Live Incoming Civic Ticker */}
        {pulseLive && GLOBAL_CIVIC_REGIONS[liveTickerIndex] && (
          <div className="px-4 py-2 bg-gradient-to-r from-red-950/60 via-slate-900/80 to-blue-950/60 border-b border-white/10 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-mono text-[10px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/30">
                LIVE FEED
              </span>
              <span className="text-white font-semibold">
                {GLOBAL_CIVIC_REGIONS[liveTickerIndex].flag} {GLOBAL_CIVIC_REGIONS[liveTickerIndex].name}:
              </span>
              <span className="text-slate-300 truncate">
                "{GLOBAL_CIVIC_REGIONS[liveTickerIndex].recentServiceRequests[0]?.title || 'Grievance cleared and inspected'}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCountry(GLOBAL_CIVIC_REGIONS[liveTickerIndex])}
              className="text-[11px] font-bold text-red-400 hover:text-red-300 shrink-0 flex items-center gap-0.5"
            >
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* D3 SVG Canvas Area */}
        <div ref={containerRef} className="relative w-full h-[480px]">
          <svg ref={svgRef} className="w-full h-full select-none" />

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-xs shadow-xl space-y-2 pointer-events-auto">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Heat Intensity</span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-600" />
              <span className="text-[10px] text-slate-300 font-mono">High Activity</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Policy Debate
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Service Request
              </span>
            </div>
          </div>

          {/* Quick Country Selector Pills */}
          <div className="absolute top-4 right-4 max-w-xs flex flex-wrap justify-end gap-1.5 pointer-events-auto">
            {GLOBAL_CIVIC_REGIONS.slice(0, 6).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCountry(c)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 ${
                  selectedCountry?.id === c.id
                    ? 'bg-red-600 text-white shadow-lg border border-red-400'
                    : 'bg-slate-950/80 text-slate-300 hover:text-white border border-white/10 hover:border-white/30'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. COUNTRY-SPECIFIC INSIGHT DRILL-DOWN PANEL */}
      {selectedCountry && (
        <div className="rounded-3xl border-2 border-red-500/30 bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedCountry.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{selectedCountry.name}</h3>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-white/10 text-slate-300">
                    {selectedCountry.continent}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    Civic Health: {selectedCountry.civicHealthScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dominant Civic Focus: <span className="text-white font-medium">{selectedCountry.dominantCategory}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onSelectCountry) onSelectCountry(selectedCountry.countryCode);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow transition-colors flex items-center gap-1.5"
              >
                <span>Select for Reporting</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metrics Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
              <span className="text-xs text-slate-400 block mb-1">Active Policy Debates</span>
              <span className="text-2xl font-black text-blue-400">{selectedCountry.activePolicyDiscussions}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">In citizen consultation</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
              <span className="text-xs text-slate-400 block mb-1">Service Requests</span>
              <span className="text-2xl font-black text-amber-400">{selectedCountry.governmentServiceRequests}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Public grievances submitted</span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
              <span className="text-xs text-slate-400 block mb-1">Resolution Rate</span>
              <span className="text-2xl font-black text-emerald-400">
                {Math.round((selectedCountry.resolvedRequests / selectedCountry.governmentServiceRequests) * 100)}%
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {selectedCountry.resolvedRequests} verified resolved
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10">
              <span className="text-xs text-slate-400 block mb-1">Critical Urgency Cases</span>
              <span className="text-2xl font-black text-red-400">{selectedCountry.criticalIssues}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Assigned to rapid responders</span>
            </div>
          </div>

          {/* Drill-down Two Column Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Active Policy Discussions */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Key Policy Consultations & Discussions</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">Live Forums</span>
              </div>

              <div className="space-y-2.5">
                {selectedCountry.topPolicies.map((pol, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-white text-xs leading-snug">{pol.title}</h5>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-600/30 whitespace-nowrap">
                        {pol.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{pol.department}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/5">
                      <span>👥 {pol.participants.toLocaleString()} citizens active</span>
                      <span className="text-emerald-400 font-semibold">{pol.sentimentPositive}% positive feedback</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Real-time Service Requests & Grounding */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  <span>Recent Government Service Requests</span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">Real-time Stream</span>
              </div>

              <div className="space-y-2">
                {selectedCountry.recentServiceRequests.map((req) => (
                  <div key={req.id} className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{req.id}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white/10 text-white">
                          {req.category}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{req.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'Resolved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{req.timeAgo}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Google Maps Grounded Civic Offices */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>Official Civic Centers (Google Maps Grounded)</span>
                  </span>
                  {isFetchingPlaces && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Grounding...
                    </span>
                  )}
                </div>

                {groundingSummary && (
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-black/40 p-2.5 rounded-xl border border-white/5">
                    {groundingSummary}
                  </p>
                )}

                {groundedPlaces.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {groundedPlaces.map((pl, idx) => (
                      <a
                        key={idx}
                        href={pl.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <Building2 className="w-3 h-3 text-red-400" />
                        <span>{pl.title || 'Municipal Center'}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
