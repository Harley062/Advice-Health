export default function TaskSkeleton() {
  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="flex gap-2">
            <div className="h-5 bg-gray-100 rounded-full w-16" />
            <div className="h-5 bg-gray-100 rounded-full w-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
