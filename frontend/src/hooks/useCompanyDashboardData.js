import { useEffect, useMemo, useState } from 'react';

import { getDefaultOrgSlug, supabase } from '../lib/supabaseClient';

const defaultDashboardData = {
  orgId: null,
  company: 'Sasol Chemicals (Louisiana)',
  location: 'Lake Charles, Louisiana',
  industry: 'Chemical Manufacturing / Petrochemicals',
  emissionsRate: 360333,
  emissionsChange: 12,
  areasAffected: 3,
  optimalFacilities: 2,
  attentionFacilities: 1,
  complianceStatus: 94,
  complianceDeadline: 'Jan 15',
  activeTasks: 7,
  urgentTasks: 2,
  normalTasks: 5,
  facilities: [
    {
      id: 1,
      name: 'Lake Charles Complex',
      location: 'Westlake, LA 70669',
      address: '1 Sasol Place, Westlake, LA 70669',
      parish: 'Calcasieu',
      lat: 30.2488,
      lng: -93.2652,
      emissionsPerDay: 180500,
      emissionsChange: -8,
      status: 'optimal',
      employees: 1200,
      operationalSince: 2014,
      primaryProducts: ['Ethylene', 'Propylene', 'Mixed Alcohols'],
      capacity: '1.5M tons/year',
      nearbyZipCodes: ['70669', '70611', '70605'],
      environmentalImpact: 'Moderate - Active monitoring of nearby communities',
      airQualityIndex: 45,
    },
    {
      id: 2,
      name: 'Westlake Facility',
      location: 'Westlake, LA 70669',
      address: '3350 Highway 108, Westlake, LA 70669',
      parish: 'Calcasieu',
      lat: 30.235,
      lng: -93.27,
      emissionsPerDay: 145200,
      emissionsChange: -15,
      status: 'optimal',
      employees: 850,
      operationalSince: 2016,
      primaryProducts: ['Linear Alpha Olefins', 'Detergent Alcohols'],
      capacity: '1.2M tons/year',
      nearbyZipCodes: ['70669', '70615'],
      environmentalImpact: 'Low - Best-in-class emissions control',
      airQualityIndex: 38,
    },
    {
      id: 3,
      name: 'Sulfur Operations',
      location: 'Westlake, LA 70669',
      address: '1 Sulfur Road, Westlake, LA 70669',
      parish: 'Calcasieu',
      lat: 30.24,
      lng: -93.26,
      emissionsPerDay: 34633,
      emissionsChange: 5,
      status: 'needs_attention',
      employees: 320,
      operationalSince: 2015,
      primaryProducts: ['Sulfur', 'Sulfuric Acid'],
      capacity: '500K tons/year',
      nearbyZipCodes: ['70669'],
      environmentalImpact: 'Elevated - Recent increase requires investigation',
      airQualityIndex: 62,
    },
  ],
  complianceTasks: [
    {
      id: 1,
      title: 'Q4 2024 Air Emissions Report',
      regulation: 'Louisiana DEQ - LAC 33:III.Chapter 5',
      dueDate: 'Jan 15, 2025',
      status: 'in_progress',
      priority: 'urgent',
      assignedTo: 'Environmental Compliance Team',
      completionPercent: 75,
      requirements: ['Emissions data compilation', 'Third-party verification', 'DEQ submission portal upload'],
    },
    {
      id: 2,
      title: 'Title V Operating Permit Renewal',
      regulation: 'EPA Clean Air Act Title V',
      dueDate: 'Feb 1, 2025',
      status: 'in_progress',
      priority: 'urgent',
      assignedTo: 'Regulatory Affairs',
      completionPercent: 60,
      requirements: ['Updated facility diagrams', 'Emissions modeling report', 'Public notice documentation'],
    },
  ],
  activities: [
    { title: 'Lake Charles Complex emissions data uploaded to Louisiana DEQ portal', time: '2 hours ago', type: 'success' },
    { title: 'Westlake Facility - Monthly monitoring report approved', time: '5 hours ago', type: 'success' },
    { title: 'Title V permit renewal documentation submitted', time: '1 day ago', type: 'info' },
    { title: 'Sulfur Operations - Elevated emissions alert triggered', time: '2 days ago', type: 'warning' },
    { title: 'EPA Region 6 inspection scheduled for Lake Charles Complex', time: '3 days ago', type: 'info' },
  ],
  tasks: [],
  recommendations: [],
};

