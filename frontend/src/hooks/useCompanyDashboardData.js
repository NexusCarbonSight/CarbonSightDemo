import { useEffect, useState } from 'react';

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
  complianceTasks: [],
  activities: [
    { title: 'Lake Charles Complex emissions data uploaded to Louisiana DEQ portal', time: '2 hours ago', type: 'success' },
    { title: 'Westlake Facility - Monthly monitoring report approved', time: '5 hours ago', type: 'success' },
    { title: 'Title V permit renewal documentation submitted', time: '1 day ago', type: 'info' },
    { title: 'Sulfur Operations - Elevated emissions alert triggered', time: '2 days ago', type: 'warning' },
    { title: 'EPA Region 6 inspection scheduled for Lake Charles Complex', time: '3 days ago', type: 'info' },
  ],
  tasks: [],
  recommendations: [],
  emissionsData: [],
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

  const emissionsMap = new Map();
  (emissions || []).forEach((row) => {
    if (!row?.facility_id) return;
    const existing = emissionsMap.get(row.facility_id);
    const existingDate = existing ? new Date(existing.measurement_date) : null;
    const currentDate = row.measurement_date ? new Date(row.measurement_date) : null;
    if (!existing || (currentDate && existingDate && currentDate > existingDate)) {
      emissionsMap.set(row.facility_id, row);
    }
  });

  result.orgId = org.id;
  result.company = org.name;
  result.location = org.region || result.location;
  result.industry = org.industry_sector || result.industry;

  if (facilities.length) {
    const facilityCards = facilities.map((facility) => {
      const latestEmission = emissionsMap.get(facility.id);
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

  result.emissionsData = emissions || [];

  return result;
}

export function useCompanyDashboardData(profile) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const resolveOrgId = async () => {
      if (profile?.org_id) {
        return profile.org_id;
      }

      const slugFromProfile = profile?.metadata?.default_org_slug;
      const fallbackSlug = slugFromProfile || getDefaultOrgSlug();
      if (!fallbackSlug) {
        return null;
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', fallbackSlug)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to resolve organisation slug "${fallbackSlug}": ${error.message}`);
      }

      return data?.id ?? null;
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!profile) {
          throw new Error('You are not signed in.');
        }

        const orgId = await resolveOrgId();
        if (!orgId) {
          throw new Error('Your profile is not mapped to an organisation yet. Ask an administrator to assign one.');
        }

        const [
          { data: org, error: orgError },
          { data: facilities = [], error: facilitiesError },
          { data: tasks = [], error: tasksError },
          { data: activities = [], error: activitiesError },
          { data: recommendations = [], error: recommendationsError },
        ] = await Promise.all([
          supabase.from('organizations').select('*').eq('id', orgId).maybeSingle(),
          supabase.from('facilities').select('*').eq('org_id', orgId).order('name'),
          supabase
            .from('compliance_tasks')
            .select('*')
            .eq('org_id', orgId)
            .order('due_date', { ascending: true }),
          supabase
            .from('activities')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(25),
          supabase
            .from('recommendations')
            .select('*')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false })
            .limit(25),
        ]);

        const firstError = [orgError, facilitiesError, tasksError, activitiesError, recommendationsError].find(Boolean);
        if (firstError) {
          throw firstError;
        }

        if (!org) {
          throw new Error('Organisation record could not be found.');
        }

        let emissions = [];
        if (facilities.length) {
          const facilityIds = facilities.map((f) => f.id);
          const { data: emissionRows, error: emissionsError } = await supabase
            .from('facility_daily_emissions')
            .select('facility_id, measurement_date, tons_co2, change_percent')
            .in('facility_id', facilityIds)
            .order('measurement_date', { ascending: false })
            .limit(Math.max(50, facilityIds.length * 10));

          if (emissionsError && emissionsError.code !== 'PGRST116') {
            throw emissionsError;
          }

          emissions = emissionRows ?? [];
        }

        const dashboard = buildDashboardData({
          org,
          facilities,
          tasks,
          activities,
          recommendations,
          emissions,
        });

        if (!cancelled) {
          setData(dashboard);
        }
      } catch (err) {
        console.error('useCompanyDashboardData: failed to load data', err);
        if (!cancelled) {
          setError(err);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [profile]);


  return { data, loading, error };
}



