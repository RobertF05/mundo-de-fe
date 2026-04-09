import React, { useEffect, useState } from "react"
import "./PublicPage.css"
import logo from "../../public/logo-gris.png"

const API_URL = import.meta.env.VITE_API_URL

// Función para formatear números como moneda (siempre con comas de miles y punto decimal)
const formatCurrency = (value) => {
  if (value === null || value === undefined) return "0.00"
  
  // Convertir a número
  let numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
  
  if (isNaN(numValue)) return "0.00"
  
  // Formatear con 2 decimales, usando siempre punto para decimal y comas para miles
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  })
}

export default function PublicPage() {
  const [total, setTotal] = useState(0)
  const [goal, setGoal] = useState(1)

  useEffect(() => {
    fetch(`${API_URL}/api/grand-total`)
      .then(res => res.json())
      .then(data => {
        setTotal(data.total)
        setGoal(data.goal)
      })
      .catch(() => {
        console.error("Error conectando al backend")
      })
  }, [])

  const percentage = goal > 0 ? (total / goal) * 100 : 0
  const formattedPercentage = percentage.toFixed(1)

  return (
    <div className="public-container">
      <div className="public-scale-wrapper">
        <img src={logo} alt="Logo" className="public-logo" />

        <div className="progress-card">
          <div className="progress-wrapper">
            <div className="progress-bar-public">
              <div
                className="progress-fill-public"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div
              className="percentage-bubble"
              style={{ left: `${percentage}%` }}
            >
              {formattedPercentage}%
            </div>
          </div>
        </div>

        <div className="info-box">
          <div className="info-top">
            META: ${formatCurrency(goal)}
          </div>
          <div className="info-bottom">
            RECAUDADO: ${formatCurrency(total)}
          </div>
        </div>
      </div>
    </div>
  )
}