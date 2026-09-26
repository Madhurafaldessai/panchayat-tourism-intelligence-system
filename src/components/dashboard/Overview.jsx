import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';

const Heatmap = lazy(() => import('./Heatmap'));

const MapLoading = () => (
  <div className="flex h-full items-center justify-center bg-gray-100 p-4 text-center text-xs font-bold uppercase tracking-widest">
    Loading map…
  </div>
);

const normaliseStatus = (status) => String(status || '').trim().toLowerCase();
const formatDatabaseTimestamp = (date) => date.toISOString().slice(0, 19).replace('T', ' ');

const getPriorityScore = (issue, frequencyCount = 1) => {
  const severityWeight = { high: 38, medium: 22, low: 12, moderate: 22 };
  const statusWeight = {
    submitted: 12,
    waiting_for_internet: 14,
    under_review: 18,
    in_progress: 22,
    pending: 10,
    action_required: 20,
  };

  const ageInDays = Math.max(0, (Date.now() - new Date(issue.created_at || 0).getTime()) / (1000 * 60 * 60 * 24));

  let recencyWeight = 0;
  if (ageInDays <= 1) recencyWeight = 25;
  else if (ageInDays <= 7) recencyWeight = 18;
  else if (ageInDays <= 30) recencyWeight = 10;
  else if (ageInDays <= 90) recencyWeight = 5;

  const severityPoints = severityWeight[normaliseStatus(issue.severity)] || 15;
  const statusPoints = statusWeight[normaliseStatus(issue.status)] || 8;
  const frequencyPoints = Math.min(25, (frequencyCount - 1) * 10);

  return Math.min(100, severityPoints + recencyWeight + statusPoints + frequencyPoints);
};