function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toTitleCase(value) {
  if (!value) return '';
  return value
    .toString()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildDashboardData({ org, facilities, tasks, activities, recommendations, emissions }) {
  if (!org) {
    return defaultDashboardData;
  }

  const result = { ...defaultDashboardData };

  result.orgId = org.id;
  result.company = org.name;
  result.location = org.region || result.location;
  result.industry = org.industry_sector || result.industry;

  if (facilities.length) {
    const facilityCards = facilities.map((facility) => {
      const latestEmission = emissions.find((row) => row.facility_id === facility.id);
      const metadata = facility.metadata || {};
      const capacity = facility.capacity_metadata?.capacity || metadata.capacity;
      const primaryProducts =
        facility.capacity_metadata?.primary_products || metadata.primary_products || defaultDashboardData.facilities[0].primaryProducts;
      const addressParts = [facility.address_line1, facility.city && `${facility.city}, ${facility.state ?? ''}`.trim(), facility.postal_code]
        .filter(Boolean)
        .join(', ');

      return {
        id: facility.id,
        name: facility.name,
        location: addressParts || `${facility.city ?? ''}, ${facility.state ?? ''}`.trim(),
        address: addressParts,
        parish: facility.parish,
        lat: facility.latitude,
        lng: facility.longitude,
        emissionsPerDay: latestEmission?.tons_co2 ?? 0,
        emissionsChange: latestEmission?.change_percent ?? 0,
        status: facility.status ?? 'optimal',
        employees: metadata.employees ?? null,
        operationalSince: metadata.operational_since ?? null,
        primaryProducts: Array.isArray(primaryProducts) ? primaryProducts : [primaryProducts].filter(Boolean),
        capacity,
        nearbyZipCodes: metadata.nearby_zip_codes ?? [],
        environmentalImpact: metadata.environmental_impact ?? '',
        airQualityIndex: metadata.air_quality_index ?? null,
      };
    });

    result.facilities = facilityCards;
    result.areasAffected = facilityCards.length;
    result.optimalFacilities = facilityCards.filter((f) => f.status === 'optimal').length;
    result.attentionFacilities = facilityCards.filter((f) => f.status && f.status.startsWith('needs')).length;

    const totalEmissions = facilityCards.reduce((sum, facility) => sum + (Number(facility.emissionsPerDay) || 0), 0);
    result.emissionsRate = totalEmissions || result.emissionsRate;

    const changeValues = facilityCards.map((f) => Number(f.emissionsChange)).filter((val) => !Number.isNaN(val));
    if (changeValues.length) {
      const avgChange = changeValues.reduce((sum, val) => sum + val, 0) / changeValues.length;
      result.emissionsChange = Math.round(avgChange * 10) / 10;
    }
  }

  if (tasks.length) {
    const mappedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      regulation: task.regulation,
      dueDate: formatDate(task.due_date),
      status: task.status,
      priority: task.priority,
      assignedTo: task.metadata?.assigned_to ?? task.metadata?.assignedTo ?? 'Unassigned',
      completionPercent: Number(task.completion_percent ?? 0),
      requirements: task.metadata?.requirements ?? [],
      facilityId: task.facility_id,
    }));

    result.complianceTasks = mappedTasks;
    result.tasks = mappedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.regulation ?? 'Compliance task',
      priority: task.priority === 'urgent' ? 'urgent' : 'normal',
      due: task.dueDate,
      status: task.status === 'completed' ? 'complete' : 'pending',
      category: task.metadata?.category ?? 'compliance',
      facility: facilities.find((f) => f.id === task.facilityId)?.name ?? 'All Facilities',
    }));

    result.activeTasks = mappedTasks.length;
    result.urgentTasks = mappedTasks.filter((task) => task.priority === 'urgent' || task.priority === 'critical').length;
    result.normalTasks = mappedTasks.length - result.urgentTasks;

    const completed = mappedTasks.filter((task) => task.status === 'completed').length;
    result.complianceStatus = mappedTasks.length ? Math.round((completed / mappedTasks.length) * 100) : result.complianceStatus;
    const nextDeadline = mappedTasks
      .map((task) => new Date(task.dueDate))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a - b)[0];
    if (nextDeadline) {
      result.complianceDeadline = nextDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  if (activities.length) {
    result.activities = activities.map((activity) => ({
      title: activity.title,
      time: activity.created_at
        ? new Date(activity.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })
        : activity.metadata?.display_time ?? 'Recently',
      type: activity.metadata?.status ?? activity.type ?? 'info',
    }));
  }

  if (recommendations.length) {
    result.recommendations = recommendations.map((rec) => ({
      title: rec.title,
      description: rec.description,
      impact: rec.impact,
      category: rec.category,
      action: rec.estimated_reduction ? `${rec.estimated_reduction.toLocaleString()} tons CO₂/year` : rec.metadata?.action,
      facility:
        facilities.find((facility) => facility.id === rec.facility_id)?.name ?? rec.metadata?.facility_scope ?? 'All Facilities',
      detailedSteps: rec.metadata?.steps ?? rec.metadata?.detailed_steps ?? [],
      timeline: rec.timeline,
      estimatedCost: rec.estimated_cost ? `$${rec.estimated_cost.toLocaleString()}` : rec.metadata?.estimated_cost,
      expectedBenefit: rec.environmental_benefit,
      complianceImpact: rec.compliance_impact,
      environmentalBenefit: rec.environmental_benefit,
    }));
  }

  return result;
}

