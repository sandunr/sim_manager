const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_ACCESS_KEY_ID,
  apiSecret: process.env.VONAGE_SECRET_KEY
});

module.exports = {
    sendSMS: async () => {
        const from = "19167607848"
        const to = "14257734887"
        const text = 'A text message sent using the Vonage SMS API'

        await vonage.sms.send({to, from, text})
            .then(resp => { console.log('Message sent successfully'); console.log(resp); })
            .catch(err => { console.log('There was an error sending the messages.'); console.error(err); });
    }
};