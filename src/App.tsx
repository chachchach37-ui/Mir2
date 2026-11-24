import React, { useState, useEffect } from 'react';
import { 
  Video, Sparkles, Settings as SettingsIcon, Play, Pause, 
  Download, RefreshCw, Key, Shield, Film, Smartphone, Monitor, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function App() {
  const [hfToken, setHfToken] = useState<string>('');
  const [promptInput, setPromptInput] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  useEffect(() => {
    const savedHf = localStorage.getItem('hf_token');
    if (savedHf) setHfToken(savedHf);
  }, []);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('hf_token', hfToken.trim());
    setIsSettingsOpen(false);
    alert('تم حفظ مفتاح Hugging Face بنجاح!');
  };

  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    if (!hfToken.trim()) {
      setIsSettingsOpen(true);
      setErrorMessage('الرجاء إدخال مفتاح Hugging Face Token (hf_...) في الإعدادات.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    if (resultVideoUrl) {
      URL.revokeObjectURL(resultVideoUrl);
      setResultVideoUrl(null);
    }
    setGenerationStep('جاري الاتصال بخوادم Hugging Face وتوليد الفيديو الحقيقي...');

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptInput,
          hfToken: hfToken.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'فشل توليد الفيديو من الخادم');
      }

      const videoBlob = await res.blob();
      if (videoBlob.size < 1000) {
        throw new Error('الملف المستلم ليس فيديو صالحاً.');
      }

      const videoUrl = URL.createObjectURL(videoBlob);
      setResultVideoUrl(videoUrl);
      setIsGenerating(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ أثناء توليد الفيديو.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none" dir="rtl">
      {/* Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 max-w-2xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">مولد فيديوهات Hugging Face</h1>
            <p className="text-xs text-slate-400">Text-to-Video AI Generator</p>
          </div>
        </div>

        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center transition-all cursor-pointer relative"
          title="الإعدادات ومفتاح API"
        >
          <SettingsIcon className="w-5 h-5" />
          {!hfToken.trim() && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col justify-center space-y-6">
        
        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <span>إعدادات المفتاح الشخصي</span>
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    مفتاح Hugging Face Token (<span className="text-amber-400">مطلوب</span>)
                  </label>
                  <input 
                    type="password"
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    placeholder="hf_..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">احصل على المفتاح مجاناً من حسابك في Hugging Face (Settings &gt; Access Tokens).</p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:opacity-95 text-white font-bold rounded-xl shadow-lg transition-all cursor-pointer text-xs"
                >
                  حفظ المفتاح
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Generator Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>توليد فيديو حقيقي عبر Hugging Face API</span>
            </div>
            <h2 className="text-xl font-bold">ما هو المشهد الذي تريد توليده؟</h2>
            <p className="text-xs text-slate-400">اكتب وصفاً باللغة العربية أو الإنجليزية وسيقوم الخادم بتوليد ملف فيديو MP4</p>
          </div>

          <form onSubmit={handleGenerateVideo} className="space-y-4">
            <div>
              <textarea 
                rows={3}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="مثال: Cinematic shot of a futuristic cyberpunk city in the rain..."
                className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 transition-all resize-none shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">مقاس الفيديو</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${aspectRatio === '9:16' ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'}`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>عمودي (9:16 - تيك توك)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${aspectRatio === '16:9' ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'}`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>أفقي (16:9 - يوتيوب)</span>
                </button>
              </div>
            </div>

            {!hfToken.trim() && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-center justify-between">
                <span>⚠️ يلزم إدخال مفتاح Hugging Face Token في الإعدادات للبدء.</span>
                <button 
                  type="button" 
                  onClick={() => setIsSettingsOpen(true)}
                  className="underline font-bold cursor-pointer"
                >
                  الإعدادات
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 hover:opacity-95 font-bold rounded-xl shadow-lg shadow-amber-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>جاري توليد الفيديو عبر الخادم...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>توليد الفيديو (Hugging Face API)</span>
                </>
              )}
            </button>
          </form>

          {isGenerating && (
            <div className="text-center p-4 bg-slate-950/50 border border-slate-800 rounded-xl animate-pulse space-y-2">
              <p className="text-xs font-medium text-amber-400">{generationStep}</p>
              <p className="text-[10px] text-slate-500">عملية التوليد قد تستغرق 20 إلى 40 ثانية حسب ضغط الخوادم...</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full w-2/3 animate-progress"></div>
              </div>
            </div>
          )}
        </div>

        {/* Video Result Player */}
        {resultVideoUrl && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2 text-amber-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم توليد الفيديو بنجاح</span>
              </h3>
              <a 
                href={resultVideoUrl}
                download="AI_Video.mp4"
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:opacity-90 text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل الفيديو (MP4)</span>
              </a>
            </div>

            <div className={`relative w-full mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 ${aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[480px]' : 'aspect-[16:9]'}`}>
              <video 
                src={resultVideoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
