const logger = require("./winston-logger");

const dotenv = require('dotenv');
if (process.env.MODE != 'production'){
  dotenv.config()
}
const DATABASEURL = process.env.DATABASEURL;

const ContenedorCarrito = require('./contenedor-carrito');
const CarritoModel = require("./models/carrito")
const rutaConnect = DATABASEURL;
const Carritos = new ContenedorCarrito(rutaConnect, CarritoModel);

const ContenedorMongoDB = require("./ContenedorMongoDB.js");
const ProdModel = require("./models/productos")
const Productos = new ContenedorMongoDB(DATABASEURL, ProdModel);

const {enviarSMS, enviarWhatsapp, client, telADMIN, numeroSandbox} = require("./twilio")
const {enviarMail, transporter, mailADMIN} = require("./nodemailer")

const getCrearCarrito =async (req, res)=>{
res.render("crear-carrito")
}

const postCrearCarrito = async (req, res)=>{
  //viene de "Crear nuevo carrito" en vista de Nuestros Productos
  const id = await Carritos.crearCarritoVacio();
  try{
    const productos = await Productos.listarTodos();
    const todosProd = productos.map( (item) => (
      {
        _id: item._id,
        title:item.title,
        price:item.price,
        thumbnail:item.thumbnail,
      }
    ))
    logger.log("info", "/api/carrito - POST")  
    res.render("nuestros-productos", {data: {todosProd, id}})
  }
  catch(err){
    logger.log("error", "/nuestros-productos -  GET  - error al mostrar catálogo de productos")
  }
  //res.redirect(`/nuestros-productos/${id}`)
}

const postAgregarProdCarrito =  async (req, res)=>{
  const objetoProd = {
    id:req.body.idprod,
    title: req.body.title,
    price: req.body.price,
    thumbnail: req.body.thumbnail,
    quantity: req.body.unidades
  }

  const idcarrito = req.body.idcarrito;

  
    //toma el id del carrito, si lo hay, y agrega el producto. Si no hay un params de id, crea un carrito con el prod incorporado
    if(idcarrito){
      try{
        const carritoActualizado = await CarritoModel.findOneAndUpdate(
          {_id: idcarrito},
          { $push: {productos: objetoProd}},
          { new: true}) 
        res.redirect(`/api/carrito/${idcarrito}/productos`)
      }
      //const carritoActualizado = await Carritos.incorporarProdAlCarrito(carritoActualID, objetoProd)
      catch(err){
        logger.log("error", "no se pudo agregar producto al carrito existente")
      }
    }
        /*  
     else{
      try{
        const id = await Carritos.crearCarrito(objetoProd);
        res.redirect(`/api/carrito/${id}/productos`)
      }
      catch(err){
        logger.log("error", "no se pudo crear nuevo carrito agregando producto ")
      }
      }     
      */
}



const  getCarrito = async (req, res) => {
  const {id} = req.params;
  const idcarrito = id
  const prodCarrito = await CarritoModel.findOne({_id: id});
  const productos = prodCarrito.productos;
  const productosMap = productos.map( (item) => (
    {
      title:item.title,
      price:item.price,
      thumbnail:item.thumbnail,
      quantity:item.quantity,
    }
  ))
  res.render("carrito", {productosMap, idcarrito});
}



const deleteProdDelCarrito =  async (req, res)=>{
  const {id} = req.body;
  const {id_prod} = req.body;
  let carritoSinProducto = await Carritos.deleteProdDelCarrito(id, id_prod);
  const productos = carritoSinProducto.productos;
  console.log("carritoSinProducto.productos", carritoSinProducto.productos)
  const productosMap = productos.map( (item) => (
    {
      title:item.title,
      price:item.price,
      thumbnail:item.thumbnail,
      quantity:item.quantity,
    }
  ))
  res.render("carrito", {productosMap, id});


}

const deleteCarrito =  async (req, res)=>{
  const {id} = req.params
  let carritoEliminado = await Carritos.deleteCarritoById(id)

}


const confirmarPedido = async (req, res)=>{
  const { username, telefono, nombre } = req.user;
  const user = { username, telefono, nombre };
  const carritoID = req.body.idcarrito;

  //NODEMAILER al ADMIN
  logger.log("info", "carritoID", carritoID)
  const prodCarrito = await CarritoModel.findOne({_id: carritoID});
  const productos = prodCarrito.productos;
  const listaPedido = productos.map( (item) => (
    `<li> ${item.title}   $${item.price}   x   ${item.quantity} u.</li>`))
  const bodyPedido =  
  `<div>
  <p>Nuevo pedido de ${user.nombre} ( ${user.username} )</p>
  <p>Productos:</p>
    <ul>
    <ul>
      ${listaPedido}
    </ul>
    </div>`
  const mailOptionsNuevoPedido = {
    from: 'App Tienda',
    to: mailADMIN,
    subject:`Nuevo pedido de ${user.nombre} ( ${user.username} )`,
    html: bodyPedido
  }
  const emailReg = await enviarMail(mailOptionsNuevoPedido)

  //TWILIO WHATSAPP al ADMIN
  const whatsappBody = `Nuevo pedido de ${user.nombre} ( ${user.username} )`
  const whatsappMensaje = 
      { 
         body: whatsappBody, 
         from: numeroSandbox,       
         to: telADMIN
       }
  //const whatsPedido = await enviarWhatsapp(whatsappMensaje);
  

  //TWILIO SMS al USER
  const telUSER = user.telefono;
  const mensajeTwilio = {
    body: `Su pedido ${carritoID} ha sido recibido y se encuentra en proceso`,
    from: '+12707137190',
    to: telUSER
 }
 const smsPedidoUsuario = await enviarSMS(mensajeTwilio);

 res.render("pedido-exitoso")
}

module.exports = {
  getCrearCarrito,
  postCrearCarrito,
  getCarrito,
  postAgregarProdCarrito,
  deleteCarrito,
  deleteProdDelCarrito,
  confirmarPedido
  };