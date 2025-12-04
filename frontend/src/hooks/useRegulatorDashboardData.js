// src/hooks/useRegulatorDashboardData.js
import { useMemo, useState } from 'react';

export function useRegulatorDashboardData() {
  // No async here – we just pretend it loaded successfully
  const [loading] = useState(false);
  const [error] = useState(null);

  const complianceTrend = useMemo(
    () => [
      { month: 'Jan', rate: 88 },
      { month: 'Feb', rate: 90 },
      { month: 'Mar', rate: 92 },
      { month: 'Apr', rate: 93 },
      { month: 'May', rate: 94 },
      { month: 'Jun', rate: 95 },
    ],
    []
  );

  const emissionsTrend = useMemo(
    () => [
      { month: 'Jan', emissions: 420000 },
      { month: 'Feb', emissions: 410000 },
      { month: 'Mar', emissions: 398000 },
      { month: 'Apr', emissions: 390000 },
      { month: 'May', emissions: 382000 },
      { month: 'Jun', emissions: 375000 },
    ],
    []
  );

  const companies = useMemo(
    () => [
      {
        id: 1,
        name: 'Demo Chemicals – LA',
        emissions: 360333,
        compliance: 94,
        status: 'on_track',
        documents: 12,
        lastReport: 'Q3 2024',
        lastSubmission: '2024-10-15',
      },
      {
        id: 2,
        name: 'Gulf Coast Refining',
        emissions: 285000,
        compliance: 89,
        status: 'watch',
        documents: 9,
        lastReport: 'Q3 2024',
        lastSubmission: '2024-10-10',
      },
    ],
    []
  );

  const submissions = useMemo(
    () => [
      {
        id: 1,
        company: 'Demo Chemicals – LA',
        document: 'Q3_Emissions_Report.pdf',
        type: 'Emissions Report',
        submitted: '2024-10-15',
        status: 'approved',
        metadata: {
          pages: 42,
          file_size: '2.1 MB',
          submitted_by: 'Environmental Manager',
          review_deadline: '2024-10-31',
          issues: [],
        },
      },
      {
        id: 2,
        company: 'Gulf Coast Refining',
        document: 'Deviation_Report_Sept.pdf',
        type: 'Deviation Report',
        submitted: '2024-10-12',
        status: 'under_review',
        metadata: {
          pages: 8,
          file_size: '750 KB',
          submitted_by: 'Compliance Specialist',
          review_deadline: '2024-10-26',
          issues: ['Unplanned flaring event on 9/21'],
        },
      },
    ],
    []
  );

  const alerts = useMemo(
    () => [
      {
        id: 1,
        company: 'Gulf Coast Refining',
        type: 'Emissions Spike',
        severity: 'high',
        status: 'active',
        timestamp: '2024-10-20 14:32',
        description:
          'Elevated CO₂ and NOₓ readings at fenceline monitors for 2 hours.',
      },
      {
        id: 2,
        company: 'Demo Chemicals – LA',
        type: 'Late Document',
        severity: 'medium',
        status: 'pending',
        timestamp: '2024-10-05 09:15',
        description:
          'Quarterly flaring report submitted 3 days after the due date.',
      },
    ],
    []
  );

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