const Overview = ({ setActiveTab, villageId, resolvedBy }) => {
  const [issues, setIssues] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [weeklyError, setWeeklyError] = useState(null);
  const [feedbackByReport, setFeedbackByReport] = useState({});
  const [feedbackStatus, setFeedbackStatus] = useState('loading');
  const [feedbackError, setFeedbackError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingIssueId, setUploadingIssueId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const loadWeeklyReports = useCallback(async () => {
    if (!villageId) {
      setWeeklyReports([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });

    const dailyCounts = await Promise.all(dates.map(async (date) => {
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const { count, error: countError } = await supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('village_id', villageId)
        .gte('created_at', formatDatabaseTimestamp(date))
        .lt('created_at', formatDatabaseTimestamp(nextDate));

      return {
        label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date),
        value: count || 0,
        error: countError,
      };
    }));

    const countError = dailyCounts.find((item) => item.error)?.error;
    setWeeklyReports(dailyCounts.map(({ label, value }) => ({ label, value })));
    setWeeklyError(countError?.message || null);
  }, [villageId]);

  const loadIssues = useCallback(async () => {
    if (!villageId) {
      setError('This administrator does not have a village assigned.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void loadWeeklyReports();
    setFeedbackStatus('loading');

    const { data, error: queryError } = await supabase
      .from('reports')
      .select('id, citizen_name, category, title, description, severity, status, image_url, resolution_image_url, location_name, latitude, longitude, created_at, resolved_at, resolved_by')
      .eq('village_id', villageId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (queryError) {
      setError('Issues could not be loaded. Check the database policy and try again.');
      setIsLoading(false);
      setFeedbackStatus('error');
      return;
    }

    const loadedIssues = data || [];
    setIssues(loadedIssues);
    setError(null);
    setIsLoading(false);

    if (loadedIssues.length === 0) {
      setFeedbackByReport({});
      setFeedbackError(null);
      setFeedbackStatus('ready');
      return;
    }

    const { data: additionalImageRows, error: additionalImagesError } = await supabase
      .from('reports')
      .select('id, resolution_image_urls')
      .in('id', loadedIssues.map((issue) => issue.id));

    if (!additionalImagesError) {
      const additionalImagesByIssue = Object.fromEntries(
        (additionalImageRows || []).map((row) => [row.id, row.resolution_image_urls || []]),
      );
      setIssues(loadedIssues.map((issue) => ({
        ...issue,
        resolution_image_urls: additionalImagesByIssue[issue.id] || [],
      })));
    } else {
      setIssues(loadedIssues.map((issue) => ({ ...issue, resolution_image_urls: [] })));
    }

    setFeedbackStatus('loading');
    const { data: feedbackRows, error: feedbackQueryError } = await supabase
      .from('report_feedback')
      .select('report_id, feedback')
      .in('report_id', loadedIssues.map((issue) => issue.id));

    if (feedbackQueryError) {
      setFeedbackByReport({});
      setFeedbackError(feedbackQueryError.message);
      setFeedbackStatus('error');
      return;
    }

    const feedbackSummary = {};
    (feedbackRows || []).forEach((row) => {
      if (!feedbackSummary[row.report_id]) {
        feedbackSummary[row.report_id] = { liked: false, disliked: false };
      }

      if (row.feedback === 'like') feedbackSummary[row.report_id].liked = true;
      if (row.feedback === 'dislike') feedbackSummary[row.report_id].disliked = true;
    });

    setFeedbackByReport(feedbackSummary);
    setFeedbackError(null);
    setFeedbackStatus('ready');
  }, [loadWeeklyReports, villageId]);

  const handleResolutionUpload = async (issue, file, isAdditional = false) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setActionError('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionError('The resolution image must be smaller than 5 MB.');
      return;
    }

    setUploadingIssueId(issue.id);
    setActionError(null);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${villageId}/${issue.id}/resolution-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('issue-images')
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setActionError(uploadError.message || 'The resolution image could not be uploaded.');
      setUploadingIssueId(null);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('issue-images').getPublicUrl(filePath);
    const resolvedAt = new Date().toISOString();
    const additionalImages = issue.resolution_image_urls || [];
    const updateValues = isAdditional
      ? { resolution_image_urls: [...additionalImages, publicUrlData.publicUrl] }
      : {
          status: 'solved',
          resolution_image_url: publicUrlData.publicUrl,
          resolved_at: resolvedAt,
          resolved_by: resolvedBy || 'Village administrator',
        };
    const { error: updateError } = await supabase
      .from('reports')
      .update(updateValues)
      .eq('id', issue.id)
      .eq('village_id', villageId);

    if (updateError) {
      setActionError(updateError.message || 'The report could not be updated.');
      setUploadingIssueId(null);
      return;
    }

    setIssues((currentIssues) => currentIssues.map((currentIssue) => (
      currentIssue.id === issue.id
        ? isAdditional
          ? { ...currentIssue, resolution_image_urls: [...additionalImages, publicUrlData.publicUrl] }
          : { ...currentIssue, status: 'solved', resolution_image_url: publicUrlData.publicUrl, resolved_at: resolvedAt, resolved_by: resolvedBy }
        : currentIssue
    )));
    setUploadingIssueId(null);
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'report_feedback' },
        loadIssues,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadIssues, villageId]);

  const categoryOptions = useMemo(
    () => [...new Set(issues.map((issue) => issue.category).filter(Boolean))].sort((first, second) => first.localeCompare(second)),
    [issues],
  );

  const visibleIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesStatus = statusFilter === 'all' || normaliseStatus(issue.status) === normaliseStatus(statusFilter);
      const matchesCategory = categoryFilter === 'all' || normaliseStatus(issue.category) === normaliseStatus(categoryFilter);
      const matchesSeverity = severityFilter === 'all' || normaliseStatus(issue.severity) === normaliseStatus(severityFilter);

      return matchesStatus && matchesCategory && matchesSeverity;
    });
  }, [categoryFilter, issues, severityFilter, statusFilter]);

  const frequencyMap = useMemo(() => {
    const counts = new Map();

    issues.forEach((issue) => {
      const key = `${issue.category || 'uncategorized'}|${issue.location_name || issue.latitude || 'unknown'}|${issue.longitude || 'unknown'}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return counts;
  }, [issues]);

  const priorityMap = useMemo(() => {
    const nextPriorityMap = {};

    issues.forEach((issue) => {
      const key = `${issue.category || 'uncategorized'}|${issue.location_name || issue.latitude || 'unknown'}|${issue.longitude || 'unknown'}`;
      const frequencyCount = frequencyMap.get(key) || 1;
      nextPriorityMap[issue.id] = getPriorityScore(issue, frequencyCount);
    });

    return nextPriorityMap;
  }, [frequencyMap, issues]);

  const hotspotClusters = useMemo(() => {
    const clusters = new Map();

    issues.forEach((issue) => {
      const latitude = Number(issue.latitude);
      const longitude = Number(issue.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

      const bucketLat = Math.round(latitude / 0.005) * 0.005;
      const bucketLng = Math.round(longitude / 0.005) * 0.005;
      const key = `${bucketLat.toFixed(4)}:${bucketLng.toFixed(4)}`;

      if (!clusters.has(key)) {
        clusters.set(key, { latitude: bucketLat, longitude: bucketLng, count: 0, category: issue.category || 'General issue', maxSeverity: 0 });
      }

      const cluster = clusters.get(key);
      cluster.count += 1;
      const rank = { low: 1, medium: 2, high: 3 }[normaliseStatus(issue.severity)] || 1;
      cluster.maxSeverity = Math.max(cluster.maxSeverity, rank);
      cluster.category = issue.category || cluster.category;
    });

    return [...clusters.values()]
      .sort((first, second) => second.count - first.count)
      .slice(0, 4)
      .map((cluster) => ({
        ...cluster,
        severityLabel: cluster.maxSeverity >= 3 ? 'High' : cluster.maxSeverity === 2 ? 'Medium' : 'Low',
      }));
  }, [issues]);

  const stats = useMemo(
    () => ({
      urgent: visibleIssues.filter((issue) => (priorityMap[issue.id] || 0) >= 70).length,
      unassigned: visibleIssues.filter((issue) => ['waiting_for_internet', 'submitted', 'under_review'].includes(normaliseStatus(issue.status))).length,
      resolved: visibleIssues.filter((issue) => ['solved', 'resolved', 'closed'].includes(normaliseStatus(issue.status))).length,
    }),
    [priorityMap, visibleIssues],
  );

  const sortedIssues = useMemo(() => {
    const nextIssues = [...visibleIssues];

    if (sortBy === 'status') {
      return nextIssues.sort((first, second) => normaliseStatus(first.status).localeCompare(normaliseStatus(second.status)));
    }

    if (sortBy === 'priority') {
      return nextIssues.sort((first, second) => (priorityMap[second.id] || 0) - (priorityMap[first.id] || 0));
    }

    return nextIssues.sort(
      (first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime(),
    );
  }, [priorityMap, sortBy, visibleIssues]);

  const maxWeeklyReports = Math.max(1, ...weeklyReports.map((report) => report.value));

  const selectedIssue = issues.find((issue) => issue.id === selectedIssueId);
  const selectedFeedback = selectedIssue
    ? feedbackByReport[selectedIssue.id] || { liked: false, disliked: false }
    : null;

  return (
    <div className="grid w-full flex-1 grid-cols-1 items-start gap-6 lg:h-full lg:min-h-0 lg:grid-cols-12">
      <section className="col-span-1 flex min-w-0 flex-col gap-6 font-sans lg:col-span-7 lg:min-h-0 animate-fade-in">
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

        <section className="flex flex-col lg:min-h-0 lg:flex-1" aria-labelledby="issue-registry-heading">
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
                <option value="priority">Priority</option>
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

          <div className="mb-6 space-y-4 border-2 border-black bg-[#f5f5f5] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <label className="min-w-[160px] text-xs font-black uppercase tracking-[0.12em] text-gray-700">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 w-full border-2 border-black bg-white px-3 py-2 text-sm font-medium text-black outline-none"
                >
                  <option value="all">All</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under review</option>
                  <option value="in_progress">In progress</option>
                  <option value="solved">Solved</option>
                </select>
              </label>

              <label className="min-w-[160px] text-xs font-black uppercase tracking-[0.12em] text-gray-700">
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="mt-1 w-full border-2 border-black bg-white px-3 py-2 text-sm font-medium text-black outline-none"
                >
                  <option value="all">All</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label className="min-w-[160px] text-xs font-black uppercase tracking-[0.12em] text-gray-700">
                Severity
                <select
                  value={severityFilter}
                  onChange={(event) => setSeverityFilter(event.target.value)}
                  className="mt-1 w-full border-2 border-black bg-white px-3 py-2 text-sm font-medium text-black outline-none"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setSeverityFilter('all');
                }}
                className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-black transition-colors hover:bg-black hover:text-white"
              >
                Reset filters
              </button>
            </div>
          </div>

          <div className="mb-6 border-2 border-black bg-[#f5f5f5] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-[0.12em] text-gray-700">Hotspot clusters</h3>
              <span className="text-[10px] font-bold uppercase text-gray-500">Top areas</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {hotspotClusters.length === 0 ? (
                <p className="text-sm font-bold text-gray-500 md:col-span-2 xl:col-span-4">No clustering data yet.</p>
              ) : (
                hotspotClusters.map((cluster) => (
                  <div key={`${cluster.latitude}-${cluster.longitude}`} className="border-2 border-black bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600">{cluster.category}</span>
                      <span className="border border-black bg-[#fef08a] px-1.5 py-0.5 text-[10px] font-black uppercase">{cluster.severityLabel}</span>
                    </div>
                    <p className="font-serif text-2xl font-black leading-none">{cluster.count}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">Reports clustered</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-700">
              Showing {sortedIssues.length} of {issues.length} reports
            </p>
          </div>

          <div className="overflow-hidden border-b-2 border-black">
            <table className="w-full min-w-150 text-left" aria-busy={isLoading}>
              <thead className="sticky top-0 z-10 bg-[#111] text-left text-xs uppercase tracking-widest text-white">
                <tr>
                  <th scope="col" className="px-4 py-3">Reporter</th>
                  <th scope="col" className="px-4 py-3">Category</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Action</th>
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
                      <div className="mt-2 inline-flex border-2 border-black bg-[#fef08a] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-black">
                        Priority {priorityMap[issue.id] || 0}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">Current Status</div>
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
              className="fixed inset-0 z-2000 flex items-center justify-center bg-black/60 p-4"
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

                  <div className="space-y-3">
                    {selectedIssue.image_url && (
                      <div>
                        <p className="mb-1 text-xs font-black uppercase tracking-widest text-gray-500">Citizen image</p>
                        <button
                          type="button"
                          onClick={() => setSelectedImage(selectedIssue.image_url)}
                          className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
                          aria-label="View citizen image"
                        >
                          <img src={selectedIssue.image_url} alt="Reported issue" className="h-40 w-full border-2 border-black object-cover" />
                        </button>
                      </div>
                    )}
                    {selectedIssue.resolution_image_url && (
                      <div>
                        <p className="mb-1 text-xs font-black uppercase tracking-widest text-gray-500">Resolution image</p>
                        <div className="relative">
                          <img src={selectedIssue.resolution_image_url} alt="Resolved issue" className="h-40 w-full border-2 border-black object-cover" />
                          {feedbackStatus === 'ready' && (selectedFeedback.liked || selectedFeedback.disliked) && (
                            <div className="absolute right-2 top-2 flex gap-1" aria-label="Citizen feedback">
                              {selectedFeedback.liked && <span className="rounded bg-white/95 px-2 py-1 text-xl" role="img" aria-label="Liked">👍</span>}
                              {selectedFeedback.disliked && <span className="rounded bg-white/95 px-2 py-1 text-xl" role="img" aria-label="Disliked">👎</span>}
                            </div>
                          )}
                        </div>
                        {(selectedIssue.resolution_image_urls || []).map((imageUrl, index) => (
                          <div key={`${selectedIssue.id}-resolution-${index}`} className="relative mt-3">
                            <img src={imageUrl} alt={`Additional resolution image ${index + 1}`} className="h-40 w-full border-2 border-black object-cover" />
                            {feedbackStatus === 'ready' && (selectedFeedback.liked || selectedFeedback.disliked) && (
                              <div className="absolute right-2 top-2 flex gap-1" aria-label="Citizen feedback">
                                {selectedFeedback.liked && <span className="rounded bg-white/95 px-2 py-1 text-xl" role="img" aria-label="Liked">👍</span>}
                                {selectedFeedback.disliked && <span className="rounded bg-white/95 px-2 py-1 text-xl" role="img" aria-label="Disliked">👎</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {feedbackStatus === 'error' && (
                      <p className="border border-red-700 bg-red-50 p-2 text-xs font-bold text-red-800" role="status">
                        Feedback could not be loaded: {feedbackError || 'check the report_feedback read policy.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-black pt-4">
                  <p className="text-xs font-bold text-gray-500">
                    Submitted {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(selectedIssue.created_at))}
                  </p>
                  {(!selectedIssue.resolution_image_url || (feedbackStatus === 'ready' && selectedFeedback.disliked)) && (
                    <>
                      <label
                        htmlFor={`resolution-image-${selectedIssue.id}`}
                        className="cursor-pointer border-2 border-black bg-[#bef264] px-4 py-3 text-xs font-black uppercase tracking-widest shadow-[4px_4px_0_0_#000] transition-transform hover:-translate-y-0.5"
                      >
                        {uploadingIssueId === selectedIssue.id
                          ? 'Uploading…'
                          : selectedIssue.resolution_image_url
                            ? 'Add another image'
                            : 'Upload solved image'}
                      </label>
                      <input
                        id={`resolution-image-${selectedIssue.id}`}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        disabled={uploadingIssueId === selectedIssue.id || feedbackStatus === 'loading'}
                        onChange={(event) => {
                          void handleResolutionUpload(selectedIssue, event.target.files?.[0], Boolean(selectedIssue.resolution_image_url));
                          event.target.value = '';
                        }}
                      />
                    </>
                  )}
                </div>
                {actionError && (
                  <p className="mt-4 border-2 border-black bg-[#fda4af] p-3 text-sm font-bold" role="alert">
                    {actionError}
                  </p>
                )}
              </section>
              {selectedImage && (
                <div
                  className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-4"
                  role="presentation"
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setSelectedImage(null);
                  }}
                >
                  <section
                    className="relative max-h-[90vh] max-w-[min(90vw,72rem)] border-2 border-black bg-white p-3 shadow-[8px_8px_0_0_#bef264]"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Citizen image preview"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute right-5 top-5 border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase shadow-[2px_2px_0_0_#000] hover:bg-black hover:text-white"
                    >
                      Close
                    </button>
                    <img src={selectedImage} alt="Citizen uploaded report" className="max-h-[calc(90vh-1.5rem)] max-w-full object-contain" />
                  </section>
                </div>
              )}
            </div>
          )}
        </section>
      </section>

      <aside className="col-span-1 flex min-w-0 flex-col gap-6 lg:sticky lg:top-6 lg:col-span-5 lg:self-start">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('heatmap')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') setActiveTab('heatmap');
          }}
          title="Open full heatmap"
          className="flex h-116 cursor-pointer select-none flex-col overflow-hidden rounded-md border-2 border-black bg-white p-3 shadow-[6px_6px_0_0_#4ade80] transition-transform hover:-translate-y-0.5"
        >
          <div className="mb-8 flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-widest text-black">Live Heatmap</h2>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full border border-black bg-red-500" aria-label="Live updates enabled" />
          </div>
          <div className="pointer-events-none relative z-10 min-h-0 flex-1 overflow-hidden border-2 border-black bg-gray-100">
            <Suspense fallback={<MapLoading />}>
              <Heatmap villageId={villageId} />
            </Suspense>
          </div>
        </div>

        <section className="flex h-116 min-h-0 flex-col overflow-hidden rounded-md border-2 border-black bg-white p-5 shadow-[6px_6px_0_0_#3b82f6]">
          <div className="mb-8 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-black">Weekly Reports</h2>
              <p className="text-[10px] font-bold uppercase text-gray-500">Last seven days</p>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1 border-b-2 border-l-2 border-black">
              {[25, 50, 75].map((position) => (
                <div key={position} className="absolute left-0 z-0 w-full border-t border-dashed border-gray-300" style={{ top: `${100 - position}%` }} />
              ))}
              <div className="absolute inset-0 z-10 flex items-end gap-2 px-2">
                {weeklyReports.map((report) => (
                  <div key={report.label} className="flex h-full min-w-0 flex-1 items-end">
                    <div
                      className="w-full border-2 border-black bg-black transition-colors hover:bg-[#3b82f6]"
                      style={{ height: `${report.value === 0 ? 2 : Math.max(6, (report.value / maxWeeklyReports) * 100)}%` }}
                      title={`${report.label}: ${report.value} reports`}
                      aria-label={`${report.label}: ${report.value} reports`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-2 pl-2">
              {weeklyReports.map((report) => (
                <span key={report.label} className="min-w-0 flex-1 text-center text-[10px] font-black uppercase text-black">
                  {report.label}
                </span>
              ))}
            </div>
          </div>
          {weeklyError && <p className="mt-2 text-xs font-bold text-red-700">Weekly counts unavailable: {weeklyError}</p>}
        </section>
      </aside>
    </div>
  );
};

export default Overview;