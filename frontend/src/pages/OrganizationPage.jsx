import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../components/PageLayout';
import { ErrorState } from '../components/States';
import { useToast } from '../components/ToastProvider';
import client from '../api/client';

export default function OrganizationPage() {
  const toast = useToast();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/organizations');
      setOrgs(res.data ?? []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleGeneratePdf = async (orgId, orgName) => {
    setPdfLoading(orgId);
    try {
      const res = await client.get(`/organizations/${orgId}/report`, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(file);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `organization-report-${orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast('PDF report downloaded successfully');
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.error?.message || 'Failed to generate PDF report', 'error');
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <PageLayout title="Organization Management">
      {loading && <div className="py-16 text-center text-ink-muted text-sm">Loading…</div>}
      {!loading && error && <ErrorState message={error} onRetry={fetchOrgs} />}
      {!loading && !error && orgs.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-ink-muted">
          No organizations found in the system.
        </div>
      )}
      
      {!loading && !error && orgs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orgs.map(org => (
            <div key={org.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
              {/* Header Info */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-ink-onLight">{org.name}</h2>
                    <span className="text-xs bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full mt-1 inline-block">
                      {org.orgType || 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-status-available/20 text-status-available">
                    {org.subscriptionPlan || 'Basic'} Plan
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-sm text-ink-onLight">
                  {org.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted w-16 shrink-0 font-medium">Email:</span>
                      <span>{org.email}</span>
                    </div>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted w-16 shrink-0 font-medium">Phone:</span>
                      <span>{org.phone}</span>
                    </div>
                  )}
                  {org.website && (
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted w-16 shrink-0 font-medium">Website:</span>
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                        {org.website}
                      </a>
                    </div>
                  )}
                  {org.address && (
                    <div className="flex items-start gap-2">
                      <span className="text-ink-muted w-16 shrink-0 font-medium">Address:</span>
                      <span>{org.address}</span>
                    </div>
                  )}
                  {org.domainsOfWork && org.domainsOfWork.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-ink-muted w-16 shrink-0 font-medium font-medium">Domains:</span>
                      <span className="flex flex-wrap gap-1.5 mt-0.5">
                        {org.domainsOfWork.map(d => (
                          <span key={d} className="bg-brand-light text-ink-onLight text-xs px-2 py-0.5 rounded border border-gray-200">
                            {d}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="px-6 py-4 bg-brand-light flex justify-between items-center">
                <span className="text-xs text-ink-muted">
                  Founded in {org.foundedYear || '—'}
                </span>
                <button
                  id={`btn-generate-report-${org.id}`}
                  onClick={() => handleGeneratePdf(org.id, org.name)}
                  disabled={pdfLoading === org.id}
                  className="btn-primary text-sm flex items-center gap-2 px-4 py-2 disabled:opacity-50"
                >
                  {pdfLoading === org.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate PDF Report
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