export function useCompanyDashboardData(profile) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!profile) {
          throw new Error('You are not signed in.');
        }

        // --- Static demo data that matches what CompanyDashboard expects ---
        const demoFacilities = [
          {
            id: 1,
            name: 'Plant A – Main Facility',
            status: 'optimal',
            location: 'Lake Charles, LA',
            parish: 'Calcasieu',
            emissionsPerDay: 180000,
            emissionsChange: -8,
            capacity: '1.2M tons/yr',
            employees: 650,
            primaryProducts: ['Ethylene', 'Polyethylene'],
            address: '100 Industrial Blvd, Lake Charles, LA 70601',
            operationalSince: '2003',
            airQualityIndex: 45,
            environmentalImpact:
              'Modernized equipment and optimized flaring have reduced emissions over the last 3 years.',
            nearbyZipCodes: ['70601', '70602', '70605'],
          },
          {
            id: 2,
            name: 'Plant B – Utilities & Power',
            status: 'attention',
            location: 'Westlake, LA',
            parish: 'Calcasieu',
            emissionsPerDay: 120000,
            emissionsChange: 3,
            capacity: '800k tons/yr',
            employees: 420,
            primaryProducts: ['Steam', 'Electricity'],
            address: '250 Power Station Rd, Westlake, LA 70669',
            operationalSince: '1994',
            airQualityIndex: 62,
            environmentalImpact:
              'Older boilers and intermittent flaring cause local air quality concerns during peak demand.',
            nearbyZipCodes: ['70669', '70663'],
          },
          {
            id: 3,
            name: 'Plant C – Specialty Chemicals',
            status: 'attention',
            location: 'Sulphur, LA',
            parish: 'Calcasieu',
            emissionsPerDay: 60333,
            emissionsChange: -4,
            capacity: '500k tons/yr',
            employees: 300,
            primaryProducts: ['Solvents', 'Additives'],
            address: '400 Specialty Dr, Sulphur, LA 70665',
            operationalSince: '2010',
            airQualityIndex: 55,
            environmentalImpact:
              'Fugitive emissions and venting from storage tanks are current focus areas.',
            nearbyZipCodes: ['70665', '70664'],
          },
        ];

        const demoRecommendations = [
          {
            title: 'Optimize Plant C Reboiler Operations',
            description:
              'Adjust column operating conditions and heat integration to reduce fuel gas consumption in Plant C.',
            impact: 'high',
            category: 'Operations',
            facility: 'Plant C – Specialty Chemicals',
            action: 'Implement advanced control tuning',
            timeline: '3–6 months',
            estimatedCost: '$400k–$600k',
            expectedBenefit: 'Up to 12% CO₂ reduction at Plant C',
            complianceImpact:
              'Reduces risk of exceeding permitted annual CO₂ limits.',
            environmentalBenefit:
              'Improves local air quality and lowers overall GHG emissions.',
            detailedSteps: [
              'Perform energy audit on Plant C distillation trains.',
              'Identify reboilers with highest energy intensity.',
              'Deploy advanced process control on key columns.',
              'Track emissions and fuel usage for 6 months post-implementation.',
            ],
          },
          {
            title: 'Boiler Upgrade Feasibility Study',
            description:
              'Evaluate replacing two legacy boilers at Plant B with high-efficiency units.',
            impact: 'medium',
            category: 'Capital Projects',
            facility: 'Plant B – Utilities & Power',
            action: 'Commission engineering study',
            timeline: '6–12 months',
            estimatedCost: '$150k study; capex TBD',
            expectedBenefit:
              '5–8% site-wide emissions reduction if implemented.',
            complianceImpact:
              'Improves margin against tightening NOₓ and CO₂ limits.',
            environmentalBenefit: 'Lower stack emissions and fuel usage.',
            detailedSteps: [
              'Collect operating data and downtime history for existing boilers.',
              'Issue RFP to equipment vendors.',
              'Compare lifecycle emissions and costs of alternatives.',
              'Present options to leadership with payback analysis.',
            ],
          },
          {
            title: 'Fenceline Monitoring Communication Plan',
            description:
              'Improve community transparency by publishing key fenceline indicators on a public microsite.',
            impact: 'low',
            category: 'Community',
            facility: 'Site-wide',
            action: 'Develop communications plan',
            timeline: '1–3 months',
            estimatedCost: '$25k–$50k',
            expectedBenefit: 'Improved stakeholder trust and visibility.',
            complianceImpact:
              'Supports reporting obligations and reduces reputational risk.',
            environmentalBenefit:
              'Provides early warning of abnormal emission events.',
            detailedSteps: [
              'Identify top 3–5 indicators to publish externally.',
              'Align messaging with corporate communications.',
              'Design simple dashboards for the public.',
              'Review and approve with legal and compliance teams.',
            ],
          },
        ];

        const demoTasks = [
          {
            id: 1,
            title: 'Upload Q4 Emissions Report',
            description:
              'Prepare and upload the Q4 greenhouse gas emissions report for all Louisiana facilities.',
            priority: 'urgent',
            category: 'compliance',
            due: '2025-01-15',
          },
          {
            id: 2,
            title: 'Calibrate Continuous Emissions Monitors',
            description:
              'Perform scheduled calibration on all CO₂ and NOₓ CEMs at Plant A and Plant B.',
            priority: 'normal',
            category: 'operations',
            due: '2024-12-20',
          },
          {
            id: 3,
            title: 'Review Flaring Events for October',
            description:
              'Investigate October flaring events and document root causes and corrective actions.',
            priority: 'normal',
            category: 'compliance',
            due: '2024-12-31',
          },
        ];

        const demoComplianceTasks = [
          {
            id: 1,
            title: 'Title V Permit Renewal Submission',
            regulation: 'EPA Title V Permit – LA-001',
            priority: 'urgent',
            status: 'in_progress',
            dueDate: '2025-03-01',
            completionPercent: 60,
            assignedTo: 'Environmental Manager',
            requirements: [
              'Finalize emissions inventory for previous year',
              'Confirm control equipment performance data',
              'Upload supporting documentation to the portal',
            ],
          },
          {
            id: 2,
            title: 'Greenhouse Gas Annual Report',
            regulation: 'GHG Reporting Program (Part 98)',
            priority: 'normal',
            status: 'scheduled',
            dueDate: '2025-03-31',
            completionPercent: 30,
            assignedTo: 'GHG Reporting Team',
            requirements: [
              'Compile CO₂e by facility and source category',
              'Verify data against CEMs and fuel usage',
              'Complete QA/QC review prior to submission',
            ],
          },
        ];

        const demoData = {
          company: profile.display_name || 'Your Company',
          emissionsRate: 360333,
          emissionsChange: -12,
          areasAffected: 3,
          optimalFacilities: 1,
          attentionFacilities: 2,
          complianceStatus: 94,
          complianceDeadline: 'Jan 15, 2025',
          activeTasks: demoTasks.length,
          urgentTasks: demoTasks.filter(t => t.priority === 'urgent').length,
          normalTasks: demoTasks.filter(t => t.priority === 'normal').length,
          recommendations: demoRecommendations,
          activities: [
            {
              title: 'Q3 emissions report approved by regulator',
              time: '2 days ago',
              type: 'success',
            },
            {
              title: 'New optimization recommendation for Plant C',
              time: '5 days ago',
              type: 'info',
            },
            {
              title: 'Upcoming compliance deadline: Title V renewal',
              time: '1 week ago',
              type: 'warning',
            },
          ],
          tasks: demoTasks,
          facilities: demoFacilities,
          complianceTasks: demoComplianceTasks,
        };

        if (!cancelled) {
          setData(demoData);
        }
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [profile]);

  return { data, loading, error };
}



