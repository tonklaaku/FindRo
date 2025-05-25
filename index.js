import express from 'express'
import fetch from 'node-fetch'

const app = express()
app.use(express.json())

// Root route เช็คสถานะ API
app.get("/", (req, res) => {
  res.send("✅ Roblox API Online")
})

// Endpoint /findUser รับ username แล้วดึง userId และ presence info
app.post('/findUser', async (req, res) => {
  const username = req.body.username
  if (!username) return res.status(400).json({ error: 'No username provided' })

  try {
    // STEP 1: แปลงชื่อ username เป็น userId
    const userRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
    })
    const userData = await userRes.json()

    // Debug: แสดงข้อมูล user ที่ได้
    console.log('User Data:', userData)

    if (!userData.data || userData.data.length === 0)
      return res.status(404).json({ error: 'User not found' })

    const userId = userData.data[0].id

    // STEP 2: ดึงข้อมูล presence ของ userId
    const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [userId] })
    })
    const presenceData = await presenceRes.json()

    // Debug: แสดงข้อมูล presence ที่ได้
    console.log('Presence Data:', presenceData)

    const presenceInfo = presenceData.userPresences[0]

    // ถ้า user ไม่มี placeId หรือ gameId (ไม่ได้เล่นเกม)
    if (!presenceInfo || !presenceInfo.placeId || !presenceInfo.gameId)
      return res.status(404).json({ error: 'User not in a game or presence not found' })

    // ส่งกลับ placeId และ jobId (gameId)
    res.json({
      placeId: presenceInfo.placeId,
      jobId: presenceInfo.gameId
    })

  } catch (err) {
    console.error('Internal server error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ตั้ง port และเริ่ม server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
