import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Award, Flame, Heart, BookOpen, CheckCircle, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { DailyIbadahRecord, FardhuRecord } from '../types';
import { getChartData, getFaithStatus, FAITH_QUOTES } from '../utils/faithScoring';

interface FaithChartsProps {
  records: Record<string, DailyIbadahRecord>;
  todayRecord: DailyIbadahRecord;
}

export const FaithCharts: React.FC<FaithChartsProps> = ({ records, todayRecord }) => {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);
  const [chartType, setChartType] = useState<'trend' | 'composition'>('trend');

  const chartData = getChartData(records, timeRange);

  // Compute stats
  const todayScore = todayRecord.faithScore;
  const status = getFaithStatus(todayScore);

  const scores = chartData.map((d) => d.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));

  // Compute streak (consecutive days with score >= 50)
  let streak = 0;
  for (let i = chartData.length - 1; i >= 0; i--) {
    if (chartData[i].score >= 50) streak++;
    else break;
  }

  // Quote of the day (stable based on date)
  const quoteIndex = new Date().getDate() % FAITH_QUOTES.length;
  const currentQuote = FAITH_QUOTES[quoteIndex];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Score */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Skor Hari Ini
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
              {todayScore}%
            </span>
          </div>
          <div className="mt-2">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${status.badgeClass}`}
            >
              {status.title}
            </span>
          </div>
        </div>

        {/* Weekly Average */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Rata-Rata {timeRange} Hari
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
              {avgScore}%
            </span>
          </div>
          <p className="mt-2 text-xs text-stone-500 font-medium">
            {avgScore >= 70 ? 'Ibadah konsisten terjaga' : 'Terus optimalkan amalan'}
          </p>
        </div>

        {/* Streak Istiqomah */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Hari Istiqomah
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
              {streak}
            </span>
            <span className="text-xs font-medium text-stone-500">hari berturut-turut</span>
          </div>
          <p className="mt-2 text-xs text-amber-700 font-medium">
            Alhamdulillah konsisten
          </p>
        </div>

        {/* Fardhu Completed Today */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Sholat Fardhu
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
              {(Object.values(todayRecord.fardhu) as FardhuRecord[]).filter((f) => f.completed).length}/5
            </span>
            <span className="text-xs font-medium text-stone-500">waktu</span>
          </div>
          <p className="mt-2 text-xs text-stone-500 font-medium">
            {(Object.values(todayRecord.fardhu) as FardhuRecord[]).filter((f) => f.status === 'jamaah_masjid').length} berjamaah di masjid
          </p>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
              <span>Visualisasi Grafik Keimanan Interaktif</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Grafik naik-turunnya ibadah sebagai pengingat & motivasi tazkiyatun nafs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Chart Type Selector */}
            <div className="inline-flex bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setChartType('trend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  chartType === 'trend'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Tren Total</span>
              </button>
              <button
                onClick={() => setChartType('composition')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  chartType === 'composition'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Komposisi</span>
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="inline-flex bg-stone-100 p-1 rounded-xl">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timeRange === days
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {days} Hari
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="mt-6 h-72 sm:h-80 w-full">
          {chartType === 'trend' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="faithGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="dayName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs space-y-1 border border-stone-800">
                          <div className="font-bold text-emerald-300">{data.dayName}</div>
                          <div className="text-base font-extrabold text-white">
                            Skor Keimanan: {data.score}%
                          </div>
                          <div className="pt-1 border-t border-stone-700/60 text-stone-300 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                            <span>Fardhu: {data.fardhu}/45</span>
                            <span>Sunnah: {data.sunnah}/20</span>
                            <span>Al-Qur'an: {data.quran}/15</span>
                            <span>Dzikir: {data.dzikir}/10</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#047857"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#faithGradient)"
                  dot={{ r: 4, fill: '#047857', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="dayName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs space-y-1">
                          <div className="font-bold text-amber-300">{d.dayName}</div>
                          <div>Skor Total: {d.score}%</div>
                          <div className="pt-1 border-t border-stone-700 text-stone-300 space-y-0.5 text-[11px]">
                            <div className="text-emerald-300">Sholat Fardhu: {d.fardhu} poin</div>
                            <div className="text-teal-300">Sholat Sunnah: {d.sunnah} poin</div>
                            <div className="text-sky-300">Tilawah Qur'an: {d.quran} poin</div>
                            <div className="text-amber-300">Dzikir & Doa: {d.dzikir} poin</div>
                            <div className="text-rose-300">Amal Shalih: {d.amal} poin</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar dataKey="fardhu" name="Fardhu" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                <Bar dataKey="sunnah" name="Sunnah" stackId="a" fill="#0d9488" />
                <Bar dataKey="quran" name="Al-Qur'an" stackId="a" fill="#0284c7" />
                <Bar dataKey="dzikir" name="Dzikir" stackId="a" fill="#d97706" />
                <Bar dataKey="amal" name="Amal" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Hadith / Reflection */}
        <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="font-arabic text-lg sm:text-xl text-emerald-900 font-bold leading-relaxed">
              {currentQuote.arabic}
            </div>
            <p className="text-xs text-stone-700 italic">
              "{currentQuote.indonesian}"
            </p>
            <span className="text-[11px] font-semibold text-stone-400">
              — {currentQuote.source}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
