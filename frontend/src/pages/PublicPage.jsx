import React, { useEffect, useState } from "react"
import "./PublicPage.css"
import logo from "../public/logo-gris.png"

export default function PublicPage() {
  const [total, setTotal] = useState(0)
  const [goal, setGoal] = useState(1)

  useEffect(() => {
    fetch("http://localhost:3000/api/grand-total")
      .then(res => res.json())
      .then(data => {
        setTotal(data.total)
        setGoal(data.goal)
      })
  }, [])

  const percentage = goal > 0 ? (total / goal) * 100 : 0
  const formattedPercentage = percentage.toFixed(1)

  return (
    <div className="public-container">
      
      <img src={logo} alt="Logo" className="public-logo" />

      <div className="progress-wrapper">
        <div className="progress-bar-public">
          <div
            className="progress-fill-public"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div
          className="percentage-badge"
          style={{ left: `${percentage}%` }}
        >
          {formattedPercentage}%
        </div>
      </div>

      <div className="info-box">
        <div className="info-left">
          META: ${goal.toLocaleString()}
        </div>
        <div className="info-right">
          FONDO: ${total.toLocaleString()}
        </div>
      </div>

    </div>
  )
}