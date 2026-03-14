import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import donationRoutes from './routes/donations.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => {
  res.status(200).send("OK")
})

app.use('/api', donationRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})