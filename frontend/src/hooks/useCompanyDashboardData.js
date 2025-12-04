// src/hooks/useCompanyDashboardData.js
import { useEffect, useState } from 'react';

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



