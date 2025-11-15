import { useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabaseClient';

const defaultRegulatorData = {
  complianceTrend: [
    { month: 'Jun', rate: 90 },
    { month: 'Jul', rate: 92 },
    { month: 'Aug', rate: 93 },
    { month: 'Sep', rate: 94 },
    { month: 'Oct', rate: 96 },
    { month: 'Nov', rate: 98 },
  ],
  emissionsTrend: [
    { month: 'Jun', emissions: 370000 },
    { month: 'Jul', emissions: 360000 },
    { month: 'Aug', emissions: 350000 },
    { month: 'Sep', emissions: 390000 },
    { month: 'Oct', emissions: 370000 },
    { month: 'Nov', emissions: 380000 },
  ],
  companies: [],
  submissions: [],
  alerts: [],
};

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString();
}

function mapDocuments(documents, organizations) {
  if (!documents?.length) return [];
  const orgMap = new Map(organizations.map((org) => [org.id, org]));

  return documents.map((doc) => ({
    company: orgMap.get(doc.org_id)?.name ?? 'Unknown',
    document: doc.name,
    type: doc.document_type,
    submitted: doc.uploaded_at ? new Date(doc.uploaded_at).toISOString().slice(0, 10) : 'Pending',
    status: doc.status,
    reviewer: doc.metadata?.reviewer ?? 'Pending',
    metadata: doc.metadata ?? {},
    storagePath: doc.storage_object_path,
  }));
}

