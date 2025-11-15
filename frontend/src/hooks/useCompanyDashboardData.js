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
  recommendations: [
    {
      title: 'Optimize Transportation Fleet',
      description:
        'Transition to hybrid and electric vehicles for on-site transportation and material delivery. Analysis shows significant potential for emissions reduction through fleet modernization, including replacing diesel trucks with electric alternatives and implementing route optimization software.',
      impact: 'high',
      category: 'Transportation',
      action: '1,200 tons CO₂/year',
      facility: 'All Facilities',
      detailedSteps: [
        'Conduct comprehensive fleet audit to identify high-emission vehicles for replacement',
        'Evaluate electric and hybrid vehicle options suitable for chemical facility operations',
        'Install EV charging infrastructure at Lake Charles Complex and Westlake Facility',
        'Implement route optimization software to reduce fuel consumption',
        'Train drivers on eco-driving techniques and new vehicle technology',
        'Establish partnership with local EV dealers for maintenance support',
      ],
      timeline: '6-12 months',
      estimatedCost: '$150,000 - $300,000',
      expectedBenefit: '40% reduction in fleet emissions',
      complianceImpact:
        "This initiative directly supports Louisiana's Clean Energy Initiative and positions Sasol Chemicals as a leader in sustainable operations. The fleet modernization will contribute to meeting EPA greenhouse gas reporting requirements under 40 CFR Part 98, potentially qualifying the company for state-level green energy incentives. Additionally, reduced emissions from transportation will help maintain compliance with Louisiana DEQ air quality standards in Calcasieu Parish, demonstrating corporate responsibility to local communities and regulators.",
      environmentalBenefit:
        'Fleet optimization will eliminate approximately 1,200 tons of CO₂ emissions annually, equivalent to removing 260 passenger vehicles from the road. Beyond carbon reduction, the transition to electric vehicles will significantly decrease nitrogen oxide (NOx) and particulate matter emissions in the Lake Charles area, improving local air quality for nearby communities in ZIP codes 70669, 70611, and 70605. This initiative also reduces noise pollution and demonstrates Sasol\'s commitment to environmental stewardship in the Gulf Coast region.',
    },
  ],
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
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const defaultSlug = profile?.metadata?.default_org_slug ?? getDefaultOrgSlug();
        let orgId = profile?.org_id ?? null;

        if (!orgId && defaultSlug) {
          const { data: orgBySlug } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', defaultSlug)
            .maybeSingle();
          orgId = orgBySlug?.id ?? null;
        }

        if (!orgId) {
          throw new Error('No organization associated with this account.');
        }

        const [{ data: org, error: orgError }] = await Promise.all([
          supabase
            .from('organizations')
            .select('id,name,industry_sector,region,metadata')
            .eq('id', orgId)
            .maybeSingle(),
        ]);

        if (orgError) {
          throw orgError;
        }

        const { data: facilitiesData, error: facilitiesError } = await supabase
          .from('facilities')
          .select(
            'id, org_id, name, slug, city, state, parish, address_line1, postal_code, latitude, longitude, status, visibility, metadata, capacity_metadata'
          )
          .eq('org_id', orgId)
          .order('name', { ascending: true });

        if (facilitiesError) {
          throw facilitiesError;
        }

        const facilityIds = facilitiesData.map((facility) => facility.id);

        const [
          { data: tasksData, error: tasksError },
          { data: activitiesData, error: activitiesError },
          { data: recommendationsData, error: recommendationsError },
        ] = await Promise.all([
          supabase
            .from('compliance_tasks')
            .select('id, org_id, facility_id, title, regulation, due_date, status, priority, completion_percent, metadata')
            .eq('org_id', orgId)
            .order('due_date', { ascending: true }),
          supabase
            .from('activities')
            .select('id, org_id, facility_id, type, title, description, metadata, created_at')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('recommendations')
            .select(
              'id, org_id, facility_id, title, description, impact, category, estimated_reduction, estimated_cost, timeline, compliance_impact, environmental_benefit, metadata'
            )
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        if (tasksError || activitiesError || recommendationsError) {
          throw tasksError || activitiesError || recommendationsError;
        }

        let emissions = [];
        if (facilityIds.length) {
          const { data: emissionRows, error: emissionsError } = await supabase
            .from('facility_daily_emissions')
            .select('facility_id, measurement_date, tons_co2, change_percent')
            .in('facility_id', facilityIds)
            .order('measurement_date', { ascending: false })
            .limit(facilityIds.length * 5);

          if (emissionsError) {
            throw emissionsError;
          }

          const latestByFacility = new Map();
          emissionRows.forEach((row) => {
            if (!latestByFacility.has(row.facility_id)) {
              latestByFacility.set(row.facility_id, row);
            }
          });
          emissions = Array.from(latestByFacility.values());
        }

        const data = buildDashboardData({
          org,
          facilities: facilitiesData,
          tasks: tasksData ?? [],
          activities: activitiesData ?? [],
          recommendations: recommendationsData ?? [],
          emissions,
        });

        if (isMounted) {
          setDashboardData(data);
        }
      } catch (loadError) {
        console.error('Failed to load dashboard data', loadError);
        if (isMounted) {
          setError(loadError);
          setDashboardData(defaultDashboardData);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  return useMemo(
    () => ({
      data: dashboardData,
      loading,
      error,
    }),
    [dashboardData, loading, error]
  );
}

