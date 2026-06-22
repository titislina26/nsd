import { Banknote, Clock, CheckCircle, ArrowUpRight } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { formatRupiah, calcPercentage } from '@/lib/utils'

const KPI_CONFIGS = [
  {
    key: 'total',
    label: 'Total Pengajuan CARF',
    icon: Banknote,
    variant: 'primary',
    getValue: (store) => formatRupiah(store.getTotalExpenseAmount()),
  },
  {
    key: 'pending',
    label: 'Pending Documents',
    icon: Clock,
    variant: 'warning',
    getValue: (store) => `${store.getPendingCount()} Dokumen`,
  },
  {
    key: 'done',
    label: 'Sudah Dikerjakan & Diprint',
    icon: CheckCircle,
    variant: 'success',
    getValue: (store) => `${store.getPaidPercentage()}% (${store.getDoneCount()}/${store.getTotalCount()} Dokumen)`,
  },
  {
    key: 'disbursed',
    label: 'Total Realisasi Dana',
    icon: ArrowUpRight,
    variant: 'primary',
    getValue: (store) => formatRupiah(store.getTotalDisbursed()),
  },
]

export default function KpiCards() {
  const store = useAppStore()

  return (
    <div className="grid grid--4">
      {KPI_CONFIGS.map(config => {
        const Icon = config.icon
        return (
          <div key={config.key} className="card card--interactive kpi-card">
            <div className={`kpi-card__icon-wrapper kpi-card__icon-wrapper--${config.variant}`}>
              <Icon size={22} />
            </div>
            <div className="kpi-card__label">{config.label}</div>
            <div className="kpi-card__value">{config.getValue(store)}</div>
            <div className={`kpi-card__glow kpi-card__glow--${config.variant}`} />
          </div>
        )
      })}
    </div>
  )
}
