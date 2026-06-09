import React, { useState, useEffect } from 'react';
import { getAnalytics, uploadDataset, getAvailableCompanies } from './api';
import Dashboard from './components/Dashboard';
import { Search, Loader2, Zap, Upload, Plus, X } from 'lucide-react';

function App() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [compareCompany, setCompareCompany] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploadLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchData();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (compareCompany) {
      fetchCompareData();
    } else {
      setCompareData(null);
    }
  }, [compareCompany]);

  const fetchCompanies = async () => {
    try {
      const list = await getAvailableCompanies();
      const validList = Array.isArray(list) ? list : [];
      setCompanies(validList);
      if (!selectedCompany && validList.length > 0) {
        setSelectedCompany(validList[0]);
      }
    } catch (err) {
      console.error("Failed to fetch companies");
      setCompanies([]);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAnalytics(selectedCompany);
      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err) {
      setError("Failed to fetch analytics. Please check if the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompareData = async () => {
    if (!compareCompany) {
      setCompareData(null);
      return;
    }
    try {
      const result = await getAnalytics(compareCompany);
      setCompareData(result);
    } catch (err) {
      console.error("Failed to fetch comparison data");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName || !uploadFile) return;

    setIsUploadLoading(true);
    try {
      await uploadDataset(uploadName, uploadFile);
      await fetchCompanies();
      setSelectedCompany(uploadName);
      setIsUploadModalOpen(false);
      setUploadName("");
      setUploadFile(null);
    } catch (err: any) {
      alert(err.message || "Upload failed. Please ensure CSV has a 'review_text' column.");
    } finally {
      setIsUploadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">
                  Reputation <span className="text-blue-600">Intelligence</span>
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                  Multi-Parameter Brand Analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-gray-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Dataset</span>
              </button>

              <div className="h-10 w-px bg-gray-200" />

              <div className="flex flex-col items-end">
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Select Entity</span>
                <select 
                  className="bg-gray-100 border-gray-200 rounded-xl text-xs font-black px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none shadow-sm"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                >
                  {(companies || []).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[9px] text-blue-600 font-black uppercase tracking-widest mb-1.5">Benchmarking</span>
                <select 
                  className="bg-blue-50 border-blue-100 rounded-xl text-xs font-black px-4 py-2 text-blue-700 focus:ring-2 focus:ring-blue-500 cursor-pointer outline-none shadow-sm"
                  value={compareCompany || ""}
                  onChange={(e) => setCompareCompany(e.target.value || null)}
                >
                  <option value="">Compare Off</option>
                  {(companies || []).filter(c => c !== selectedCompany).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-black uppercase tracking-widest text-gray-900 flex items-center">
                <Upload className="w-5 h-5 mr-3 text-blue-600" /> New Intelligence Node
              </h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Entity Identity (Name)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MyCompany"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Dataset Source (CSV)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    required
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="px-5 py-8 border-2 border-dashed border-gray-200 rounded-3xl text-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-all">
                    <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3 group-hover:text-blue-500" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      {uploadFile ? uploadFile.name : "Select CSV Signal Data"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Required Columns:</p>
                  <div className="flex flex-wrap gap-2">
                    {['review_text', 'rating', 'review_date', 'company_name'].map(col => (
                      <span key={col} className="px-2 py-1 bg-white border border-gray-200 rounded-md text-[8px] font-bold text-gray-500">{col}</span>
                    ))}
                  </div>
                  <p className="mt-2 text-[8px] text-gray-400 italic leading-tight">
                    * Supports standardized format with order_id, product_name, etc.
                  </p>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isUploading}
                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest text-xs"
              >
                {isUploading ? "Integrating Signals..." : "Initialize Analytics Node"}
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
              <Search className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-500 font-black uppercase tracking-widest text-sm">Quantifying Reputation...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-100 text-red-700 px-8 py-6 rounded-2xl flex items-center justify-center shadow-lg shadow-red-50">
            <p className="font-black uppercase tracking-wider">{error}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {compareData && (
              <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-2xl shadow-blue-200 animate-in slide-in-from-top duration-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Zap className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-xl font-black mb-8 flex items-center uppercase tracking-wider">
                    <Zap className="w-6 h-6 mr-3 fill-white" /> Intelligence Benchmarking: {selectedCompany} vs {compareCompany}
                  </h2>
                  <div className="grid grid-cols-3 gap-12 text-center">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                      <p className="text-[10px] text-blue-100 font-black uppercase tracking-[0.2em] mb-3">Sentiment Index</p>
                      <div className="flex justify-center items-center space-x-6">
                        <span className="text-4xl font-black tracking-tighter">{data.kpis.avg_sentiment.toFixed(2)}</span>
                        <div className="h-8 w-px bg-white/30" />
                        <span className="text-4xl font-black tracking-tighter opacity-60">{compareData.kpis.avg_sentiment.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                      <p className="text-[10px] text-blue-100 font-black uppercase tracking-[0.2em] mb-3">Rating Score</p>
                      <div className="flex justify-center items-center space-x-6">
                        <span className="text-4xl font-black tracking-tighter">{data.kpis.avg_rating}★</span>
                        <div className="h-8 w-px bg-white/30" />
                        <span className="text-4xl font-black tracking-tighter opacity-60">{compareData.kpis.avg_rating}★</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                      <p className="text-[10px] text-blue-100 font-black uppercase tracking-[0.2em] mb-3">Conflict Rate</p>
                      <div className="flex justify-center items-center space-x-6">
                        <span className="text-4xl font-black tracking-tighter">{data.kpis.complaint_percentage}%</span>
                        <div className="h-8 w-px bg-white/30" />
                        <span className="text-4xl font-black tracking-tighter opacity-60">{compareData.kpis.complaint_percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <Dashboard company={selectedCompany} data={data} />
          </div>
        )}
      </main>
      
      <footer className="py-8 border-t border-gray-200 mt-12 text-center text-gray-500 text-sm">
        <p>&copy; 2026 Reputation Intelligence Dashboard</p>
      </footer>
    </div>
  );
}

export default App;
