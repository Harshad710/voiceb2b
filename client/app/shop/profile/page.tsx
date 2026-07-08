export default function ProfilePlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-144px)]">
      <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-[80%] mx-auto">
        <div className="w-16 h-16 bg-[#E6F1FB] text-[#185FA5] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Profile</h2>
        <p className="text-slate-500 text-sm">Coming soon in Phase 3c</p>
      </div>
    </div>
  );
}
