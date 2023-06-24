require('dotenv').config();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const line = require("../libraries/lineNotify");

module.exports = function (app) {
  const client_id = process.env.LINE_CLIENT_ID;
  const callback_uri = process.env.LINE_CALLBACK_URI;
  const state = uuidv4();
  const redirect_uri = encodeURIComponent(callback_uri);
  app.get('/linenotify/', (req, res) => {
    const content = `<a href="https://notify-bot.line.me/oauth/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=notify&state=${state}">
    รับการแจ้งเตือนผ่าน LINE Notify
</a>`;
    return res.status(200).send(content);
  });

  app.get('/linenotify/callback', (req, res) => {
    const client_id = process.env.LINE_CLIENT_ID;
    const client_secret = process.env.LINE_CLIENT_SECRET;
    const callback_uri = process.env.LINE_CALLBACK_URI;
    const redirect_uri = callback_uri;
    const formdata = {
      grant_type:'authorization_code',
      code: req.query.code || null,
      redirect_uri : redirect_uri,
      client_id: client_id,
      client_secret : client_secret
    };
    
    axios.post('https://notify-bot.line.me/oauth/token', formdata,
      { headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    )
    .then(response => response.data)
    .then(data => {
      line.sendMessage(data.access_token, 'ทดสอบ line notify.');
      res.status(200).send("ทดสอบ line notify.");
    })
    .catch((error) => {
      console.error('Error:', error);
      res.status(500).send(error);
    });
  });
}