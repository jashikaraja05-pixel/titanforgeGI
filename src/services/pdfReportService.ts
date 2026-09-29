import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GovernmentPolicy, PolicyCitizenImpact, CitizenInterestsProfile } from '../types';

export interface SectorMetric {
  name: string;
  count: number;
  voice: string;
  rating: string;
  priority: string;
}

export interface EngagementReportData {
  totalInteractions: number;
  totalVoice: number;
  totalReports: number;
  totalFeedback: number;
  peakHour: string;
  peakDay: string;
  voicePercentage: number;
  momentum: string;
  selectedSector: string;
  viewMode: string;
  metricFilter: string;
  region?: string;
  sectors?: SectorMetric[];
}

export interface PolicyImpactReportData {
  policies: GovernmentPolicy[];
  impactMap: Record<string, PolicyCitizenImpact>;
  district: string;
  state: string;
  country?: string;
  citizenInterests?: CitizenInterestsProfile;
  filterApplied?: string;
  searchQuery?: string;
  userName?: string;
}

/**
 * Generates and downloads a comprehensive Civic Engagement PDF Report
 */
export async function exportEngagementReportPDF(
  data: EngagementReportData,
  chartElement?: HTMLElement | null
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // --- HEADER BANNER ---
  doc.setFillColor(15, 18, 25); // Dark Slate / Obsidian
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Crimson accent strip
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 30, pageWidth, 2, 'F');

  // Title & Branding
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('GOVINSIGHT', margin, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(248, 113, 113); // Light Red
  doc.text('GLOBAL CIVIC INTELLIGENCE & GOVERNMENT ACTION PLATFORM', margin, 21);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate 400
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  doc.text(`Generated: ${reportDate} ${reportTime}`, pageWidth - margin, 15, { align: 'right' });
  doc.text(`Doc ID: REP-ENG-${Date.now().toString().slice(-6)}`, pageWidth - margin, 21, { align: 'right' });

  currentY = 40;

  // --- REPORT TITLE & METADATA ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('Citizen Engagement & Temporal Participation Report', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate 500
  const regionText = data.region || 'Tamil Nadu & Regional Urban Districts, India';
  doc.text(`Jurisdiction: ${regionText}  |  Period: Active Portal Live  |  Sector Scope: ${data.selectedSector}`, margin, currentY);

  currentY += 8;

  // --- KEY PERFORMANCE INDICATOR (KPI) METRICS GRID ---
  const boxWidth = (contentWidth - 9) / 4;
  const boxHeight = 18;

  const kpis = [
    { label: 'TOTAL ACTIONS', value: data.totalInteractions.toLocaleString(), sub: `${data.momentum} activity rate` },
    { label: 'PEAK CIVIC WINDOW', value: data.peakHour.split(' ')[0] || '09:00 AM', sub: 'Commute / active window' },
    { label: 'TOP ENGAGEMENT DAY', value: data.peakDay, sub: 'Highest reporting' },
    { label: 'VOICE AI ADOPTION', value: `${data.voicePercentage}%`, sub: `${data.totalVoice} audio submissions` },
  ];

  kpis.forEach((kpi, index) => {
    const x = margin + index * (boxWidth + 3);
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

    // Accent top edge
    doc.setFillColor(index === 0 ? 220 : index === 1 ? 217 : index === 2 ? 37 : 16, index === 0 ? 38 : index === 1 ? 119 : index === 2 ? 99 : 185, index === 0 ? 38 : index === 1 ? 6 : index === 2 ? 235 : 129);
    doc.rect(x, currentY, boxWidth, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, currentY + 4.5);

    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 3, currentY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3, currentY + 15.5);
  });

  currentY += boxHeight + 8;

  // --- CAPTURED D3 HEATMAP CHART (IF ELEMENT PROVIDED) ---
  if (chartElement) {
    try {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('1. D3 Temporal Engagement Heatmap (Past 30-Day Distribution)', margin, currentY);

      currentY += 4;

      const canvas = await html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#090b10',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxImgHeight = 65; // keep within page 1 bounds

      const renderedHeight = Math.min(imgHeight, maxImgHeight);

      doc.setFillColor(9, 11, 16);
      doc.roundedRect(margin, currentY, imgWidth, renderedHeight, 2, 2, 'F');
      doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, renderedHeight, undefined, 'FAST');

      currentY += renderedHeight + 8;
    } catch (err) {
      console.warn('Could not capture chart as image, continuing with tabular data:', err);
    }
  }

  // --- SECTOR PARTICIPATION BREAKDOWN TABLE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('2. Civic Sector Participation & Verification Summary', margin, currentY);

  currentY += 4;

  // Table header
  const thY = currentY;
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.rect(margin, thY, contentWidth, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CIVIC SECTOR', margin + 3, thY + 4.2);
  doc.text('TOTAL ACTIONS', margin + 65, thY + 4.2);
  doc.text('VOICE AUDIO %', margin + 95, thY + 4.2);
  doc.text('COMMUNITY VERIFICATION', margin + 125, thY + 4.2);
  doc.text('PRIORITY LEVEL', pageWidth - margin - 3, thY + 4.2, { align: 'right' });

  currentY += 6;

  const sectorData: SectorMetric[] = data.sectors && data.sectors.length > 0 ? data.sectors : [
    { name: 'Roads & Infrastructure', count: Math.max(1, Math.round(data.totalReports * 0.38)), voice: `${Math.round(data.voicePercentage * 1.1)}%`, rating: 'Verified', priority: 'CRITICAL' },
    { name: 'Water Supply & Sewerage', count: Math.max(1, Math.round(data.totalReports * 0.26)), voice: `${Math.round(data.voicePercentage * 0.95)}%`, rating: 'Verified', priority: 'HIGH' },
    { name: 'Sanitation & Solid Waste', count: Math.max(1, Math.round(data.totalReports * 0.17)), voice: `${Math.round(data.voicePercentage * 0.9)}%`, rating: 'Active', priority: 'MEDIUM' },
    { name: 'Electricity & Power Grid', count: Math.max(1, Math.round(data.totalReports * 0.11)), voice: `${Math.round(data.voicePercentage * 0.85)}%`, rating: 'Verified', priority: 'HIGH' },
    { name: 'Public Health & Clinics', count: Math.max(1, Math.round(data.totalReports * 0.08)), voice: `${Math.round(data.voicePercentage * 1.05)}%`, rating: 'Active', priority: 'MEDIUM' },
  ];

  sectorData.forEach((row, i) => {
    const rowY = currentY;
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, rowY, contentWidth, 5.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(row.name, margin + 3, rowY + 3.8);

    doc.setFont('helvetica', 'bold');
    doc.text(row.count.toString(), margin + 65, rowY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(row.voice, margin + 95, rowY + 3.8);

    doc.setTextColor(217, 119, 6); // Amber
    doc.text(row.rating, margin + 125, rowY + 3.8);

    // Priority tag
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(row.priority === 'CRITICAL' ? 220 : row.priority === 'HIGH' ? 234 : 79, row.priority === 'CRITICAL' ? 38 : row.priority === 'HIGH' ? 88 : 70, row.priority === 'CRITICAL' ? 38 : row.priority === 'HIGH' ? 12 : 229);
    doc.text(row.priority, pageWidth - margin - 3, rowY + 3.8, { align: 'right' });

    currentY += 5.5;
  });

  currentY += 6;

  // --- TEMPORAL POLICY INSIGHTS & RECOMMENDATIONS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('3. Key Civic Insights & Offline Action Directives', margin, currentY);

  currentY += 4;

  const insights = [
    {
      title: 'Peak Morning Surge Alignment (08:00 AM - 11:30 AM):',
      desc: 'Traffic and potholes are reported immediately by citizens in the morning commute. Dispatching maintenance teams promptly reduces bottleneck complaints significantly.',
    },
    {
      title: 'Multilingual Voice AI Accessibility:',
      desc: `${data.voicePercentage}% of community members use voice notes in Tamil and vernacular dialects, eliminating the literacy barrier for municipal grievance filings.`,
    },
    {
      title: 'Real-Time Resolution Feedback Loop:',
      desc: 'Citizen verification ratings remain consistently high when photographic proof of repair is attached upon case closure in the government portal.',
    },
  ];

  insights.forEach((item) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${item.title}`, margin + 2, currentY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    const fullText = `  ${item.desc}`;
    const splitLines = doc.splitTextToSize(fullText, contentWidth - 4);
    doc.text(splitLines, margin + 2, currentY + 7);

    currentY += 6 + splitLines.length * 3.5;
  });

  // --- FOOTER & PRIVACY NOTICE ---
  const footerY = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('GOVINSIGHT Civic Platform • Privacy-Preserving Aggregate Analytics (Zero Citizen PII Exposed)', margin, footerY + 2);
  doc.text('Page 1 of 1 • Official Export', pageWidth - margin, footerY + 2, { align: 'right' });

  // Download PDF file
  const fileName = `GovInsight_Citizen_Engagement_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Compiles the current policy summaries and their corresponding impact scores
 * into a formatted PDF document for offline reading.
 */
export async function exportPolicyImpactReportPDF(data: PolicyImpactReportData): Promise<void> {
  const {
    policies,
    impactMap,
    district,
    state,
    country = 'India',
    citizenInterests,
    filterApplied = 'All Policies',
    searchQuery,
  } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  const drawPageHeader = (pageNumber: number) => {
    // Top banner for every page
    doc.setFillColor(15, 18, 25); // Dark Obsidian
    doc.rect(0, 0, pageWidth, pageNumber === 1 ? 32 : 16, 'F');

    // Crimson accent strip
    doc.setFillColor(220, 38, 38);
    doc.rect(0, pageNumber === 1 ? 30 : 15, pageWidth, pageNumber === 1 ? 2 : 1, 'F');

    if (pageNumber === 1) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(17);
      doc.text('GOVINSIGHT', margin, 14);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(248, 113, 113); // Light Red
      doc.text('OFFICIAL CITIZEN BRIEFING • PREDICTIVE POLICY IMPACT & CIVIC INTELLIGENCE', margin, 20);

      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      doc.text('FORMATTED FOR OFFLINE CITIZEN READING & REFERENCE', margin, 26);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const reportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      doc.text(`Generated: ${reportDate} ${reportTime}`, pageWidth - margin, 14, { align: 'right' });
      doc.text(`Doc ID: DOC-POL-${Date.now().toString().slice(-6)}`, pageWidth - margin, 20, { align: 'right' });
      doc.text(`Jurisdiction: ${district}, ${state}`, pageWidth - margin, 26, { align: 'right' });
    } else {
      // Running compact header on subsequent pages
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('GOVINSIGHT • Government Policy Summaries & Predictive Impact Scores', margin, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Jurisdiction: ${district}, ${state} • Offline Citizen Dossier`, pageWidth - margin, 10, { align: 'right' });
    }
  };

  // Helper to ensure enough vertical space before rendering an item
  const ensureSpace = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - 20) {
      doc.addPage();
      const currentPage = doc.getNumberOfPages();
      drawPageHeader(currentPage);
      currentY = 22;
    }
  };

  // --- RENDER PAGE 1 HEADER ---
  drawPageHeader(1);
  currentY = 38;

  // --- REPORT TITLE & CONTEXT CARD ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Government Policy Summaries & Citizen Impact Dossier', margin, currentY);

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate 600

  const topicsList = citizenInterests?.topics && citizenInterests.topics.length > 0
    ? citizenInterests.topics.join(', ')
    : 'Infrastructure, Water & Drainage, Electricity, Healthcare, Civic Amenities';

  doc.text(`Active Scope: ${district}, ${state}, ${country}  |  Filter: ${filterApplied}${searchQuery ? `  |  Search: "${searchQuery}"` : ''}`, margin, currentY);

  currentY += 4.5;
  doc.text(`Calibrated Stated Interests: ${topicsList}`, margin, currentY);

  currentY += 7;

  // --- METRIC SUMMARY TILES ---
  const highImpactCount = policies.filter((p) => impactMap[p.id]?.potentialImpactScore === 'High').length;
  const mediumImpactCount = policies.filter((p) => impactMap[p.id]?.potentialImpactScore === 'Medium').length;
  const lowImpactCount = policies.filter((p) => !impactMap[p.id] || impactMap[p.id]?.potentialImpactScore === 'Low').length;
  const urgentCount = policies.filter((p) => p.priority === 'URGENT').length;

  const tileWidth = (contentWidth - 9) / 4;
  const tileHeight = 16;

  const summaryTiles = [
    { label: 'POLICIES ASSESSED', value: policies.length.toString(), sub: 'In current district scope', color: [15, 23, 42] },
    { label: 'HIGH IMPACT SCORES', value: highImpactCount.toString(), sub: 'Alters daily costs/routine', color: [220, 38, 38] },
    { label: 'MEDIUM IMPACT SCORES', value: mediumImpactCount.toString(), sub: 'Neighborhood benefits', color: [217, 119, 6] },
    { label: 'URGENT DIRECTIVES', value: urgentCount.toString(), sub: 'Immediate citizen action', color: [185, 28, 28] },
  ];

  summaryTiles.forEach((tile, index) => {
    const x = margin + index * (tileWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, currentY, tileWidth, tileHeight, 1.5, 1.5, 'FD');

    // Accent line
    doc.setFillColor(tile.color[0], tile.color[1], tile.color[2]);
    doc.rect(x, currentY, tileWidth, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(tile.label, x + 3, currentY + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(tile.color[0], tile.color[1], tile.color[2]);
    doc.text(tile.value, x + 3, currentY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(tile.sub, x + 3, currentY + 14);
  });

  currentY += tileHeight + 8;

  // --- POLICIES LISTING WITH DETAILED IMPACT SCORES ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Compiled Policies & Predictive Citizen Impact Analysis', margin, currentY);

  currentY += 5;

  if (policies.length === 0) {
    ensureSpace(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No policies found matching the selected filters.', margin, currentY + 6);
    currentY += 15;
  }

  policies.forEach((policy, idx) => {
    const impact = impactMap[policy.id];
    const impactScore = impact?.numericScore ?? 50;
    const impactLevel = impact?.potentialImpactScore || (policy.priority === 'URGENT' ? 'High' : 'Medium');

    // Estimate height needed for this policy entry
    const titleLines = doc.splitTextToSize(`${idx + 1}. ${policy.title}`, contentWidth - 45);
    const summaryLines = doc.splitTextToSize(policy.summary, contentWidth - 8);
    const impactOverviewLines = impact?.impactSummary ? doc.splitTextToSize(impact.impactSummary, contentWidth - 12) : [];
    const benefits = impact?.keyBenefits?.slice(0, 3) || [];
    const actionSteps = impact?.actionSteps?.slice(0, 2) || [];

    const estimatedItemHeight =
      12 +
      titleLines.length * 4.5 +
      summaryLines.length * 3.8 +
      (impact ? 10 + impactOverviewLines.length * 3.5 + benefits.length * 3.5 + actionSteps.length * 3.5 : 0) +
      10;

    ensureSpace(Math.min(estimatedItemHeight, 75));

    // Entry Container Box
    const startY = currentY;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, startY, contentWidth, 8, 1.5, 1.5, 'FD');

    // Impact Level Badge on the top right
    const badgeWidth = 44;
    const badgeHeight = 6;
    const badgeX = pageWidth - margin - badgeWidth - 1;
    const badgeY = startY + 1;

    let badgeBg: [number, number, number] = [241, 245, 249];
    let badgeText: [number, number, number] = [71, 85, 105];

    if (impactLevel === 'High') {
      badgeBg = [254, 242, 242]; // Light red
      badgeText = [220, 38, 38]; // Red 600
    } else if (impactLevel === 'Medium') {
      badgeBg = [255, 251, 235]; // Light amber
      badgeText = [217, 119, 6]; // Amber 600
    } else {
      badgeBg = [240, 253, 244]; // Light emerald
      badgeText = [22, 163, 74]; // Emerald 600
    }

    doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
    doc.setDrawColor(badgeText[0], badgeText[1], badgeText[2]);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
    doc.text(`${impactLevel.toUpperCase()} IMPACT • ${impactScore}/100`, badgeX + badgeWidth / 2, badgeY + 4, {
      align: 'center',
    });

    // Priority / Scope Tag on the left
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(policy.priority === 'URGENT' ? 220 : 100, policy.priority === 'URGENT' ? 38 : 116, policy.priority === 'URGENT' ? 38 : 139);
    doc.text(`[${policy.priority || 'REGULAR'}] ${policy.category.toUpperCase()}`, margin + 3, startY + 5.2);

    currentY = startY + 11;

    // Policy Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(titleLines, margin + 2, currentY);

    currentY += titleLines.length * 4.2 + 2;

    // Metadata sub-row (Department, Gazette Ref, Area)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    const gazetteText = policy.gazetteRef ? `Ref: ${policy.gazetteRef}` : 'Gazette: Municipal Circular';
    const areaText = policy.affectedDistrict ? `${policy.affectedDistrict}, ${policy.affectedState || ''}` : `${policy.affectedState || 'State-wide'}`;
    doc.text(`Dept: ${policy.department}  |  ${gazetteText}  |  Jurisdiction: ${areaText}`, margin + 2, currentY);

    currentY += 4.5;

    // Policy Summary section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Policy Summary:', margin + 2, currentY);

    currentY += 3.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(summaryLines, margin + 2, currentY);

    currentY += summaryLines.length * 3.5 + 3;

    // Citizen Predictive Impact Box
    if (impact) {
      ensureSpace(28);

      const impactBoxY = currentY;
      const innerWidth = contentWidth - 4;

      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200

      // Calculate height of impact box dynamically
      let impactBoxHeight = 8 + impactOverviewLines.length * 3.5;
      if (benefits.length > 0) impactBoxHeight += 4 + benefits.length * 3.4;
      if (actionSteps.length > 0) impactBoxHeight += 4 + actionSteps.length * 3.4;
      if (policy.actionRequiredForCitizen) impactBoxHeight += 5;

      doc.roundedRect(margin + 2, impactBoxY, innerWidth, impactBoxHeight, 1.5, 1.5, 'FD');

      // Left vertical accent stripe
      doc.setFillColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.rect(margin + 2, impactBoxY, 1.5, impactBoxHeight, 'F');

      let innerY = impactBoxY + 4.5;

      // Predictive Impact Heading
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      doc.text('PREDICTIVE CITIZEN IMPACT & DIRECTIVES:', margin + 6, innerY);

      innerY += 3.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(impactOverviewLines, margin + 6, innerY);

      innerY += impactOverviewLines.length * 3.5 + 2;

      // Key Benefits
      if (benefits.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(16, 185, 129); // Emerald
        doc.text('Key Benefits:', margin + 6, innerY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        benefits.forEach((benefit) => {
          innerY += 3.2;
          const cleanB = benefit.replace(/^[•\-\*]\s*/, '');
          doc.text(`• ${cleanB}`, margin + 8, innerY);
        });
        innerY += 2;
      }

      // Action Steps
      if (actionSteps.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(220, 38, 38); // Crimson
        doc.text('Citizen Action Steps:', margin + 6, innerY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        actionSteps.forEach((action) => {
          innerY += 3.2;
          const cleanA = action.replace(/^[•\-\*]\s*/, '');
          doc.text(`→ ${cleanA}`, margin + 8, innerY);
        });
        innerY += 2;
      }

      if (policy.actionRequiredForCitizen) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(185, 28, 28);
        doc.text(`Official Notice: ${policy.actionRequiredForCitizen}`, margin + 6, innerY + 2);
      }

      currentY = impactBoxY + impactBoxHeight + 6;
    } else {
      currentY += 4;
    }

    // Divider line between policies
    if (idx < policies.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 5;
    }
  });

  // --- COMPLIANCE & OFFLINE ADVISORY FOOTER SECTION ---
  ensureSpace(22);
  currentY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 14, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('OFFICIAL OFFLINE CITIZEN ADVISORY & CITATION NOTICE', margin + 3, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This document is generated by GovInsight AI Studio for offline citizen reference. Policy summaries are synthesized from official government publications and calibrated with predictive impact models. For emergency municipal intervention, dial 1913 or contact your local zonal collectorate.',
    margin + 3,
    currentY + 8,
    { maxWidth: contentWidth - 6 }
  );

  // --- RUNNING FOOTERS ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 9;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'GOVINSIGHT Global Civic Intelligence • Offline Reading Dossier • Verified Government Open Data',
      margin,
      footerY + 2
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY + 2, { align: 'right' });
  }

  // File save
  const cleanDistrict = (district || 'TamilNadu').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `GovInsight_Policy_Impact_Report_${cleanDistrict}_${dateStr}.pdf`;
  doc.save(filename);
}

