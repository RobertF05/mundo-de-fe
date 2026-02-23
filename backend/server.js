import express from 'express'
import cors from 'cors'
import donationRoutes from './routes/donations.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', donationRoutes)

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000')
})