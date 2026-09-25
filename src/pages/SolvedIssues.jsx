import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

const normalise = (value) => String(value || '').trim().toLowerCase();

const formatDate = (value) => {
  if (!value) return 'Date unavailable';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const SolvedIssues = ({ villageId }) => {
  const [issues, setIssues] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIssues = useCallback(async () => {
    if (!villageId) {
      setError('This administrator does not have a village assigned.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error: queryError } = await supabase
      .from('reports')
      .select('id, category, description, severity, status, created_at, resolved_at, resolution_image_url, resolved_by, village_id')
      .eq('village_id', villageId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (queryError) {
      setError('Solved issues could not be loaded. Check the database policy and try again.');
      setIsLoading(false);
      return;
    }

    setIssues(data || []);
    setError(null);
    setIsLoading(false);
  }, [villageId]);

  useEffect(() => {
    void loadIssues();

    if (!villageId) return undefined;

    const channel = supabase
      .channel('admin-solved-issues')
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

  const solvedIssues = useMemo(() => {
    const searchTerm = normalise(search);

    return issues.filter((issue) => {
      const status = normalise(issue.status);
      const isSolved = ['resolved', 'closed', 'solved'].includes(status);
      const searchableText = `${issue.category || ''} ${issue.description || ''} ${issue.severity || ''}`.toLowerCase();

      return isSolved && (!searchTerm || searchableText.includes(searchTerm));
    });
  }, [issues, search]);

  const resolvedCount = issues.filter((issue) => ['resolved', 'closed', 'solved'].includes(normalise(issue.status))).length;
  return (
    <section className="w-full animate-fade-in font-sans">
      <div className="mb-8 flex flex-col gap-5 border-b-2 border-black pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500">Issue history</p>
          <h2 className="font-serif text-4xl font-black text-black md:text-5xl">Solved Issues</h2>
          <p className="mt-3 max-w-2xl text-sm font-medium text-gray-600">
            Review completed reports from this village and keep a clear record of resolved work.
          </p>
        </div>
        <button
          type="button"
          onClick={loadIssues}
          className="border-2 border-black bg-[#111] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#bef264] transition-transform hover:-translate-y-0.5"
        >
          Refresh
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <article className="border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_#bef264]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Total solved</p>
          <p className="mt-3 font-serif text-5xl font-black">{resolvedCount}</p>
        </article>
        <article className="border-2 border-black bg-white p-6 shadow-[6px_6px_0_0_#fef08a]">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Showing</p>
          <p className="mt-3 font-serif text-5xl font-black">{solvedIssues.length}</p>
        </article>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="font-serif text-2xl font-bold">Completed report registry</h3>
        <label className="flex w-full items-center gap-3 border-2 border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-widest md:max-w-sm">
          Search
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Category or description"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold normal-case tracking-normal text-black outline-none placeholder:text-gray-400"
          />
        </label>
      </div>

      {error && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-[#fda4af] p-4 text-center text-sm font-bold" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadIssues} className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase">
            Retry
          </button>
        </div>
      )}

      <div className="overflow-x-auto border-2 border-black bg-white shadow-[8px_8px_0_0_#000]">
        <table className="w-full min-w-[44rem] text-left" aria-busy={isLoading}>
          <thead className="bg-[#111] text-xs uppercase tracking-widest text-white">
            <tr>
              <th className="px-5 py-4">Category</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Severity</th>
              <th className="px-5 py-4">Resolution image</th>
              <th className="px-5 py-4">Resolved date</th>
              <th className="px-5 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {solvedIssues.map((issue) => (
              <tr key={issue.id} className="border-t-2 border-black align-top hover:bg-lime-50">
                <td className="px-5 py-5 font-black">{issue.category || 'Uncategorised'}</td>
                <td className="max-w-md px-5 py-5 font-medium text-gray-700">{issue.description || 'No description provided.'}</td>
                <td className="px-5 py-5">
                  <span className="border-2 border-black bg-[#bef264] px-2 py-1 text-xs font-black uppercase">
                    {issue.severity || 'Normal'}
                  </span>
                </td>
                <td className="px-5 py-5">
                  {issue.resolution_image_url ? (
                    <img src={issue.resolution_image_url} alt="Resolution" className="h-14 w-20 border-2 border-black object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-gray-500">Unavailable</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-5 font-bold">{formatDate(issue.resolved_at || issue.created_at)}</td>
                <td className="px-5 py-5 text-xs font-black uppercase tracking-widest">{issue.status}</td>
              </tr>
            ))}
            {!isLoading && solvedIssues.length === 0 && (
              <tr>
                <td colSpan="6" className="px-5 py-16 text-center text-sm font-black uppercase tracking-widest text-gray-500">
                  No solved issues found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan="6" className="px-5 py-16 text-center text-sm font-black uppercase tracking-widest text-gray-500">
                  Loading solved issues…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SolvedIssues;