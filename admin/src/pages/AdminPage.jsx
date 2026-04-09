import { useState, useEffect, useCallback } from "react"
import "./AdminPage.css"
import logo from "../assets/logo-gris.png"

const API_URL = import.meta.env.VITE_API_URL

// Función para formatear números como moneda - FORZADO a usar comas y punto
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "0.00"
  
  // Convertir a número
  let numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '').replace(/\./g, '')) : value
  
  if (isNaN(numValue)) return "0.00"
  
  // Formato MANUAL para asegurar comas como separadores de miles y punto para decimales
  const roundedNum = Math.round(numValue * 100) / 100
  
  // Separar parte entera y decimal
  let [integerPart, decimalPart] = roundedNum.toFixed(2).split('.')
  
  // Agregar comas a la parte entera (de derecha a izquierda)
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  // Retornar con punto decimal
  return `${integerPart}.${decimalPart}`
}

// Función para limpiar el formato (eliminar comas y convertir punto a decimal)
const cleanCurrencyString = (value) => {
  if (!value && value !== 0) return ""
  // Eliminar comas, mantener solo números y el primer punto
  let cleaned = value.toString().replace(/,/g, '')
  // Asegurar que solo hay un punto decimal
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  return cleaned
}

// Validar y parsear el valor
const parseAndValidateCurrency = (value) => {
  if (!value && value !== 0) return null
  
  // Si es string, limpiar primero
  let cleanValue = value
  if (typeof value === 'string') {
    cleanValue = cleanCurrencyString(value)
  }
  
  // Convertir a número
  let numValue = parseFloat(cleanValue)
  
  // Validar
  if (isNaN(numValue)) return null
  if (numValue < 0) return null
  
  // Redondear a 2 decimales
  numValue = Math.round(numValue * 100) / 100
  
  return numValue
}

