import { useState, useEffect } from "react"
import "./AdminPage.css"
import logo from "../assets/logo-gris.png"

const API_URL = import.meta.env.VITE_API_URL

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
    try {
      const res = await fetch(`${API_URL}/api/admin-summary`)
      const data = await res.json()
      setSummary(data)
    } catch (error) {
      showMessage("Error conectando con el servidor", "error")
    }
  }

  useEffect(() => {
    if (isLogged) fetchSummary()
  }, [isLogged])

  /* ===========================
     LOGIN
  =========================== */

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword })
      })

      if (res.ok) {
        setIsLogged(true)
      } else {
        showMessage("Contraseña incorrecta", "error")
      }
    } catch {
      showMessage("Error de conexión", "error")
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
    if (!modalPassword) {
      showMessage("Debe ingresar la contraseña", "error")
      return
    }

    modalAction(modalPassword)
    setModalVisible(false)
  }

  /* ===========================
     ACCIONES
  =========================== */

  const addDonation = async (password) => {
    try {
      const res = await fetch(`${API_URL}/api/add`, {
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
    } catch {
      showMessage("Error de conexión", "error")
    }
  }

  const uploadMonth = async (password) => {
    try {
      const res = await fetch(`${API_URL}/api/upload-month`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })

      if (!res.ok) {
        showMessage("No autorizado", "error")
        return
      }

      fetchSummary()
      showMessage("Barra de progreso actualizada")
    } catch {
      showMessage("Error de conexión", "error")
    }
  }

  const resetAll = async (password) => {
    try {
      const res = await fetch(`${API_URL}/api/reset-all`, {
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
    } catch {
      showMessage("Error de conexión", "error")
    }
  }

  const updateGoal = async () => {
    if (!newGoal || !goalPassword) {
      showMessage("Complete todos los campos", "error")
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/update-goal`, {
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
    } catch {
      showMessage("Error de conexión", "error")
    }
  }

  /* ===========================
     LOGIN VIEW
  =========================== */

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

          <button
            className="admin-button btn-primary"
            onClick={handleLogin}
          >
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

  if (!summary) {
  return (
    <div className="admin-container">
      <div className="admin-card">
        <p style={{ color: "#fff" }}>Cargando...</p>
      </div>
    </div>
  )
}

  const progress =
    summary.goal > 0
      ? (summary.grandTotal / summary.goal) * 100
      : 0

  /* ===========================
     PANEL ADMIN
  =========================== */

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

        {/* ACUMULADO */}
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

        {/* PROGRESO */}
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

      {/* MODAL */}
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
              <button
                className="admin-button btn-primary"
                onClick={confirmModal}
              >
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