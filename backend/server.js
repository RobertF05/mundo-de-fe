import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import donationRoutes from './routes/donations.js'  // ← Todas las rutas están aquí

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

console.log("ENV TEST:", process.env.FIREBASE_PRIVATE_KEY)

app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

app.use('/api', donationRoutes)  // ← Esto monta TODAS las rutas

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
  console.log(`Rutas disponibles:`)
  console.log(`  - POST /api/add`)
  console.log(`  - GET /api/temp-total`)
  console.log(`  - POST /api/upload-month`)
  console.log(`  - POST /api/reset-temp`)
  console.log(`  - GET /api/admin-summary`)
  console.log(`  - POST /api/login`)
  console.log(`  - POST /api/reset-all`)
  console.log(`  - POST /api/update-goal`)
})