const logger = require("./winston-logger");

//TWILIO SMS
const twilio = require("twilio")
const accountSid = 'AC9f0100a4191e83d52be74ccf5cfd1a0c'
const authToken = '084387c819984a026f60e108f4a7a84e'

const client = twilio(accountSid, authToken)

/*
EJ PARA RELLENAR client.messages.create()
const mensaje = {
    body: 'Hola soy un SMS desde Node.js!',
    from: '+14156884237',
    to: 'telADMIN'
 }
 */
const telADMIN = '+5491127204753'
async function enviarSMS(mensaje){
    try {
        const message = await client.messages.create(mensaje)
        logger.log("info", message)
     } catch (error) {
       logger.log("error", error)
     }
}

//TWILIO WHATSAPP
const whatsappADMIN = 'whatsapp:+5491127204753'
const numeroSandbox = 'whatsapp:+14155238886'

 

/*
EJ PARAMETRO DE clientWhatsapp.messages.create()
const mensajeWhats = { 
         body: 'Your appointment is coming up on July 21 at 3PM', 
         from: 'whatsapp:+14155238886',       
         to: 'whatsapp:+5491127204753' 
       }
*/
async function enviarWhatsapp(mensajeWhats){  
  try {
    const message = await client.messages.create(mensajeWhats)
    logger.log("info", message)
 } catch (error) {
   logger.log("error", error)
 }
}

module.exports = {enviarSMS, enviarWhatsapp, client, telADMIN, whatsappADMIN, numeroSandbox}



