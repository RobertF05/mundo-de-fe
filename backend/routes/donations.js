import express from 'express'
import { supabase } from '../supabaseClient.js'

const router = express.Router()

const LOGIN_PASSWORD = "123"
const RESET_PASSWORD = "123"
const GOAL_PASSWORD = "123"
const TRANSACTION_PASSWORD = "123"

// Agregar donación temporal
router.post('/add', async (req, res) => {
  const { amount, password } = req.body

  if (password !== TRANSACTION_PASSWORD) {
    return res.status(401).json({ message: "No autorizado" })
  }

  const { error } = await supabase
    .from('donations_temp')
    .insert([{ amount }])

  if (error) return res.status(500).json(error)

  res.json({ message: 'Donación agregada' })
})

// Obtener acumulado temporal
router.get('/temp-total', async (req, res) => {
  const { data } = await supabase
    .from('donations_temp')
    .select('amount')

  const total = data.reduce((sum, d) => sum + Number(d.amount), 0)

  res.json({ total })
})

// Subir acumulado a mensual
router.post('/upload-month', async (req, res) => {
  try {
    const { password } = req.body

    if (password !== TRANSACTION_PASSWORD) {
      return res.status(401).json({ message: "No autorizado" })
    }

    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    // 1️⃣ Obtener total temporal
    const { data: tempData, error: tempError } = await supabase
      .from('donations_temp')
      .select('amount')

    if (tempError) throw tempError

    const tempTotal = tempData.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )

    if (tempTotal === 0) {
      return res.json({ message: "No hay acumulado para subir" })
    }

    // 2️⃣ Buscar si ya existe registro del mes actual
    const { data: existingMonth } = await supabase
      .from('monthly_totals')
      .select('*')
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (existingMonth) {
      // 3️⃣ Si existe → actualizar sumando
      const newTotal = Number(existingMonth.total_amount) + tempTotal

      await supabase
        .from('monthly_totals')
        .update({ total_amount: newTotal })
        .eq('id', existingMonth.id)

    } else {
      // 4️⃣ Si no existe → insertar
      await supabase
        .from('monthly_totals')
        .insert([{
          month,
          year,
          total_amount: tempTotal
        }])
    }

    // 5️⃣ Reiniciar acumulado
    await supabase
      .from('donations_temp')
      .delete()
      .not('id', 'is', null)

    res.json({ message: 'Acumulado subido correctamente' })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al subir acumulado" })
  }
})

// Obtener total general
router.get('/grand-total', async (req, res) => {
  const { data } = await supabase
    .from('monthly_totals')
    .select('total_amount')

  const total = data.reduce((sum, d) => sum + Number(d.total_amount), 0)

  const { data: goalData } = await supabase
    .from('goal')
    .select('goal_amount')
    .single()

  res.json({
    total,
    goal: goalData.goal_amount
  })
})

// Obtener resumen completo para admin
router.get('/admin-summary', async (req, res) => {
  try {
    // Acumulado temporal
    const { data: tempData } = await supabase
      .from('donations_temp')
      .select('amount')

    const tempTotal = tempData.reduce(
      (sum, d) => sum + Number(d.amount),
      0
    )

    // Total mensual acumulado
    const { data: monthlyData } = await supabase
      .from('monthly_totals')
      .select('total_amount')

    const grandTotal = monthlyData.reduce(
      (sum, d) => sum + Number(d.total_amount),
      0
    )

    // Meta
    const { data: goalData } = await supabase
      .from('goal')
      .select('goal_amount')
      .single()

    res.json({
      tempTotal,
      grandTotal,
      goal: goalData.goal_amount
    })

  } catch (error) {
    res.status(500).json({ error: "Error obteniendo resumen" })
  }
})

router.post('/login', (req, res) => {
  const { password } = req.body

  if (password === LOGIN_PASSWORD) {
    return res.json({ success: true })
  }

  res.status(401).json({ message: "Contraseña incorrecta" })
})

router.post('/reset-all', async (req, res) => {
  const { password } = req.body

  if (password !== RESET_PASSWORD) {
    return res.status(401).json({ message: "No autorizado" })
  }

  try {
    await supabase.from('donations_temp').delete().not('id', 'is', null)
    await supabase.from('monthly_totals').delete().not('id', 'is', null)

    res.json({ message: "Contador reiniciado" })
  } catch (error) {
    res.status(500).json({ message: "Error al reiniciar" })
  }
})

router.post('/update-goal', async (req, res) => {
  const { password, goal } = req.body

  if (password !== GOAL_PASSWORD) {
    return res.status(401).json({ message: "No autorizado" })
  }

  try {
    await supabase.from('goal').delete().not('id', 'is', null)

    await supabase.from('goal').insert([{ goal_amount: goal }])

    res.json({ message: "Meta actualizada" })
  } catch (error) {
    res.status(500).json({ message: "Error actualizando meta" })
  }
})

export default router