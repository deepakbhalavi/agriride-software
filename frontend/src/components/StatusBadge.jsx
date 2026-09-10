import React from 'react'

const STATUS_MAP = {
  REQUESTED:          { cls: 'badge-requested', label: 'Requested',      icon: '⏳' },
  MATCHED:            { cls: 'badge-matched',   label: 'Matched',        icon: '✅' },
  DRIVER_ASSIGNED:    { cls: 'badge-assigned',  label: 'Driver Assigned', icon: '🚛' },
  DRIVER_ACCEPTED:    { cls: 'badge-accepted',  label: 'Driver Accepted', icon: '👍' },
  PICKUP_IN_PROGRESS: { cls: 'badge-pickup',    label: 'Pickup In Progress', icon: '📍' },
  IN_TRANSIT:         { cls: 'badge-transit',   label: 'In Transit',     icon: '🚚' },
  DELIVERED:          { cls: 'badge-delivered', label: 'Delivered',      icon: '✔️' },
  CANCELLED:          { cls: 'badge-cancelled', label: 'Cancelled',      icon: '❌' },
  PENDING:            { cls: 'badge-pending',   label: 'Pending',        icon: '⏳' },
  SUCCESS:            { cls: 'badge-success',   label: 'Success',        icon: '✅' },
  FAILED:             { cls: 'badge-cancelled', label: 'Failed',         icon: '❌' },
  REFUNDED:           { cls: 'badge-assigned',  label: 'Refunded',       icon: '↩️' },
  FARMER:             { cls: 'badge-farmer',    label: 'Farmer',         icon: '🌾' },
  DRIVER:             { cls: 'badge-driver',    label: 'Driver',         icon: '🚛' },
  ADMIN:              { cls: 'badge-admin',     label: 'Admin',          icon: '👔' },
  MATCHED_STATUS:     { cls: 'badge-matched',   label: 'MATCHED',        icon: '✅' },
  PARTIALLY_MATCHED:  { cls: 'badge-assigned',  label: 'PARTIAL',        icon: '⚠️' },
  NOT_MATCHED:        { cls: 'badge-cancelled', label: 'NOT MATCHED',    icon: '❌' },
}

export default function StatusBadge({ status, showIcon = true }) {
  const s = STATUS_MAP[status] || { cls: 'badge-pending', label: status, icon: '•' }
  return (
    <span className={`badge ${s.cls}`}>
      {showIcon && s.icon} {s.label}
    </span>
  )
}
