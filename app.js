const express = require('express')
const app = express()
app.use(express.json)
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')
const dbpath = path.join(__dirname, 'userData.db')
let db = null
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB error ${e.message')
    process.exit(1)
  }
}
initializeDBandServer()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const createUserQuery = `
      INSERT INTO 
        user (username, name, password, gender, location) 
      VALUES 
        (
          '${username}', 
          '${name}',
          '${hashedPassword}', 
          '${gender}',
          '${location}'
        )`
    const dbResponse = await db.run(createUserQuery)
    const newUserId = dbResponse.lastID
    response.send(`Created new user with ${newUserId}`)
  } else {
    response.status = 400
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  let {username, password} = request.body
  let dbusername = `SELECT * FROM USER WHERE username=${username}`
  let data = await db.get(dbusername)
  if (data.username === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    let compare = await bcrypt.compare(password, data.password)
    if (compare === true) {
      response.status(200)
      response.send('Login Successfull')
    } else {
      response.send('Invalid password')
      response.status(400)
    }
  }
})

app.put('/change-password', async (request, response) => {
  let {username, oldPassword, newPassword} = request.body
  let query = `SELECT * FROM user WHERE username=${username}`
  let data = await db.get(query)
  if (data.username === undefined) {
    response.status(400)
    response.send('User not Registered')
  } else {
    const comparepswd = await bcrypt.compare(oldPassword, data.password)
    if (comparepswd === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        let hashedpswd = await bcrypt.hash(newPassword, 10)
        let sqlquery = `UPDATE user SET 'password'='${hashedpswd}'`
        await db.run(sqlquery)
        response.status(200)
        response.send('Password Updated')
      }
    } else {
      response.status(400)
      response.send('Invalid Current Password')
    }
  }
})
module.exports = app
