import { relativeDateFormatToTimestamp } from '../../utils/time'

/**
 * Transform filters widget data shape to order export strategy context object.
 */
export function transformFiltersAsExportContext(
  filters: Record<string, { filter: unknown; open?: boolean } | undefined>
) {
  const filterable_fields: Record<string, unknown> = {
    fulfillment_status: filters.fulfillment?.filter,
    payment_status: filters.payment?.filter,
    region_id: filters.region?.filter,
    status: filters.status?.filter,
    created_at: Object.keys(filters.date?.filter || {}).reduce((prev: Record<string, string>, k) => {
      const raw = (filters.date?.filter as Record<string, string>)[k]
      const timestamp = typeof raw === 'string' && raw.includes('|')
        ? relativeDateFormatToTimestamp(raw)
        : raw
      prev[k] = new Date(Number(timestamp) * 1000).toISOString()
      return prev
    }, {}),
  }

  // Custom filters — passed as-is to the export strategy's queryMatchingOrderIds
  if (filters.club?.open && filters.club.filter !== null) {
    filterable_fields.club = filters.club.filter
  }
  if (filters.ga?.open && filters.ga.filter !== null) {
    filterable_fields.ga = filters.ga.filter
  }
  if (filters.ref?.open && filters.ref.filter !== null) {
    filterable_fields.ref = filters.ref.filter
  }
  if (filters.isSyncedWithConnect?.open && filters.isSyncedWithConnect.filter !== null) {
    filterable_fields.isSyncedWithConnect = filters.isSyncedWithConnect.filter
  }
  if (filters.clubMembershipId?.open && filters.clubMembershipId.filter !== null) {
    filterable_fields.clubMembership = filters.clubMembershipId.filter
  }
  if (filters.odoo?.open && filters.odoo.filter !== null) {
    filterable_fields.odoo = filters.odoo.filter
  }

  const context = { filterable_fields }

  for (const k in context.filterable_fields) {
    const v = context.filterable_fields[k]
    if (v === null || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && v !== null && Object.keys(v).length === 0)) {
      delete context.filterable_fields[k]
    }
  }

  return context
}