// Componente InputMoneda
const CurrencyInput = ({ value, onChange, placeholder, className, style = {} }) => {
  const [displayValue, setDisplayValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  
  // Actualizar el display cuando el value externo cambia
  useEffect(() => {
    if (!isFocused) {
      if (value && value !== "") {
        const numValue = typeof value === 'string' ? parseFloat(cleanCurrencyString(value)) : value
        if (!isNaN(numValue) && numValue !== 0) {
          setDisplayValue(formatCurrency(numValue))
        } else {
          setDisplayValue("")
        }
      } else {
        setDisplayValue("")
      }
    }
  }, [value, isFocused])
  
  const handleChange = (e) => {
    let rawValue = e.target.value
    
    // Permitir: dígitos, punto decimal, y teclas de control
    if (rawValue === "") {
      setDisplayValue("")
      if (onChange) onChange("")
      return
    }
    
    // Validar que solo contenga caracteres válidos para números
    const isValid = /^\d*\.?\d*$/.test(rawValue)
    if (!isValid) return
    
    // Limitar a 2 decimales mientras escribe
    const decimalParts = rawValue.split('.')
    if (decimalParts.length === 2 && decimalParts[1].length > 2) return
    
    // Actualizar el display
    setDisplayValue(rawValue)
    
    // Parsear y validar
    let numValue = parseAndValidateCurrency(rawValue)
    
    // Llamar al onChange
    if (onChange) {
      onChange(numValue !== null ? numValue : "")
    }
  }
  
  const handleBlur = () => {
    setIsFocused(false)
    
    // Al perder el foco, formatear el valor
    if (displayValue && displayValue !== "") {
      let numValue = parseAndValidateCurrency(displayValue)
      if (numValue !== null && !isNaN(numValue) && numValue > 0) {
        const formatted = formatCurrency(numValue)
        setDisplayValue(formatted)
        if (onChange) {
          onChange(numValue)
        }
      } else {
        setDisplayValue("")
        if (onChange) {
          onChange("")
        }
      }
    }
  }
  
  const handleFocus = (e) => {
    setIsFocused(true)
    // Al hacer foco, mostrar el número sin formato
    if (value && value !== "") {
      let numValue = typeof value === 'string' ? parseFloat(cleanCurrencyString(value)) : value
      if (!isNaN(numValue) && numValue > 0) {
        let stringValue = numValue.toString()
        setDisplayValue(stringValue)
      }
    }
  }
  
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={className}
      style={style}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  )
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
  const [modalActionType, setModalActionType] = useState("")

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

  const openModal = (action, actionName) => {
    setModalAction(() => action)
    setModalActionType(actionName)
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
      await fetchSummary()
    } catch (error) {
      console.error("Error en acción modal:", error)
      showMessage("Error al ejecutar la acción", "error")
    }
  }

  const addDonation = async (password) => {
    const amountNumber = parseAndValidateCurrency(amount)
    
    if (!amountNumber || amountNumber <= 0) {
      showMessage("Ingrese una cantidad válida mayor a 0", "error")
      return
    }

    if (amountNumber.toString().split('.')[1]?.length > 2) {
      showMessage("La cantidad no puede tener más de 2 decimales", "error")
      return
    }

    if (amountNumber > 999999999.99) {
      showMessage("El monto excede el límite permitido", "error")
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNumber,
          password
        })
      })

      if (!res.ok) {
        const error = await res.json()
        showMessage(error.message || "No autorizado", "error")
        return
      }

      setAmount("")
      showMessage(`Donación de $${formatCurrency(amountNumber)} agregada correctamente`, "success")
    } catch (error) {
      console.error("Error en addDonation:", error)
      showMessage("Error de conexión", "error")
      throw error
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
      console.log("Llamando a URL:", url)
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })

      console.log("Respuesta status:", res.status)

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

    const goalNumber = parseAndValidateCurrency(newGoal)
    
    if (!goalNumber || goalNumber <= 0) {
      showMessage("Ingrese una meta válida mayor a 0", "error")
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/update-goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: goalPassword,
          goal: goalNumber
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
      showMessage(`Meta actualizada a $${formatCurrency(goalNumber)}`, "success")
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

  // Función para obtener el ícono y color según la acción
  const getModalActionInfo = () => {
    switch(modalActionType) {
      case "addDonation":
        return {
          title: "Agregar Donación",
          color: "#28a745",
          message: "Estás a punto de agregar una nueva donación al acumulado actual."
        }
      case "resetTemp":
        return {
          title: "Borrar Acumulado",
          color: "#dc3545",
          message: "Esta acción ELIMINARÁ TODO el acumulado actual. Esta operación es irreversible."
        }
      case "uploadMonth":
        return {
          title: "Aumentar Barra de Progreso",
          color: "#007bff",
          message: "Moverás el acumulado actual al total histórico. Esta acción no se puede deshacer."
        }
      case "resetAll":
        return {
          title: "Reiniciar Sistema Completo",
          color: "#dc3545",
          message: "Reiniciarás TODO el sistema. Todos los datos se perderán permanentemente."
        }
      default:
        return {
          title: "Confirmar Acción",
          color: "#6c757d",
          message: "Por favor, confirma tu identidad para continuar."
        }
    }
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

  const progress = summary.goal > 0
    ? (summary.grandTotal / summary.goal) * 100
    : 0

  const actionInfo = getModalActionInfo()

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

        <h2>Total recaudado: ${formatCurrency(summary.grandTotal)}</h2>
        <h3>Acumulado actual (sin subir): ${formatCurrency(summary.tempTotal)}</h3>
        <h3>Meta: ${formatCurrency(summary.goal)}</h3>

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
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              placeholder="Ingresar en USD $"
              className="admin-input"
              style={{ flex: 2 }}
            />
            
            <div className="button-group">
              <button
                className="admin-button btn-primary"
                onClick={() => openModal(addDonation, "addDonation")}
              >
                Agregar
              </button>

              <button
                className="admin-button btn-danger"
                onClick={() => openModal(resetTemp, "resetTemp")}
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
            onClick={() => openModal(uploadMonth, "uploadMonth")}
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
            onClick={() => openModal(resetAll, "resetAll")}
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
        <div className="section-box" style={{ marginTop: "20px" }}>
          <h4 style={{ marginBottom: "15px", color: "#fff" }}>Actualizar Meta</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <CurrencyInput
              value={newGoal}
              onChange={setNewGoal}
              placeholder="Nueva meta en USD $"
              className="admin-input"
              style={{ 
                width: "100%", 
                padding: "10px",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="admin-input"
              style={{ 
                width: "100%", 
                padding: "10px",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
              value={goalPassword}
              onChange={(e) => setGoalPassword(e.target.value)}
            />
            <button
              className="admin-button btn-primary"
              onClick={updateGoal}
              style={{ 
                width: "100%", 
                padding: "10px",
                fontSize: "16px",
                marginTop: "5px"
              }}
            >
              Guardar Meta
            </button>
          </div>
        </div>
      )}
      </div>

      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Encabezado con ícono y título de la acción */}
            <div style={{
              textAlign: "center",
              marginBottom: "20px",
              paddingBottom: "15px",
              borderBottom: `2px solid ${actionInfo.color}`
            }}>
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>
                {actionInfo.icon}
              </div>
              <h2 style={{ 
                margin: 0, 
                color: actionInfo.color,
                fontSize: "24px"
              }}>
                {actionInfo.title}
              </h2>
            </div>

            {/* Mensaje descriptivo de la acción */}
            <div style={{
              backgroundColor: "rgba(0,0,0,0.05)",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: "14px", 
                color: "#c7c6c6",
                lineHeight: "1.5"
              }}>
                {actionInfo.message}
              </p>
            </div>

            {/* Campo de contraseña */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#f1f1f1"
              }}>
                Contraseña de administrador
              </label>
              <input
                type="password"
                className="admin-input"
                style={{ width: "100%", margin: "15px -15px" }}
                placeholder="Ingrese su contraseña"
                value={modalPassword}
                onChange={(e) => setModalPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && confirmModal()}
                autoFocus
              />
            </div>

            {/* Botones de acción */}
            <div className="modal-buttons" style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center"
            }}>
              <button
                className="admin-button"
                style={{
                  backgroundColor: actionInfo.color,
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  flex: 1
                }}
                onClick={confirmModal}
              >
                Confirmar
              </button>

              <button
                className="admin-button btn-danger"
                style={{
                  padding: "10px 20px",
                  flex: 1
                }}
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