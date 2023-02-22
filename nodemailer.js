const logger = require("./winston-logger");

//NODEMAILER
const mailADMIN = "melina.senorans@gmail.com"


const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: 'gmail',
  port: 587,
  auth: {
      user: 'melina.senorans@gmail.com',
      pass: 'vrezoyzaszrufihs'
  }
});


async function enviarMail(options){
  try {
    const info = await transporter.sendMail(options)
    logger.log("info", info)
 } catch (err) {
    logger.log("error", err)
 } 
}


module.exports = {enviarMail, transporter, mailADMIN}