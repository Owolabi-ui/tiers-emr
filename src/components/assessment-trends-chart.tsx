'use client';

import { useMemo } from 'react';
import { AssessmentTrendData } from '@/lib/psychology';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AssessmentTrendsChartProps {
  data: AssessmentTrendData[];
  title: string;
  maxScore: number;
  type: 'phq9' | 'gad7';
}

export function AssessmentTrendsChart({ data, title, maxScore, type }: AssessmentTrendsChartProps) {
  const { chartData, trend, latestScore, previousScore } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], trend: 'stable', latestScore: null, previousScore: null };
    }

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const latest = sorted[sorted.length - 1];
    const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    let trendDirection: 'improving' | 'worsening' | 'stable' = 'stable';
    if (previous) {
      if (latest.score < previous.score) trendDirection = 'improving';
      else if (latest.score > previous.score) trendDirection = 'worsening';
    }

    return {
      chartData: sorted,
      trend: trendDirection,
      latestScore: latest.score,
      previousScore: previous?.score || null,
    };
  }, [data]);

  const getSeverityThresholds = () => {
    if (type === 'phq9') {
      return [
        { value: 4, label: 'Minimal', color: 'bg-green-500' },
        { value: 9, label: 'Mild', color: 'bg-yellow-500' },
        { value: 14, label: 'Moderate', color: 'bg-orange-500' },
        { value: 19, label: 'Mod. Severe', color: 'bg-red-400' },
        { value: 27, label: 'Severe', color: 'bg-red-600' },
      ];
    } else {
      return [
        { value: 4, label: 'Minimal', color: 'bg-green-500' },
        { value: 9, label: 'Mild', color: 'bg-yellow-500' },
        { value: 14, label: 'Moderate', color: 'bg-orange-500' },
        { value: 21, label: 'Severe', color: 'bg-red-600' },
      ];
    }
  };

  const thresholds = getSeverityThresholds();

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No assessment data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="flex items-center gap-4">
          {previousScore !== null && latestScore !== null && (
            <div className="flex items-center gap-2">
              {trend === 'improving' && (
                <>
                  <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Improving (-{previousScore - latestScore})
                  </span>
                </>
              )}
              {trend === 'worsening' && (
                <>
                  <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Worsening (+{latestScore - previousScore})
                  </span>
                </>
              )}
              {trend === 'stable' && (
                <>
                  <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Stable
                  </span>
                </>
              )}
            </div>
          )}
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{latestScore}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Latest Score</div>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-64 mb-4">
        {/* Y-axis labels and threshold lines */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
          {[maxScore, Math.floor(maxScore * 0.75), Math.floor(maxScore * 0.5), Math.floor(maxScore * 0.25), 0].map((val, i) => (
            <div key={i} className="text-right pr-2">{val}</div>
          ))}
        </div>

        {/* Chart grid and threshold zones */}
        <div className="absolute left-14 right-0 top-0 bottom-0">
          {/* Threshold zones */}
          {thresholds.map((threshold, i) => {
            const prevValue = i > 0 ? thresholds[i - 1].value : 0;
            const height = ((threshold.value - prevValue) / maxScore) * 100;
            const bottom = (prevValue / maxScore) * 100;
            
            return (
              <div
                key={i}
                className="absolute left-0 right-0 opacity-10"
                style={{
                  bottom: `${bottom}%`,
                  height: `${height}%`,
                }}
              >
                <div className={`h-full ${threshold.color}`} />
              </div>
            );
          })}

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700"
              style={{ bottom: `${percent}%` }}
            />
          ))}

          {/* Line chart */}
          <svg className="absolute inset-0 w-full h-full overflow-visible">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            {chartData.length > 1 && (
              <path
                d={`M 0,${256 - (chartData[0].score / maxScore) * 256} ${chartData.map((point, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 256 - (point.score / maxScore) * 256;
                  return `L ${x}%,${y}`;
                }).join(' ')} L 100%,256 L 0,256 Z`}
                fill="url(#lineGradient)"
              />
            )}

            {/* Line */}
            {chartData.length > 1 && (
              <polyline
                points={chartData.map((point, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 100 - (point.score / maxScore) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2"
                className="drop-shadow-sm"
              />
            )}

            {/* Data points */}
            {chartData.map((point, i) => {
              const x = chartData.length === 1 ? 50 : (i / (chartData.length - 1)) * 100;
              const y = 100 - (point.score / maxScore) * 100;
              
              return (
                <g key={i}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="rgb(99, 102, 241)"
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${new Date(point.date).toLocaleDateString()}: ${point.score} (${point.severity})`}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* X-axis (dates) */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-14">
        {chartData.length > 0 && (
          <>
            <div>{new Date(chartData[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
            {chartData.length > 2 && (
              <div className="hidden sm:block">
                {new Date(chartData[Math.floor(chartData.length / 2)].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
            {chartData.length > 1 && (
              <div>{new Date(chartData[chartData.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3">
        {thresholds.map((threshold, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${threshold.color}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">{threshold.label}</span>
          </div>
        ))}
      </div>

      {/* Data table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...chartData].reverse().map((point, i) => (
              <tr key={i} className="text-sm">
                <td className="px-3 py-2 text-gray-900 dark:text-white">
                  {new Date(point.date).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                  {point.score}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    point.severity === 'Minimal' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    point.severity === 'Mild' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    point.severity === 'Moderate' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {point.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
