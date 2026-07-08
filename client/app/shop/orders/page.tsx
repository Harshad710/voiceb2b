export default function OrdersPlaceholder() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-144px)]">
      <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-[80%] mx-auto">
        <div className="w-16 h-16 bg-[#E6F1FB] text-[#185FA5] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Orders</h2>
        <p className="text-slate-500 text-sm">Coming soon in Phase 3c</p>
      </div>
    </div>
  );
}
