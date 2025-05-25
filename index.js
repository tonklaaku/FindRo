import express from 'express'
import fetch from 'node-fetch'

const app = express()
app.use(express.json())

app.get("/", (req, res) => {
  res.send("✅ Roblox API Online")
})

// Endpoint สำหรับ Roblox เรียก
app.post('/findUser', async (req, res) => {
  const username = req.body.username
  if (!username) return res.status(400).json({ error: 'No username provided' })

  try {
    // STEP 1: Get UserId
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    })
    const userData = await userRes.json()
    if (!userData.data || userData.data.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const userId = userData.data[0].id

    // STEP 2: Get presence info
    const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [userId] })
    })
    const presenceData = await presenceRes.json()
    const presenceInfo = presenceData.userPresences[0]

    if (!presenceInfo.placeId || !presenceInfo.gameId)
      return res.status(404).json({ error: 'User not in a game' })

    // ✅ ตอบกลับ placeId และ jobId
    res.json({
      placeId: presenceInfo.placeId,
      jobId: presenceInfo.gameId
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})