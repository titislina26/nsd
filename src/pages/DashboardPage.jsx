import KpiCards from '@/components/dashboard/KpiCards'
import useAppStore from '@/store/useAppStore'

export default function DashboardPage() {
  const store = useAppStore()
  const percentage = store.getPaidPercentage()
  const doneCount = store.getDoneCount()
  const totalCount = store.getTotalCount()
  const pendingCount = totalCount - doneCount

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard Analitik</h1>
          <p className="text-gray-500 mt-1 font-medium">Ringkasan operasional dan pengeluaran CARF</p>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards />

      {/* Progress Diagram Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 hover:shadow-md transition-shadow duration-300">
        <h3 className="text-lg font-bold mb-6 text-gray-900">
          Status Penyelesaian & Pencetakan Dokumen
        </h3>
        
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Progres Keseluruhan
            </span>
            <span className="text-3xl font-bold text-primary mt-1">
              {percentage}%
            </span>
          </div>
          <span className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full">
            {doneCount} dari {totalCount} Selesai
          </span>
        </div>

        {/* Progress bar container */}
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex mb-6 shadow-inner">
          {/* Done progress */}
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-primary rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
             <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(21,128,61,0.5)]" />
            <span className="text-sm font-medium text-gray-700">
              Selesai & Diprint ({doneCount})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-200" />
            <span className="text-sm font-medium text-gray-600">
              Pending ({pendingCount})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
