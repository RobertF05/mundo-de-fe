import { useState, useEffect, useCallback } from "react"
import "./AdminPage.css"
import logo from "../assets/logo-gris.png"

const API_URL = import.meta.env.VITE_API_URL

const formatNumber = (value) => {
  if (!value && value !== 0) return ""
  const number = value.toString().replace(/,/g, "")
  return Number(number).toLocaleString("en-US")
}

const unformatNumber = (value) => {
  return value.replace(/,/g, "")
}

export default function AdminPage() {
  const [isLogged, setIsLogged] = useState(false)
  const [loginPassword, setLoginPassword] = useState("")

  const [summary, setSummary] = useState(null)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState("success")

  const [modalVisible, setModalVisible] = useState(false)
  const [modalPassword, setModalPassword] = useState("")
  const [modalAction, setModalAction] = useState(null)

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [newGoal, setNewGoal] = useState("")
  const [goalPassword, setGoalPassword] = useState("")

  // Verificar sesión al cargar
  useEffect(() => {
    const savedAuth = localStorage.getItem("adminAuth")
    if (savedAuth === "true") {
      setIsLogged(true)
    }
  }, [])

  const showMessage = (text, type = "success") => {
    setMessage(text)
    setMessageType(type)
    setTimeout(() => setMessage(null), 3000)
  }

  // Usar useCallback para evitar recreaciones innecesarias
  const fetchSummary = useCallback(async () => {
    if (!isLogged) return
    
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/admin-summary`)
      if (!res.ok) throw new Error("Error al obtener resumen")
      const data = await res.json()
      console.log("Summary actualizado:", data)
      setSummary(data)
    } catch (error) {
      console.error("Error fetching summary:", error)
      showMessage("Error conectando con el servidor", "error")
    } finally {
      setLoading(false)
    }
  }, [isLogged])

  useEffect(() => {
    if (isLogged) {
      fetchSummary()
    }
  }, [isLogged, fetchSummary])

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword })
      })

      if (res.ok) {
        setIsLogged(true)
        localStorage.setItem("adminAuth", "true")
        showMessage("Login exitoso", "success")
      } else {
        showMessage("Contraseña incorrecta", "error")
      }
    } catch {
      showMessage("Error de conexión", "error")
    }
  }

  const openModal = (action) => {
    setModalAction(() => action)
    setModalPassword("")
    setModalVisible(true)
  }

  const confirmModal = async () => {
    if (!modalPassword) {
      showMessage("Debe ingresar la contraseña", "error")
      return
    }

    const action = modalAction
    setModalVisible(false)

    try {
      await action(modalPassword)
      // IMPORTANTE: Esperar a que fetchSummary termine
      await fetchSummary()
    } catch (error) {
      console.error("Error en acción modal:", error)
      showMessage("Error al ejecutar la acción", "error")
    }
  }

  const addDonation = async (password) => {
    if (!amount || Number(amount) <= 0) {
      showMessage("Ingrese una cantidad válida", "error")
      return
    }

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
        const error = await res.json()
        showMessage(error.message || "No autorizado", "error")
        return
      }

      setAmount("")
      showMessage("Donación agregada correctamente", "success")
    } catch (error) {
      console.error("Error en addDonation:", error)
      showMessage("Error de conexión", "error")
      throw error // Re-lanzar para que confirmModal lo capture
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
        const error = await res.json()
        showMessage(error.message || "No autorizado", "error")
        return
      }

      showMessage("Barra de progreso actualizada", "success")
    } catch (error) {
      console.error("Error en uploadMonth:", error)
      showMessage("Error de conexión", "error")
      throw error
    }
  }

  const resetTemp = async (password) => {
  try {
    const url = `${API_URL}/api/reset-temp`
    console.log("Llamando a URL:", url) // 🔥 Ver URL exacta
    
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    })

    console.log("Respuesta status:", res.status)
    console.log("Respuesta headers:", res.headers.get('content-type'))

    // Verificar si la respuesta es JSON
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text()
      console.error("Respuesta no es JSON:", text.substring(0, 200))
      throw new Error(`El servidor respondió con ${contentType} en lugar de JSON`)
    }

    if (!res.ok) {
      const error = await res.json()
      showMessage(error.message || "No autorizado", "error")
      return
    }

    const data = await res.json()
    console.log("Reset response:", data)
    showMessage("Acumulado eliminado correctamente", "success")
  } catch (error) {
    console.error("Error en resetTemp:", error)
    showMessage("Error de conexión: " + error.message, "error")
    throw error
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
        const error = await res.json()
        showMessage(error.message || "No autorizado", "error")
        return
      }

      showMessage("Sistema reiniciado correctamente", "success")
    } catch (error) {
      console.error("Error en resetAll:", error)
      showMessage("Error de conexión", "error")
      throw error
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
      await fetchSummary()
      showMessage("Meta actualizada correctamente", "success")
    } catch (error) {
      console.error("Error en updateGoal:", error)
      showMessage("Error de conexión", "error")
    }
  }

  const handleLogout = () => {
    setIsLogged(false)
    localStorage.removeItem("adminAuth")
    setLoginPassword("")
    setSummary(null)
    showMessage("Sesión cerrada", "success")
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
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
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

  if (!summary || loading) {
    return (
      <div className="admin-container">
        <div className="admin-card">
          <p style={{ color: "#fff" }}>{loading ? "Cargando..." : "Cargando datos..."}</p>
        </div>
      </div>
    )
  }

  // Barra de progreso SOLO usa grandTotal (histórico)
  const progress = summary.goal > 0
    ? (summary.grandTotal / summary.goal) * 100
    : 0

  return (
    <div className="admin-container">
      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <img src={logo} alt="Logo" className="admin-logo" />
          <button 
            className="admin-button btn-danger" 
            onClick={handleLogout}
            style={{ padding: "5px 15px" }}
          >
            Cerrar Sesión
          </button>
        </div>
        <h1>Panel Administrativo</h1>

        {message && (
          <div className={`system-message ${messageType}`}>
            {message}
          </div>
        )}

        <h2>Total recaudado histórico: ${formatNumber(summary.grandTotal)}</h2>
        <h3>Acumulado actual (sin subir): ${formatNumber(summary.tempTotal)}</h3>
        <h3>Meta: ${formatNumber(summary.goal)}</h3>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p style={{ marginTop: "-10px", fontSize: "20px", font: 'Segoe UI', color: "#ccc" }}>
          {progress.toFixed(1)}% Alcanzado
        </p>

        <hr />

        <div className="section-box">
          <h3>Agregar al acumulado</h3>

          <div className="input-button-group">
            <input
              type="text"
              placeholder="Cantidad en USD"
              className="admin-input"
              style={{ flex: 2 }}
              value={formatNumber(amount)}
              onChange={(e) => {
                const raw = unformatNumber(e.target.value)
                if (/^\d*$/.test(raw)) {
                  setAmount(raw)
                }
              }}
            />
            
            <div className="button-group">
              <button
                className="admin-button btn-primary"
                onClick={() => openModal(addDonation)}
              >
                Agregar
              </button>

              <button
                className="admin-button btn-danger"
                onClick={() => openModal(resetTemp)}
              >
                Borrar Acumulado
              </button>
            </div>
          </div>
        </div>

        <div className="section-box">
          <h3>Subir acumulado al progreso total</h3>
          <button
            className="admin-button btn-primary"
            onClick={() => openModal(uploadMonth)}
            style={{ width: "100%" }}
          >
            Aumentar Barra de Progreso
          </button>
          <p style={{ fontSize: "12px", marginTop: "10px", color: "#ccc" }}>
            Esta acción moverá el acumulado actual al total histórico
          </p>
        </div>

        <hr />

        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button
            className="admin-button btn-danger"
            onClick={() => openModal(resetAll)}
            style={{ flex: 1 }}
          >
            Reiniciar Sistema Completo
          </button>

          <button
            className="admin-button btn-primary"
            onClick={() => setShowGoalForm(!showGoalForm)}
            style={{ flex: 1 }}
          >
            {showGoalForm ? "Cancelar" : "Actualizar Meta"}
          </button>
        </div>

        {showGoalForm && (
          <div className="section-box">
            <h4>Actualizar Meta</h4>
            <input
              type="text"
              placeholder="Nueva meta"
              className="admin-input"
              style={{ width: "100%", marginBottom: "10px" }}
              value={formatNumber(newGoal)}
              onChange={(e) => {
                const raw = unformatNumber(e.target.value)
                if (/^\d*$/.test(raw)) {
                  setNewGoal(raw)
                }
              }}
            />
            <input
              type="password"
              placeholder="Contraseña meta"
              className="admin-input"
              style={{ width: "100%", marginBottom: "10px" }}
              value={goalPassword}
              onChange={(e) => setGoalPassword(e.target.value)}
            />
            <button
              className="admin-button btn-primary"
              onClick={updateGoal}
              style={{ width: "100%" }}
            >
              Guardar Meta
            </button>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modalAction === resetTemp
                ? "Eliminar acumulado (irreversible)"
                : modalAction === resetAll
                ? "Reiniciar todo el sistema (irreversible)"
                : "Ingrese contraseña"}
            </h3>

            <input
              type="password"
              className="admin-input"
              style={{ width: "100%", margin: "15px 0" }}
              placeholder="Contraseña de administrador"
              value={modalPassword}
              onChange={(e) => setModalPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && confirmModal()}
              autoFocus
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