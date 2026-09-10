import React from 'react'

const TRIP_STEPS = [
  { key: 'REQUESTED',          label: 'Requested' },
  { key: 'MATCHED',            label: 'Matched' },
  { key: 'DRIVER_ASSIGNED',    label: 'Driver\nAssigned' },
  { key: 'DRIVER_ACCEPTED',    label: 'Accepted' },
  { key: 'PICKUP_IN_PROGRESS', label: 'Pickup' },
  { key: 'IN_TRANSIT',         label: 'In Transit' },
  { key: 'DELIVERED',          label: 'Delivered' },
]

const STEP_ORDER = TRIP_STEPS.map(s => s.key)

export default function TripStatusStepper({ status }) {
  const currentIdx = STEP_ORDER.indexOf(status)

  return (
    <div className="status-stepper">
      {TRIP_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx
        const isActive    = idx === currentIdx
        return (
          <div
            key={step.key}
            className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
          >
            <div className="step-dot">
              {isCompleted ? '✓' : idx + 1}
            </div>
            <span className="step-label">{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
