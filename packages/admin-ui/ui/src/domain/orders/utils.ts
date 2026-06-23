import { formatDateFilter, OdooFilterState, OrderFilterState } from '../../components/templates/order-table/use-order-filters'

type ExportFilterableFields = {
  fulfillment_status?: string | string[] | null
  payment_status?: string | string[] | null
  region_id?: string | string[] | null
  status?: string | string[] | null
  created_at?: Record<string, string>
  sales_channel_id?: string | string[] | null
  club?: boolean | null
  ga?: boolean | null
  ref?: boolean | null
  clubMembership?: string | null
  odoo?: OdooFilterState | null
  isSyncedWithConnect?: boolean | null
}

/**
 * Transform filters widget data shape to order export strategy context object.
 */
export function transformFiltersAsExportContext(filters: OrderFilterState) {
  const context = {
    filterable_fields: {
      fulfillment_status: filters.fulfillment?.filter,
      payment_status: filters.payment?.filter,
      region_id: filters.region?.filter,
      status: filters.status?.filter,
      created_at: (() => {
        const formatted = formatDateFilter(filters.date?.filter ?? null)
        if (!formatted) return undefined
        return Object.entries(formatted).reduce((prev: Record<string, string>, [k, v]) => {
          const ms = Number(v) * 1000
          if (!isNaN(ms)) prev[k] = new Date(ms).toISOString()
          return prev
        }, {})
      })(),
      sales_channel_id: filters.salesChannel?.filter,
      club: filters.club?.filter,
      ga: filters.ga?.filter,
      ref: filters.ref?.filter,
      clubMembership: filters.clubMembershipId?.filter,
      odoo: filters.odoo?.filter,
      isSyncedWithConnect: filters.isSyncedWithConnect?.filter,
    } as ExportFilterableFields,
  }

  const fields = context.filterable_fields as Record<string, unknown>
  for (const k in fields) {
    const val = fields[k]
    if (val === null || val === undefined || (Array.isArray(val) && val.length === 0)) {
      delete fields[k]
    }
  }

  return context
}
