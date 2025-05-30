import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.send("✅ Roblox API Online")
})

app.post('/findUser', async (req, res) => {
  const username = req.body.username
  if (!username) return res.status(400).json({ error: 'No username provided' })

  try {
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    })
    if (!userRes.ok) throw new Error('Failed to fetch userId')

    const userData = await userRes.json()
    console.log('User Data:', userData)

    if (!userData.data || userData.data.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const userId = userData.data[0].id

    const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [userId] })
    })
    if (!presenceRes.ok) throw new Error('Failed to fetch presence info')

    const presenceData = await presenceRes.json()
    console.log('Presence Data:', presenceData)

    const presenceInfo = presenceData.userPresences && presenceData.userPresences[0]

    if (!presenceInfo || !presenceInfo.placeId || !presenceInfo.gameId)
      return res.status(404).json({ error: 'User not in a game or presence not found' })

    res.json({
      placeId: presenceInfo.placeId,
      jobId: presenceInfo.gameId
    })

  } catch (err) {
    console.error('Internal server error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
