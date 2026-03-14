import express from "express"
import { db } from "../firebaseClient.js"

const router = express.Router()

const LOGIN_PASSWORD = "123"
const RESET_PASSWORD = "123"
const GOAL_PASSWORD = "123"
const TRANSACTION_PASSWORD = "123"

const donationsTemp = db.collection("donations_temp")
const monthlyTotals = db.collection("monthly_totals")
const goalCollection = db.collection("goal")

router.get("/test-firestore", async (req, res) => {
  try {

    const test = await db.collection("test").add({
      message: "conexion exitosa",
      date: new Date()
    })

    res.json({
      success: true,
      id: test.id
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: error.message
    })

  }
})

// Agregar donación temporal
router.post("/add", async (req, res) => {

  const { amount, password } = req.body

  if (password !== TRANSACTION_PASSWORD) {
    return res.status(401).json({ message: "No autorizado" })
  }

  try {

    await donationsTemp.add({
      amount: Number(amount),
      created_at: new Date()
    })

    res.json({ message: "Donación agregada" })

  } catch (error) {

    res.status(500).json({ error: "Error agregando donación" })

  }

})


// Obtener acumulado temporal
router.get("/temp-total", async (req, res) => {

  const snapshot = await donationsTemp.get()

  let total = 0

  snapshot.forEach(doc => {
    total += doc.data().amount
  })

  res.json({ total })

})


// Subir acumulado a mensual
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

    // obtener temporal
    const tempSnapshot = await donationsTemp.get()

    let tempTotal = 0

    tempSnapshot.forEach(doc => {
      tempTotal += doc.data().amount
    })

    if (tempTotal === 0) {
      return res.json({ message: "No hay acumulado para subir" })
    }

    const monthRef = monthlyTotals.doc(monthId)
    const monthDoc = await monthRef.get()

    if (monthDoc.exists) {

      const newTotal =
        monthDoc.data().total_amount + tempTotal

      await monthRef.update({
        total_amount: newTotal
      })

    } else {

      await monthRef.set({
        month,
        year,
        total_amount: tempTotal,
        uploaded_at: new Date()
      })

    }

    // limpiar temporal
    const batch = db.batch()

    tempSnapshot.forEach(doc => {
      batch.delete(doc.ref)
    })

    await batch.commit()

    res.json({ message: "Acumulado subido correctamente" })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error al subir acumulado"
    })

  }

})


// Obtener total general
router.get("/grand-total", async (req, res) => {

  const snapshot = await monthlyTotals.get()

  let total = 0

  snapshot.forEach(doc => {
    total += doc.data().total_amount
  })

  const goalDoc = await goalCollection.doc("main").get()

  res.json({
    total,
    goal: goalDoc.data().goal_amount
  })

})


// Resumen admin
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

    res.json({
      tempTotal,
      grandTotal,
      goal: goalDoc.data().goal_amount
    })

  } catch (error) {

    res.status(500).json({
      error: "Error obteniendo resumen"
    })

  }

})


// Login
router.post("/login", (req, res) => {

  const { password } = req.body

  if (password === LOGIN_PASSWORD) {
    return res.json({ success: true })
  }

  res.status(401).json({
    message: "Contraseña incorrecta"
  })

})


// Reset todo
router.post("/reset-all", async (req, res) => {

  const { password } = req.body

  if (password !== RESET_PASSWORD) {
    return res.status(401).json({
      message: "No autorizado"
    })
  }

  try {

    const tempSnapshot = await donationsTemp.get()
    const monthlySnapshot = await monthlyTotals.get()

    const batch = db.batch()

    tempSnapshot.forEach(doc => batch.delete(doc.ref))
    monthlySnapshot.forEach(doc => batch.delete(doc.ref))

    await batch.commit()

    res.json({
      message: "Contador reiniciado"
    })

  } catch (error) {

    res.status(500).json({
      message: "Error al reiniciar"
    })

  }

})


// Actualizar meta
router.post("/update-goal", async (req, res) => {

  const { password, goal } = req.body

  if (password !== GOAL_PASSWORD) {
    return res.status(401).json({
      message: "No autorizado"
    })
  }

  try {

    await goalCollection.doc("main").set({
      goal_amount: Number(goal)
    })

    res.json({
      message: "Meta actualizada"
    })

  } catch (error) {

    res.status(500).json({
      message: "Error actualizando meta"
    })

  }

})

export default router
