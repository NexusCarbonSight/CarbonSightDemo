import { useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabaseClient';

const EMPTY_COMPLIANCE_SERIES = [
  { month: 'Jan', rate: 0 },
  { month: 'Feb', rate: 0 },
  { month: 'Mar', rate: 0 },
  { month: 'Apr', rate: 0 },
  { month: 'May', rate: 0 },
  { month: 'Jun', rate: 0 },
];

const EMPTY_EMISSIONS_SERIES = [
  { month: 'Jan', emissions: 0 },
  { month: 'Feb', emissions: 0 },
  { month: 'Mar', emissions: 0 },
  { month: 'Apr', emissions: 0 },
  { month: 'May', emissions: 0 },
  { month: 'Jun', emissions: 0 },
];

export function useRegulatorDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [emissionsTrend, setEmissionsTrend] = useState(EMPTY_EMISSIONS_SERIES);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          { data: orgs, error: orgError },
          { data: docs, error: docsError },
          { data: alertsData, error: alertsError },
          { data: emissionsAgg, error: emissionsError },
          { data: facilities, error: facilitiesError },
        ] = await Promise.all([
          supabase.from('organizations').select('*').order('name'),
          supabase
            .from('documents')
            .select('id, org_id, name, document_type, uploaded_at, status, metadata, storage_object_path')
            .order('uploaded_at', { ascending: false })
            .limit(50),
          supabase
            .from('alerts')
            .select('id, org_id, title, severity, status, detected_at, description, metadata')
            .order('detected_at', { ascending: false })
            .limit(20),
          supabase
            .from('emissions_aggregate')
            .select('period_end, tons_co2_total')
            .order('period_end', { ascending: true })
            .limit(12),
          supabase
            .from('facilities')
            .select('id, org_id, name, status, city, state, metadata, latitude, longitude')
            .order('name', { ascending: true }),
        ]);

        if (orgError || docsError || alertsError || emissionsError || facilitiesError) {
          throw orgError || docsError || alertsError || emissionsError || facilitiesError;
        }

        if (cancelled) return;

        const documentsByOrg = docs?.reduce((acc, doc) => {
          acc[doc.org_id] = acc[doc.org_id] || [];
          acc[doc.org_id].push(doc);
          return acc;
        }, {}) ?? {};

        const facilitiesByOrg = facilities?.reduce((acc, facility) => {
          acc[facility.org_id] = acc[facility.org_id] || [];
          acc[facility.org_id].push(facility);
          return acc;
        }, {}) ?? {};

        const alertsByOrg = alertsData?.reduce((acc, alert) => {
          acc[alert.org_id] = acc[alert.org_id] || [];
          acc[alert.org_id].push(alert);
          return acc;
        }, {}) ?? {};

        const mappedCompanies =
          orgs?.map((org) => {
            const orgDocs = documentsByOrg[org.id] || [];
            const orgFacilities = facilitiesByOrg[org.id] || [];
            const orgAlerts = alertsByOrg[org.id] || [];
            const meta = org.metadata || {};

            const complianceValue = Number(org.compliance_rate ?? meta.compliance_rate ?? meta.compliance ?? 0);
            const emissionsValue = Number(meta.daily_emissions ?? meta.emissionsRate ?? meta.emissions_per_day ?? 0);
            const status = complianceValue >= 90 ? 'compliant' : 'needs_attention';

            return {
              id: org.id,
              name: org.name,
              emissions: Number.isFinite(emissionsValue) ? emissionsValue : 0,
              compliance: Number.isFinite(complianceValue) ? complianceValue : 0,
              status,
              documents: orgDocs.length,
              lastReport: meta.last_report || orgDocs[0]?.metadata?.reporting_period || '—',
              lastSubmission: orgDocs[0]?.uploaded_at || null,
              facilities: orgFacilities.map((facility) => ({
                id: facility.id,
                name: facility.name,
                status: facility.status || 'Optimal',
                emissions:
                  facility.metadata?.emissions_per_day ||
                  facility.metadata?.emissionsPerDay ||
                  facility.metadata?.tons_co2 ||
                  0,
                location: facility.city ? `${facility.city}, ${facility.state ?? ''}`.trim() : 'Louisiana',
              })),
              recentDocuments: orgDocs.slice(0, 5).map((doc) => ({
                id: doc.id,
                name: doc.name,
                date: doc.uploaded_at,
                status: doc.status || 'Pending',
                storagePath: doc.storage_object_path,
              })),
              violations: orgAlerts.map((alert) => ({
                id: alert.id,
                type: alert.title || alert.metadata?.type || 'Alert',
                date: alert.detected_at,
                severity: alert.severity || 'medium',
                resolved: alert.status === 'resolved',
              })),
            };
          }) ?? [];

        const mappedSubmissions =
          docs?.map((doc) => ({
            id: doc.id,
            orgId: doc.org_id,
            company:
              mappedCompanies.find((company) => company.id === doc.org_id)?.name || 'Unknown',
            document: doc.name,
            type: doc.document_type || doc.metadata?.type || 'Document',
            submitted: doc.uploaded_at,
            status: doc.status?.toLowerCase() || 'pending',
            metadata: doc.metadata || {},
            storagePath: doc.storage_object_path || null,
          })) ?? [];

        const mappedAlerts =
          alertsData?.map((alert) => ({
            id: alert.id,
            company:
              mappedCompanies.find((company) => company.id === alert.org_id)?.name || 'Unknown',
            type: alert.title || alert.metadata?.type || 'Alert',
            severity: alert.severity || 'medium',
            status: alert.status || 'pending',
            timestamp: alert.detected_at,
            description: alert.description || alert.metadata?.description || '',
          })) ?? [];

        const mappedEmissions =
          emissionsAgg?.map((row) => ({
            month: new Date(row.period_end).toLocaleString('default', { month: 'short' }),
            emissions: Number(row.tons_co2_total) || 0,
          })) ?? EMPTY_EMISSIONS_SERIES;

        setCompanies(mappedCompanies);
        setSubmissions(mappedSubmissions);
        setAlerts(mappedAlerts);
        setEmissionsTrend(mappedEmissions);
      } catch (err) {
        if (!cancelled) {
          console.error('useRegulatorDashboardData', err);
          setError(err);
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
  }, []);

  const complianceTrend = useMemo(() => {
    if (!companies.length) return EMPTY_COMPLIANCE_SERIES;
    return companies.slice(0, 6).map((company, idx) => ({
      month: `M${idx + 1}`,
      rate: company.compliance || 0,
    }));
  }, [companies]);

  return {
    loading,
    error,
    complianceTrend,
    emissionsTrend,
    companies,
    submissions,
    alerts,
  };
}
