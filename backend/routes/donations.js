import express from "express"
import { getFirestore } from "../firebaseClient.js"

const router = express.Router()
const db = getFirestore()

// Variables de entorno
const LOGIN_PASSWORD = process.env.PASSWORD 
const TRANSACTION_PASSWORD = process.env.PASSWORD 
const GOAL_PASSWORD = process.env.PASSWORD 
const RESET_PASSWORD = process.env.PASSWORD 

const donationsTemp = db.collection("donations_temp")
const monthlyTotals = db.collection("monthly_totals")
const goalCollection = db.collection("goal")

// ========== RUTAS EXISTENTES ==========
router.get("/test-firestore", async (req, res) => {
  try {
    const test = await db.collection("test").add({
      message: "conexion exitosa",
      date: new Date()
    })
    res.json({ success: true, id: test.id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

router.post("/add", async (req, res) => {
  const { amount, password } = req.body

  if (password !== TRANSACTION_PASSWORD) {
    return res.status(401).json({ message: "No autorizado" })
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Cantidad inválida" })
  }

  try {
    await donationsTemp.add({
      amount: parseFloat(amount),
      created_at: new Date()
    })
    res.json({ message: "Donación agregada", amount: parseFloat(amount) })
  } catch (error) {
    console.error("Error agregando donación:", error)
    res.status(500).json({ error: "Error agregando donación" })
  }
})

router.get("/temp-total", async (req, res) => {
  try {
    const snapshot = await donationsTemp.get()
    let total = 0
    snapshot.forEach(doc => {
      total += doc.data().amount
    })
    res.json({ total })
  } catch (error) {
    console.error("Error obteniendo total temporal:", error)
    res.status(500).json({ error: "Error obteniendo total temporal" })
  }
})

// 🔥 RUTA PARA EL FRONTEND PÚBLICO - Esta es la que falta
router.get("/grand-total", async (req, res) => {
  try {
    // Obtener total histórico de monthly_totals
    const monthlySnapshot = await monthlyTotals.get()
    let total = 0
    monthlySnapshot.forEach(doc => {
      total += doc.data().total_amount
    })

    // Obtener la meta
    const goalDoc = await goalCollection.doc("main").get()
    const goal = goalDoc.exists ? goalDoc.data().goal_amount : 0

    res.json({ total, goal })
  } catch (error) {
    console.error("Error obteniendo total general:", error)
    res.status(500).json({ error: "Error obteniendo total general" })
  }
})

// ========== RUTAS ADMIN ==========

router.post("/upload-month", async (req, res) => {
  try {
    const { password } = req.body

    if (password !== TRANSACTION_PASSWORD) {
      return res.status(401).json({ message: "No autorizado" })
    }

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const monthId = `${year}-${month}`

    const tempSnapshot = await donationsTemp.get()
    let tempTotal = 0

    tempSnapshot.forEach(doc => {
      tempTotal += doc.data().amount
    })

    if (tempTotal === 0) {
      return res.json({ message: "No hay acumulado para subir", tempTotal: 0 })
    }

    const monthRef = monthlyTotals.doc(monthId)
    const monthDoc = await monthRef.get()

    if (monthDoc.exists) {
      const newTotal = monthDoc.data().total_amount + tempTotal
      await monthRef.update({
        total_amount: newTotal,
        last_updated: new Date()
      })
    } else {
      await monthRef.set({
        month,
        year,
        total_amount: tempTotal,
        created_at: new Date()
      })
    }

    const batch = db.batch()
    tempSnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    res.json({ 
      message: "Acumulado subido correctamente", 
      uploaded: tempTotal,
      grandTotal: monthDoc.exists ? monthDoc.data().total_amount + tempTotal : tempTotal,
      tempTotal: 0
    })
  } catch (error) {
    console.error("Error al subir acumulado:", error)
    res.status(500).json({ error: "Error al subir acumulado" })
  }
})

router.post("/reset-temp", async (req, res) => {
  const { password } = req.body

  console.log("Intentando resetear acumulado...")

  if (password !== TRANSACTION_PASSWORD) {
    console.log("Contraseña incorrecta")
    return res.status(401).json({ message: "No autorizado" })
  }

  try {
    const snapshot = await donationsTemp.get()
    
    console.log(`Encontrados ${snapshot.size} documentos para eliminar`)
    
    if (snapshot.empty) {
      return res.json({ message: "No hay acumulado para eliminar", deleted: 0 })
    }

    const batch = db.batch()
    snapshot.forEach(doc => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    console.log("Acumulado eliminado correctamente")

    res.json({ 
      message: "Acumulado eliminado correctamente", 
      deleted: snapshot.size,
      tempTotal: 0
    })
  } catch (error) {
    console.error("Error eliminando acumulado:", error)
    res.status(500).json({ message: "Error eliminando acumulado" })
  }
})

router.get("/admin-summary", async (req, res) => {
  try {
    const tempSnapshot = await donationsTemp.get()
    let tempTotal = 0
    tempSnapshot.forEach(doc => {
      tempTotal += doc.data().amount
    })

    const monthlySnapshot = await monthlyTotals.get()
    let grandTotal = 0
    monthlySnapshot.forEach(doc => {
      grandTotal += doc.data().total_amount
    })

    const goalDoc = await goalCollection.doc("main").get()
    const goal = goalDoc.exists ? goalDoc.data().goal_amount : 0

    res.json({
      tempTotal,
      grandTotal,
      goal
    })
  } catch (error) {
    console.error("Error obteniendo resumen:", error)
    res.status(500).json({ error: "Error obteniendo resumen" })
  }
})

router.post("/login", (req, res) => {
  const { password } = req.body

  if (password === LOGIN_PASSWORD) {
    return res.json({ success: true, message: "Login exitoso" })
  }

  res.status(401).json({ message: "Contraseña incorrecta" })
})

router.post("/reset-all", async (req, res) => {
  const { password } = req.body

  if (password !== RESET_PASSWORD) {
    return res.status(401).json({ message: "No autorizado" })
  }

  try {
    const tempSnapshot = await donationsTemp.get()
    const monthlySnapshot = await monthlyTotals.get()

    const batch = db.batch()
    tempSnapshot.forEach(doc => batch.delete(doc.ref))
    monthlySnapshot.forEach(doc => batch.delete(doc.ref))
    await batch.commit()

    res.json({ message: "Sistema reiniciado correctamente" })
  } catch (error) {
    console.error("Error al reiniciar sistema:", error)
    res.status(500).json({ message: "Error al reiniciar" })
  }
})

router.post("/update-goal", async (req, res) => {
  const { password, goal } = req.body

  if (password !== GOAL_PASSWORD) {
    return res.status(401).json({ message: "No autorizado" })
  }

  if (!goal || goal <= 0) {
    return res.status(400).json({ message: "Meta inválida" })
  }

  try {
    await goalCollection.doc("main").set({
      goal_amount: parseFloat(goal),
      updated_at: new Date()
    })
    res.json({ message: "Meta actualizada", goal: parseFloat(goal) })
  } catch (error) {
    console.error("Error actualizando meta:", error)
    res.status(500).json({ message: "Error actualizando meta" })
  }
})

// Ruta de diagnóstico (opcional)
router.get("/routes", (req, res) => {
  const routes = []
  router.stack.forEach(layer => {
    if (layer.route) {
      routes.push({
        path: layer.route.path,
        methods: Object.keys(layer.route.methods)
      })
    }
  })
  res.json({ routes })
})

export default router