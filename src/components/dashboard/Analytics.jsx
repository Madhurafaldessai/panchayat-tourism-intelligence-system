import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CATEGORY_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#eab308', '#a855f7', '#ec4899', '#64748b', '#14b8a6'];
const formatCategory = (category) => category.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const getDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const Analytics = ({ villageId }) => {
  const [issues, setIssues] = useState([]);
  const [daysWindow, setDaysWindow] = useState(7);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIssues = useCallback(async () => {
    if (!villageId) {
      setIssues([]);
      setError('This administrator does not have a village assigned.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (daysWindow - 1));

    const { data, error: queryError } = await supabase
      .from('reports')
      .select('id, category, created_at')
      .eq('village_id', villageId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(1000);

    if (queryError) {
      setIssues([]);
      setError('Analytics data could not be loaded. Check the reports table policy and try again.');
      setIsLoading(false);
      return;
    }

    setIssues(data || []);
    setError(null);
    setIsLoading(false);
  }, [daysWindow, villageId]);

  useEffect(() => {
    queueMicrotask(() => void fetchIssues());

    if (!villageId) return undefined;

    const channel = supabase
      .channel('admin-analytics')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `village_id=eq.${villageId}` },
        fetchIssues,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIssues, villageId]);

  const dates = useMemo(() => Array.from({ length: daysWindow }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (daysWindow - index - 1));
    return date;
  }), [daysWindow]);

  const categories = useMemo(() => [...new Set(
    issues.map((issue) => String(issue.category || 'Other').trim() || 'Other'),
  )].sort((first, second) => first.localeCompare(second)), [issues]);

  const activeCategories = selectedCategory === 'ALL'
    ? categories
    : categories.filter((category) => category === selectedCategory);

  const visibleIssues = selectedCategory === 'ALL'
    ? issues
    : issues.filter((issue) => (String(issue.category || 'Other').trim() || 'Other') === selectedCategory);

  const chartData = useMemo(() => ({
    labels: dates.map((date) => new Intl.DateTimeFormat('en-IN', { month: 'short', day: 'numeric' }).format(date)),
    datasets: activeCategories.map((category, index) => {
      const countsByDate = new Map(dates.map((date) => [getDateKey(date), 0]));
      issues.forEach((issue) => {
        const issueCategory = String(issue.category || 'Other').trim() || 'Other';
        if (issueCategory !== category) return;

        const issueDate = new Date(issue.created_at);
        if (Number.isNaN(issueDate.getTime())) return;
        const dateKey = getDateKey(issueDate);
        if (countsByDate.has(dateKey)) countsByDate.set(dateKey, countsByDate.get(dateKey) + 1);
      });

      const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      return {
        label: formatCategory(category),
        data: dates.map((date) => countsByDate.get(getDateKey(date))),
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 3,
        pointRadius: dates.length > 14 ? 2 : 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#000',
        pointBorderColor: color,
        pointBorderWidth: 2,
        tension: 0.2,
        fill: selectedCategory !== 'ALL',
      };
    }),
  }), [activeCategories, dates, issues, selectedCategory]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: selectedCategory === 'ALL' && activeCategories.length > 0,
        position: 'top',
        labels: { font: { family: 'monospace', weight: 'bold', size: 11 }, color: '#000', usePointStyle: true },
      },
      tooltip: {
        backgroundColor: '#000',
        titleFont: { family: 'monospace', size: 12 },
        bodyFont: { family: 'monospace', size: 12 },
        padding: 10,
        borderColor: '#000',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { autoSkip: true, maxTicksLimit: 10, font: { family: 'monospace', size: 10 }, color: '#000' },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, stepSize: 1, font: { family: 'monospace', size: 10 }, color: '#000' },
        grid: { color: '#e5e7eb', borderDash: [5, 5] },
      },
    },
  }), [activeCategories.length, selectedCategory]);

  const handleCategoryToggle = (category) => {
    setSelectedCategory((current) => (current === category ? 'ALL' : category));
  };

  return (
    <section className="mt-8 w-full border-2 border-black bg-white p-6 shadow-[8px_8px_0_0_#3b82f6]">
      <div className="mb-6 flex flex-col gap-4 border-b-2 border-black pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-600">Analytics</p>
          <h2 className="mt-1 font-serif text-2xl font-black uppercase text-black">Time-series telemetry &amp; trends</h2>
          <p className="mt-1 text-xs font-mono text-gray-600">Real-time multi-category incident frequency tracking</p>
        </div>
        <div className="flex w-fit items-center gap-1 border-2 border-black bg-[#f4f4f0] p-1" aria-label="Date range">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setDaysWindow(days)}
              aria-pressed={daysWindow === days}
              className={`px-3 py-1 text-xs font-mono font-bold transition-colors ${daysWindow === days ? 'bg-black text-white' : 'text-black hover:bg-gray-200'}`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          aria-pressed={selectedCategory === 'ALL'}
          className={`border-2 border-black px-3 py-1.5 text-xs font-mono font-bold transition-colors ${selectedCategory === 'ALL' ? 'bg-black text-white shadow-[2px_2px_0_0_#2563eb]' : 'bg-white text-black hover:bg-gray-100'}`}
        >
          ALL CATEGORIES
        </button>
        {categories.map((category, index) => (
          <button
            key={category}
            type="button"
            onClick={() => handleCategoryToggle(category)}
            aria-pressed={selectedCategory === category}
            className={`flex items-center gap-1.5 border-2 border-black px-3 py-1.5 text-xs font-mono font-bold transition-colors ${selectedCategory === category ? 'bg-black text-white shadow-[2px_2px_0_0_#2563eb]' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <span className="inline-block h-2.5 w-2.5 border border-black" style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
            {formatCategory(category).toUpperCase()}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-[#fda4af] p-3 text-sm font-bold" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchIssues()} className="border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase">Retry</button>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">
        <span>Last {daysWindow} days</span>
        <span>{visibleIssues.length} {visibleIssues.length === 1 ? 'report' : 'reports'}</span>
      </div>
      <div className="h-72 w-full pt-2" aria-busy={isLoading}>
        {isLoading ? (
          <div className="flex h-full items-center justify-center border-y border-dashed border-gray-300 font-mono text-xs uppercase tracking-widest text-gray-500" role="status">
            Loading telemetry stream…
          </div>
        ) : visibleIssues.length === 0 ? (
          <div className="flex h-full items-center justify-center border-y border-dashed border-gray-300 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
            No reports for this selection and date range.
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </section>
  );
};

export default Analytics;