function mapAlerts(alerts, organizations) {
  if (!alerts?.length) return [];
  const orgMap = new Map(organizations.map((org) => [org.id, org]));
  return alerts.map((alert) => ({
    id: alert.id,
    type: alert.title,
    company: orgMap.get(alert.org_id)?.name ?? 'Unknown',
    severity: alert.severity,
    description: alert.description,
    message: alert.description,
    timestamp: alert.detected_at
      ? new Date(alert.detected_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : 'N/A',
    status: alert.status,
    metadata: alert.metadata,
  }));
}

function deriveComplianceTrend(fromTasks) {
  if (!fromTasks?.length) return defaultRegulatorData.complianceTrend;
  const grouped = new Map();
  fromTasks.forEach((task) => {
    const due = task.due_date ? new Date(task.due_date) : null;
    if (!due || Number.isNaN(due.getTime())) return;
    const key = `${due.getFullYear()}-${monthFormatter.format(due)}`;
    const value = grouped.get(key) ?? { month: monthFormatter.format(due), total: 0, completed: 0 };
    value.total += 1;
    if (task.status === 'completed') value.completed += 1;
    grouped.set(key, value);
  });

  return Array.from(grouped.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((entry) => ({
      month: entry.month,
      rate: entry.total ? Math.round((entry.completed / entry.total) * 100) : 0,
    }));
}

function deriveEmissionsTrend(emissions) {
  if (!emissions?.length) return defaultRegulatorData.emissionsTrend;

  const grouped = new Map();
  emissions.forEach((row) => {
    const date = row.measurement_date ? new Date(row.measurement_date) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const value = grouped.get(key) ?? { month: monthFormatter.format(date), emissions: 0 };
    value.emissions += Number(row.tons_co2 ?? 0);
    grouped.set(key, value);
  });

  return Array.from(grouped.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function deriveCompanyCards({ organizations, tasks, documents, alerts, latestEmissions }) {
  const orgMap = new Map(organizations.map((org) => [org.id, org]));
  const documentsByOrg = documents.reduce((acc, doc) => {
    const list = acc.get(doc.org_id) ?? [];
    list.push(doc);
    acc.set(doc.org_id, list);
    return acc;
  }, new Map());
  const tasksByOrg = tasks.reduce((acc, task) => {
    const list = acc.get(task.org_id) ?? [];
    list.push(task);
    acc.set(task.org_id, list);
    return acc;
  }, new Map());
  const alertsByOrg = alerts.reduce((acc, alert) => {
    const list = acc.get(alert.org_id) ?? [];
    list.push(alert);
    acc.set(alert.org_id, list);
    return acc;
  }, new Map());
  const emissionsByOrg = latestEmissions.reduce((acc, entry) => {
    const list = acc.get(entry.org_id) ?? [];
    list.push(entry);
    acc.set(entry.org_id, list);
    return acc;
  }, new Map());

  return organizations.map((org) => {
    const orgTasks = tasksByOrg.get(org.id) ?? [];
    const orgDocuments = documentsByOrg.get(org.id) ?? [];
    const orgAlerts = alertsByOrg.get(org.id) ?? [];
    const orgEmissions = emissionsByOrg.get(org.id) ?? [];

    const completedTasks = orgTasks.filter((task) => task.status === 'completed').length;
    const complianceRate = orgTasks.length ? Math.round((completedTasks / orgTasks.length) * 100) : 100;

    const latestDoc = orgDocuments
      .map((doc) => ({ doc, date: doc.uploaded_at ? new Date(doc.uploaded_at) : null }))
      .filter(({ date }) => date && !Number.isNaN(date.getTime()))
      .sort((a, b) => b.date - a.date)[0];

    const emissionsTotal = orgEmissions.reduce((sum, entry) => sum + Number(entry.tons_co2 ?? 0), 0);

    return {
      id: org.id,
      name: org.name,
      compliance: complianceRate,
      emissions: formatNumber(emissionsTotal || 0),
      status: complianceRate >= 90 && orgAlerts.length === 0 ? 'compliant' : 'attention',
      documents: orgDocuments.length,
      lastSubmission: latestDoc?.date ? latestDoc.date.toISOString().slice(0, 10) : '—',
      lastReport: orgAlerts.length ? 'Overdue' : 'On time',
    };
  });
}

export function useRegulatorDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [state, setState] = useState(defaultRegulatorData);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          { data: organizations, error: orgError },
          { data: tasks, error: tasksError },
          { data: documents, error: documentsError },
          { data: alerts, error: alertsError },
          { data: emissions, error: emissionsError },
        ] = await Promise.all([
          supabase.from('organizations').select('id, name, slug, industry_sector, region'),
          supabase
            .from('compliance_tasks')
            .select('id, org_id, facility_id, title, regulation, due_date, status, priority, metadata')
            .order('due_date', { ascending: true }),
          supabase
            .from('documents')
            .select('id, org_id, name, document_type, status, uploaded_at, storage_object_path, metadata')
            .order('uploaded_at', { ascending: false })
            .limit(50),
          supabase
            .from('alerts')
            .select('id, org_id, facility_id, severity, status, title, description, detected_at, metadata')
            .order('detected_at', { ascending: false })
            .limit(50),
          supabase
            .from('facility_daily_emissions')
            .select('facility_id, measurement_date, tons_co2, change_percent, facilities!inner(org_id)')
            .order('measurement_date', { ascending: false })
            .limit(200),
        ]);

        if (orgError || tasksError || documentsError || alertsError || emissionsError) {
          throw orgError || tasksError || documentsError || alertsError || emissionsError;
        }

        const organizationsList = organizations ?? [];
        const tasksList = tasks ?? [];
        const documentsList = documents ?? [];
        const alertsList = alerts ?? [];
        const emissionsList = (emissions ?? []).map((row) => ({
          ...row,
          org_id: row.facilities?.org_id,
        }));

        const complianceTrend = deriveComplianceTrend(tasksList);
        const emissionsTrend = deriveEmissionsTrend(emissionsList);
        const companies = deriveCompanyCards({
          organizations: organizationsList,
          tasks: tasksList,
          documents: documentsList,
          alerts: alertsList,
          latestEmissions: emissionsList,
        });
        const submissions = mapDocuments(documentsList, organizationsList);
        const alertsMapped = mapAlerts(alertsList, organizationsList);

        if (isMounted) {
          setState({
            complianceTrend: complianceTrend.length ? complianceTrend : defaultRegulatorData.complianceTrend,
            emissionsTrend: emissionsTrend.length ? emissionsTrend : defaultRegulatorData.emissionsTrend,
            companies: companies.length ? companies : defaultRegulatorData.companies,
            submissions: submissions.length ? submissions : defaultRegulatorData.submissions,
            alerts: alertsMapped.length ? alertsMapped : defaultRegulatorData.alerts,
          });
        }
      } catch (loadError) {
        console.error('Failed to load regulator dashboard', loadError);
        if (isMounted) {
          setError(loadError);
          setState(defaultRegulatorData);
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
  }, []);

  return useMemo(
    () => ({
      loading,
      error,
      ...state,
    }),
    [loading, error, state]
  );
}

