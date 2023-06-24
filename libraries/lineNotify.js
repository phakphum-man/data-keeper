const axios = require('axios');

function sendMessage(access_token, message) {
    const formdata = {
        message: `\n${message}`
    };

    axios.post('https://notify-api.line.me/api/notify', formdata,
    {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${access_token}`
        }
    }
    )
    .then(response => response.data)
    .then(data => {
        console.log(`send to line => ${data.message}`);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

module.exports = {
    sendMessage: sendMessage,
};