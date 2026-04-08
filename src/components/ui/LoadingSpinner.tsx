export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-gray-200 rounded-full"></div>
        <div className="w-8 h-8 border-2 border-emerald-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
    </div>
  );
}
