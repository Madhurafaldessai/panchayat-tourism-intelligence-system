import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';

const Heatmap = lazy(() => import('./Heatmap'));

const MapLoading = () => (
  <div className="flex h-full items-center justify-center bg-gray-100 p-4 text-center text-xs font-bold uppercase tracking-widest">
    Loading map…
  </div>
);

const normaliseStatus = (status) => String(status || '').trim().toLowerCase();

const Overview = ({ setActiveTab, villageId }) => {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [updatingIssueId, setUpdatingIssueId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadIssues = useCallback(async () => {
    if (!villageId) {
      setError('This administrator does not have a village assigned.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: queryError } = await supabase
      .from('reports')
      .select('id, citizen_name, category, title, description, severity, status, image_url, location_name, latitude, longitude, created_at, resolved_at')
      .eq('village_id', villageId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (queryError) {
      setError('Issues could not be loaded. Check the database policy and try again.');
      setIsLoading(false);
      return;
    }

    setIssues(data || []);
    setError(null);
    setIsLoading(false);
  }, [villageId]);

  const handleMarkSolved = async (issue) => {
    setUpdatingIssueId(issue.id);
    setActionError(null);
    const { data, error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'solved',
        resolved_at: new Date().toISOString(),
        resolution_description: 'Marked as solved by the village administrator.',
      })
      .eq('id', issue.id)
      .eq('village_id', villageId);

    if (updateError) {
      setActionError(updateError.message || 'The report could not be updated.');
      setUpdatingIssueId(null);
      return;
    }

    setIssues((currentIssues) => currentIssues.map((currentIssue) => (
      currentIssue.id === issue.id
        ? { ...currentIssue, status: 'solved', resolved_at: new Date().toISOString() }
        : currentIssue
    )));
    setUpdatingIssueId(null);
  };

  useEffect(() => {
    void loadIssues();

    if (!villageId) return undefined;

    const channel = supabase
      .channel('admin-issues-overview')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `village_id=eq.${villageId}` },
        loadIssues,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadIssues, villageId]);

  const stats = useMemo(
    () => ({
      urgent: issues.filter((issue) => ['high', 'critical'].includes(normaliseStatus(issue.severity))).length,
      unassigned: issues.filter((issue) => ['waiting_for_internet', 'submitted', 'under_review'].includes(normaliseStatus(issue.status))).length,
      resolved: issues.filter((issue) => ['solved', 'resolved', 'closed'].includes(normaliseStatus(issue.status))).length,
    }),
    [issues],
  );

  const sortedIssues = useMemo(() => {
    const nextIssues = [...issues];
    if (sortBy === 'status') {
      return nextIssues.sort((first, second) => normaliseStatus(first.status).localeCompare(normaliseStatus(second.status)));
    }

    return nextIssues.sort(
      (first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime(),
    );
  }, [issues, sortBy]);

  const weeklyReports = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    const counts = dates.map(() => 0);

    issues.forEach((issue) => {
      const createdAt = new Date(issue.created_at);
      const matchingIndex = dates.findIndex((date) => date.toDateString() === createdAt.toDateString());
      if (matchingIndex !== -1) counts[matchingIndex] += 1;
    });

    return dates.map((date, index) => ({
      label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
      value: counts[index],
    }));
  }, [issues]);

  const maxWeeklyReports = Math.max(1, ...weeklyReports.map((report) => report.value));
  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId);

  return (
    <div className="grid w-full flex-1 grid-cols-1 items-start gap-6 lg:grid-cols-12">
      
      {/* LEFT COLUMN: Expanded to 7 columns (approx 58% width) */}
      <section className="col-span-1 flex min-w-0 flex-col gap-6 font-sans lg:col-span-7 animate-fade-in">
        
        {/* Top 3 Metric Cards */}
        <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-3">
          <article className="flex min-h-48 min-w-0 flex-col rounded-md border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_#fca5a5] transition-transform hover:-translate-y-1 hover:shadow-[6px_10px_0_0_#fca5a5]">
            <h2 className="mb-4 font-serif text-2xl font-medium text-black">URGENT ACTION</h2>
            <div className="flex min-h-0 flex-1 items-end justify-between gap-4">
              <p className="font-serif text-5xl font-black leading-none">{stats.urgent}</p>
              <div className="relative h-14 min-w-0 flex-1 overflow-hidden border-2 border-black bg-[#fca5a5]/30">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000020_1px,transparent_1px),linear-gradient(to_bottom,#00000020_1px,transparent_1px)] bg-size-[10px_10px]" />
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
                <polyline points="0,100 20,80 40,85 60,50 80,40 100,10" fill="none" stroke="black" strokeWidth="3" />
              </svg>
              </div>
            </div>
          </article>

          <article className="flex min-h-48 min-w-0 flex-col rounded-md border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_#fde047] transition-transform hover:-translate-y-1 hover:shadow-[6px_10px_0_0_#fde047]">
            <h2 className="mb-4 font-serif text-2xl font-medium text-black">UNASSIGNED TASKS</h2>
            <div className="flex min-h-0 flex-1 items-end justify-between gap-4">
              <p className="font-serif text-5xl font-black leading-none">{stats.unassigned}</p>
              <div className="flex h-10 min-w-0 flex-1 items-end gap-1">
              <div className="h-full w-1/4 border-2 border-black bg-[#facc15]" />
              <div className="h-3/4 w-1/4 border-2 border-black bg-[#facc15]" />
              <div className="h-1/2 w-1/2 border-b-2 border-dashed border-gray-300" />
              </div>
            </div>
          </article>

          <article className="flex min-h-48 min-w-0 flex-col rounded-md border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_#bef264] transition-transform hover:-translate-y-1 hover:shadow-[6px_10px_0_0_#bef264]">
            <h2 className="mb-4 font-serif text-2xl font-medium text-black">SOLVED ISSUES</h2>
            <div className="flex min-h-0 flex-1 items-end justify-between gap-4">
              <p className="font-serif text-5xl font-black leading-none">{stats.resolved}</p>
              <div className="relative h-14 min-w-0 flex-1 overflow-hidden border-2 border-black bg-[#bef264]/30">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000020_1px,transparent_1px),linear-gradient(to_bottom,#00000020_1px,transparent_1px)] bg-size-[10px_10px]" />
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
                <polyline points="0,100 30,70 50,75 80,30 100,0" fill="none" stroke="black" strokeWidth="3" />
              </svg>
              </div>
            </div>
          </article>
        </div>

        {/* Issue Registry */}
        <section aria-labelledby="issue-registry-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 id="issue-registry-heading" className="font-serif text-3xl font-bold text-black">
              Issue Registry
            </h2>
            <label className="text-sm font-medium text-gray-600">
              Sort by:{' '}
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="border-b border-black bg-transparent font-bold text-black outline-none"
              >
                <option value="recent">Newest</option>
                <option value="status">Status</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="mb-4 flex flex-col items-center justify-center gap-3 border-2 border-black bg-[#fda4af] p-4 text-center text-sm font-bold sm:flex-row sm:justify-between" role="alert">
              <span className="text-center">{error}</span>
              <button type="button" onClick={loadIssues} className="border-2 border-black bg-white px-3 py-1 text-xs uppercase">
                Retry
              </button>
            </div>
          )}

          <div className="overflow-x-auto border-b-2 border-black">
            <table className="w-full min-w-150 text-left" aria-busy={isLoading}>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Reporter</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sortedIssues.map((issue) => (
                  <tr key={issue.id} className="group border-t-2 border-black transition-colors hover:bg-gray-50">
                    <td className="flex items-center gap-4 py-4 pl-4 font-bold text-black">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black bg-[#f22f2f] text-xs" aria-hidden="true">
                        👤
                      </div>
                      {issue.citizen_name || 'Citizen User'}
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-black">{issue.category || 'Uncategorised'}</div>
                      <div className="text-xs text-gray-500">Category</div>
                    </td>
                    <td className="py-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-black">{issue.status || 'pending'}</div>
                      <div className="text-xs text-gray-500">Current Status</div>
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedIssueId(issue.id)}
                        className="border-2 border-black bg-white px-4 py-1.5 text-xs font-bold transition-colors hover:bg-black hover:text-white"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && sortedIssues.length === 0 && (
                  <tr className="border-t-2 border-black">
                    <td colSpan="4" className="py-12 text-center text-sm font-bold uppercase tracking-widest text-gray-500">
                      No issues registered yet.
                    </td>
                  </tr>
                )}
                {isLoading && (
                  <tr className="border-t-2 border-black">
                    <td colSpan="4" className="py-12 text-center text-sm font-bold uppercase tracking-widest text-gray-500">
                      Loading issue registry…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedIssue && (
            <div
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSelectedIssueId(null);
              }}
            >
              <section
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border-[3px] border-black bg-white p-6 shadow-[10px_10px_0_0_#bef264]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="issue-details-heading"
              >
                <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Report details</p>
                    <h3 id="issue-details-heading" className="mt-1 font-serif text-3xl font-black">
                      {selectedIssue.title || selectedIssue.category || 'Citizen report'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedIssueId(null)}
                    className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase hover:bg-black hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-5 py-5 md:grid-cols-[minmax(0,1fr)_14rem]">
                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-500">Description</p>
                      <p className="mt-1 font-medium text-gray-800">{selectedIssue.description || 'No description provided.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Citizen</p>
                        <p className="mt-1 font-bold">{selectedIssue.citizen_name || 'Citizen User'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Category</p>
                        <p className="mt-1 font-bold">{selectedIssue.category || 'Uncategorised'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Status</p>
                        <p className="mt-1 font-bold uppercase">{selectedIssue.status || 'submitted'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Severity</p>
                        <p className="mt-1 font-bold uppercase">{selectedIssue.severity || 'Not provided'}</p>
                      </div>
                    </div>
                    {(selectedIssue.location_name || selectedIssue.latitude) && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Location</p>
                        <p className="mt-1 font-bold">
                          {selectedIssue.location_name || `${selectedIssue.latitude}, ${selectedIssue.longitude}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedIssue.image_url && (
                    <img src={selectedIssue.image_url} alt="Reported issue" className="h-56 w-full border-2 border-black object-cover" />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-black pt-4">
                  <p className="text-xs font-bold text-gray-500">
                    Submitted {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(selectedIssue.created_at))}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleMarkSolved(selectedIssue)}
                    disabled={updatingIssueId === selectedIssue.id || normaliseStatus(selectedIssue.status) === 'solved'}
                    className="border-2 border-black bg-[#bef264] px-4 py-3 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingIssueId === selectedIssue.id
                      ? 'Saving…'
                      : normaliseStatus(selectedIssue.status) === 'solved'
                        ? 'Solved'
                        : 'Mark as solved'}
                  </button>
                </div>
                {actionError && (
                  <p className="mt-4 border-2 border-black bg-[#fda4af] p-3 text-sm font-bold" role="alert">
                    {actionError}
                  </p>
                )}
              </section>
            </div>
          )}
        </section>
      </section>

      {/* RIGHT COLUMN: Reduced to 5 columns (approx 42% width) */}
      <aside className="col-span-1 flex min-w-0 flex-col gap-6 lg:col-span-5">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('heatmap')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') setActiveTab('heatmap');
          }}
          title="Open full heatmap"
          className="flex h-116 cursor-pointer select-none flex-col rounded-md border-2 border-black bg-white p-3 shadow-[6px_6px_0_0_#4ade80] transition-transform hover:-translate-y-0.5"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-black">Live Heatmap</h2>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full border border-black bg-red-500" aria-label="Live updates enabled" />
          </div>
          <div className="pointer-events-none relative z-10 flex-1 overflow-hidden border-2 border-black bg-gray-100">
            <Suspense fallback={<MapLoading />}>
              <Heatmap villageId={villageId} />
            </Suspense>
          </div>
        </div>

        <section className="flex h-115 min-h-0 flex-col rounded-md border-2 border-black bg-white p-5 shadow-[6px_6px_0_0_#3b82f6]">
          <div className="mb-4">
            <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-black">Weekly Reports</h2>
            <p className="text-[10px] font-bold uppercase text-gray-500">Last seven days</p>
          </div>

          <div className="relative flex flex-1 items-end gap-2.5 border-b-2 border-l-2 border-black pb-0 pl-2 pt-4">
            {[25, 50, 75].map((position) => (
              <div key={position} className="absolute left-0 z-0 w-full border-t border-dashed border-gray-300" style={{ top: `${100 - position}%` }} />
            ))}
            {weeklyReports.map((report) => (
              <div
                key={report.label}
                className="group relative z-10 flex-1 border-2 border-black bg-black transition-colors hover:bg-[#3b82f6]"
                style={{ height: `${Math.max(4, (report.value / maxWeeklyReports) * 100)}%` }}
              >
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 border-2 border-black bg-white px-1.5 py-0.5 text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100">
                  {report.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex w-full justify-between px-1 text-[10px] font-black uppercase text-black">
            {weeklyReports.map((report) => (
              <span key={report.label}>{report.label}</span>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};

export default Overview;