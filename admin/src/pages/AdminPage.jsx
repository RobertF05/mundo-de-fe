import { useState, useEffect } from "react"
import "./AdminPage.css"
import logo from "../assets/logo-gris.png"

export default function AdminPage() {
  const [isLogged, setIsLogged] = useState(false)
  const [loginPassword, setLoginPassword] = useState("")

  const [summary, setSummary] = useState(null)
  const [amount, setAmount] = useState("")

  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState("success")

  const [modalVisible, setModalVisible] = useState(false)
  const [modalPassword, setModalPassword] = useState("")
  const [modalAction, setModalAction] = useState(null)

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState("")
  const [goalPassword, setGoalPassword] = useState("")

  /* ===========================
     MENSAJES PERSONALIZADOS
  =========================== */

  const showMessage = (text, type = "success") => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(null), 3000)
  }

  /* ===========================
     RESUMEN
  =========================== */

  const fetchSummary = async () => {
    const res = await fetch("http://localhost:3000/api/admin-summary")
    const data = await res.json()
    setSummary(data)
  }

  useEffect(() => {
    if (isLogged) fetchSummary()
  }, [isLogged])

  /* ===========================
     LOGIN
  =========================== */

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: loginPassword })
    })

    if (res.ok) {
      setIsLogged(true)
    } else {
      showMessage("Contraseña incorrecta", "error")
    }
  }

  /* ===========================
     MODAL PARA CONTRASEÑAS
  =========================== */

  const openModal = (action) => {
    setModalAction(() => action)
    setModalPassword("")
    setModalVisible(true)
  }

  const confirmModal = () => {
    modalAction(modalPassword)
    setModalVisible(false)
  }

  /* ===========================
     ACCIONES
  =========================== */

  const addDonation = async (password) => {
    const res = await fetch("http://localhost:3000/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        password
      })
    })

    if (!res.ok) {
      showMessage("No autorizado", "error")
      return
    }

    setAmount("")
    fetchSummary()
    showMessage("Donación agregada correctamente")
  }

  const uploadMonth = async (password) => {
    const res = await fetch("http://localhost:3000/api/upload-month", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    })

    if (!res.ok) {
      showMessage("No autorizado", "error")
      return
    }

    fetchSummary()
    showMessage("Acumulado subido correctamente")
  }

  const resetAll = async (password) => {
    const res = await fetch("http://localhost:3000/api/reset-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    })

    if (!res.ok) {
      showMessage("No autorizado", "error")
      return
    }

    fetchSummary()
    showMessage("Sistema reiniciado correctamente")
  }

  const updateGoal = async () => {
    const res = await fetch("http://localhost:3000/api/update-goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: goalPassword,
        goal: Number(newGoal)
      })
    })

    if (!res.ok) {
      showMessage("No autorizado", "error")
      return
    }

    setShowGoalForm(false)
    setNewGoal("")
    setGoalPassword("")
    fetchSummary()
    showMessage("Meta actualizada correctamente")
  }

  if (!isLogged) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <img src={logo} alt="Logo" className="admin-logo" />
          <h1>Admin Login</h1>
          <input
            type="password"
            placeholder="Contraseña"
            className="admin-input"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
          <button className="admin-button btn-primary" onClick={handleLogin}>
            Ingresar
          </button>

          {message && (
            <div className={`system-message ${messageType}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!summary) return null

  const progress =
    summary.goal > 0
      ? (summary.grandTotal / summary.goal) * 100
      : 0

  return (
    <div className="admin-container">
      <div className="admin-card">
        <img src={logo} alt="Logo" className="admin-logo" />
        <h1>Panel Administrativo</h1>

        {message && (
          <div className={`system-message ${messageType}`}>
            {message}
          </div>
        )}

        <h2>Total mensual: ${summary.grandTotal}</h2>
        <h3>Acumulado actual: ${summary.tempTotal}</h3>
        <h3>Meta: ${summary.goal}</h3>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <hr />

        {/* SECCIÓN ACUMULADO */}
        <div className="section-box">
          <h3>Agregar al acumulado</h3>
          <input
            type="number"
            placeholder="Cantidad"
            className="admin-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            className="admin-button btn-primary"
            onClick={() => openModal(addDonation)}
          >
            Agregar
          </button>
        </div>

        {/* SECCIÓN PROGRESO */}
        <div className="section-box">
          <h3>Subir acumulado al progreso total</h3>
          <button
            className="admin-button btn-primary"
            onClick={() => openModal(uploadMonth)}
          >
            Aumentar Barra de Progreso
          </button>
        </div>

        <hr />

        <button
          className="admin-button btn-danger"
          onClick={() => openModal(resetAll)}
        >
          Reiniciar sistema
        </button>

        <hr />

        <button
          className="admin-button btn-primary"
          onClick={() => setShowGoalForm(!showGoalForm)}
        >
          Actualizar Meta
        </button>

        {showGoalForm && (
          <div className="section-box">
            <input
              type="number"
              placeholder="Nueva meta"
              className="admin-input"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña meta"
              className="admin-input"
              value={goalPassword}
              onChange={(e) => setGoalPassword(e.target.value)}
            />
            <button
              className="admin-button btn-primary"
              onClick={updateGoal}
            >
              Guardar Meta
            </button>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Ingrese contraseña</h3>
            <input
              type="password"
              className="admin-input"
              value={modalPassword}
              onChange={(e) => setModalPassword(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="admin-button btn-primary" onClick={confirmModal}>
                Confirmar
              </button>
              <button
                className="admin-button btn-danger"
                onClick={() => setModalVisible(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}