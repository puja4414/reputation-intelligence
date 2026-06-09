import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Star, AlertCircle, MessageSquare, Search,
  ArrowUpRight, ArrowDownRight, Users, Zap, Smile
} from 'lucide-react';
import { searchReviews } from '../api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const EMOTION_COLORS = {
  "Satisfied": "#10b981",
  "Excited": "#3b82f6",
  "Frustrated": "#f59e0b",
  "Angry": "#ef4444",
  "Disappointed": "#8b5cf6",
  "Neutral": "#9ca3af"
};

const Dashboard = ({ company, data }: { company: string, data: any }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchReviews(company, searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const { 
    kpis, 
    trends = [], 
    parameters = [], 
    ratings = [], 
    keywords = [], 
    emotions = [] 
  } = data || {};

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Consolidated Rating" 
          value={`${kpis?.avg_rating || "0"} / 5`} 
          subtitle="Parameter-Weighted Score"
          icon={<Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
          trend="+0.2"
          isPositive={true}
        />
        <KPICard 
          title="Sentiment Index" 
          value={kpis?.avg_sentiment?.toFixed(2) || "0.00"} 
          subtitle="Brand Health Vitality"
          icon={<TrendingUp className={`w-6 h-6 ${kpis?.avg_sentiment > 0 ? 'text-green-500' : 'text-red-500'}`} />}
          trend={kpis?.avg_sentiment > 0 ? "+12%" : "-5%"}
          isPositive={kpis?.avg_sentiment > 0}
        />
        <KPICard 
          title="Conflict Ratio" 
          value={`${kpis?.complaint_percentage || "0"}%`} 
          subtitle="Negative Signal Density"
          icon={<AlertCircle className="w-6 h-6 text-red-500" />}
          trend="-2.4%"
          isPositive={true}
        />
        <KPICard 
          title="Data Points" 
          value={kpis?.total_reviews || 0} 
          subtitle="Total Signals Analyzed"
          icon={<Users className="w-6 h-6 text-blue-500" />}
          trend="+156"
          isPositive={true}
        />
      </div>

      {/* 10 Parameter Analysis Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center">
            <Zap className="w-5 h-5 mr-3 text-blue-600" /> Multi-Parameter Intelligence Matrix
          </h3>
          <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-tighter">
            10 Constant Parameters
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Core Parameter</th>
                <th className="px-8 py-5">Positive Signals</th>
                <th className="px-8 py-5">Negative Signals</th>
                <th className="px-8 py-5 text-center">AI Rating</th>
                <th className="px-8 py-5 w-48">Sentiment Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {parameters.map((p: any) => (
                <tr key={p.parameter} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-gray-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                      {p.parameter}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-green-50 text-green-700">
                      +{p.positive}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-red-50 text-red-700">
                      -{p.negative}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`text-sm font-black ${p.rating >= 3.5 ? 'text-green-600' : p.rating >= 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {p.rating} ★
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex h-2 w-full rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                      <div 
                        className="h-full bg-green-500 transition-all duration-1000" 
                        style={{ width: `${(p.positive / (p.positive + p.negative || 1)) * 100}%` }}
                      />
                      <div 
                        className="h-full bg-red-500 transition-all duration-1000" 
                        style={{ width: `${(p.negative / (p.positive + p.negative || 1)) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sentiment Trend */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center">
              <TrendingUp className="w-5 h-5 mr-3 text-blue-600" /> Historical Trend
            </h3>
            <span className="text-[10px] font-black px-3 py-1 bg-gray-100 text-gray-500 rounded-full uppercase">30D Window</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" hide />
                <YAxis domain={[-1, 1]} stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="sentiment" stroke="#3b82f6" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion Intelligence */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
            <Smile className="w-5 h-5 mr-3 text-blue-600" /> Psychological Map
          </h3>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emotions}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="emotion"
                  stroke="none"
                >
                  {emotions.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={(EMOTION_COLORS as any)[entry.emotion] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 pl-8 border-l border-gray-50">
              {emotions.map((e: any) => (
                <div key={e.emotion} className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: (EMOTION_COLORS as any)[e.emotion] }} />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{e.emotion}</span>
                    <span className="text-sm font-black text-gray-700">{e.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Keyword Cloud */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100">
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
          <MessageSquare className="w-5 h-5 mr-3 text-blue-600" /> Semantic Extraction
        </h3>
        <div className="flex flex-wrap gap-4">
          {(keywords || []).map((kw: any, i: number) => (
            <span 
              key={i}
              className="px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl text-xs font-black border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-default uppercase tracking-tight shadow-sm"
              style={{ fontSize: `${Math.max(0.7, Math.min(1.2, kw.value / 2))}rem` }}
            >
              {kw.text}
            </span>
          ))}
        </div>
      </div>

      {/* Deep Dive Search */}
      <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-2xl shadow-gray-100">
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center">
          <Search className="w-5 h-5 mr-3 text-blue-600" /> Signal Investigator
        </h3>
        <form onSubmit={handleSearch} className="flex gap-6 mb-10">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Query specific brand signals (e.g., 'refund', 'delay', 'ui')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-sm"
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest text-xs"
          >
            {isSearching ? "Investigating..." : "Execute Query"}
          </button>
        </form>

        {searchResults && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Signal Count</span>
                <span className="text-2xl font-black text-blue-900">{searchResults.kpis?.count || 0}</span>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Signal Sentiment</span>
                <span className={`text-2xl font-black ${(searchResults.kpis?.avg_sentiment || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(searchResults.kpis?.avg_sentiment || 0) > 0 ? '+' : ''}{searchResults.kpis?.avg_sentiment || 0}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(searchResults.results || []).map((r: any) => (
                <div key={r.id} className="p-6 border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg transition-all bg-white group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-100'}`} />
                      ))}
                    </div>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-wider ${r.sentiment > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {r.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium italic leading-relaxed group-hover:text-gray-900 transition-colors">
                    "{r.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon, trend, isPositive }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
      <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
        {trend}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-gray-900 mb-1">{value}</h4>
      <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
    </div>
  </div>
);

export default Dashboard;
