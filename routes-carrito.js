const logger = require("./winston-logger");

const dotenv = require('dotenv');
if (process.env.MODE != 'production'){
  dotenv.config()
}
const DATABASEURL = process.env.DATABASEURL;

const ContenedorCarrito = require('./contenedor-carrito');
const CarritoModel = require("./models/carrito")
const rutaConnect = DATABASEURL;
const Carritos = new ContenedorCarrito(rutaConnect, );

const ContenedorMongoDB = require("./ContenedorMongoDB.js");
const ProdModel = require("./models/productos")
const Productos = new ContenedorMongoDB(DATABASEURL, ProdModel);
CarritoModel
const {enviarSMS, enviarWhatsapp, client, telADMIN, whatsappADMIN, numeroSandbox} = require("./twilio")
const {enviarMail, transporter, mailADMIN} = require("./nodemailer")
const Usuarios = require("./models/usuarios")



const postCrearCarrito = async (req, res)=>{
  //viene de "Crear nuevo carrto" en vista de Nuestros Productos

  try{
    const nuevoCarrito = new CarritoModel({
      productos: []
    });

    const objCarrito = await nuevoCarrito.save()
    const id =  objCarrito._id
    const {username} = req.user;    
    const carritoAlUser = await Usuarios.findOneAndUpdate(
      {username: username},
      { $set: {carritoactual: id}})
      // The $set operator replaces the value of a field with the specified value. 
      // para cambiar si fuera un array de ids de carritos -->{ $push: {carritos: objCarrito._id}})      
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
}

const postAgregarProdCarrito =  async (req, res)=>{
  const objetoProd = {
    _id:req.body.idprod,
    title: req.body.title,
    price: req.body.price,
    thumbnail: req.body.thumbnail,
    quantity: req.body.unidades
  }      
      const {username} = req.user;
      const usuario = await Usuarios.findOne({username: username})
      const idcarrito = usuario.carritoactual;      
      const carrito = await CarritoModel.findOne({_id: idcarrito})
      const arrProductos = carrito.productos;   
      const estaProducto = arrProductos.find(element => element._id == objetoProd._id)
      
      if(estaProducto){   
        let cantPrevia = parseInt(estaProducto.quantity);
        let cantSumar = parseInt(objetoProd.quantity)  
        const nuevaCant = cantPrevia + cantSumar;
        arrProductos.find(element => element._id == objetoProd._id).quantity = nuevaCant
        const cantActualizada = await CarritoModel.findOneAndUpdate(
          {_id: idcarrito},
          { $set: {productos: arrProductos}},
          { new: true}) 
          //const importeTotal = arrProductos.reduce((acc, elemento) => acc + elemento.price*elemento.quantity, 0)
          //logger.log("info", "importeTotal", importeTotal)
          res.redirect(`/api/carrito/${idcarrito}/productos/`)
      } else{
        try{
          const carritoActualizado = await CarritoModel.findOneAndUpdate(
            {_id: idcarrito},
            { $push: {productos: objetoProd}},
            { new: true}) 
          res.redirect(`/api/carrito/${idcarrito}/productos/`)
        }
        catch(err){
          logger.log("error", "no se pudo agregar producto al carrito existente")
        }
      }
      
      
      
  }



const  getCarrito = async (req, res) => {
  const {id} = req.params;
  const {username} = req.user;
  const idcarrito = id
  const prodCarrito = await CarritoModel.findOne({_id: id});
  const productos = prodCarrito.productos;
  const productosMap = productos.map( (item) => (
    {
      _id: item._id,
      title:item.title,
      price:item.price,
      thumbnail:item.thumbnail,
      quantity:item.quantity,
    }
  ))
  res.render("carrito", {productosMap, idcarrito, username});
}



const deleteProdDelCarrito =  async (req, res)=>{
  const {idprod} = req.body;
  const {username} = req.user;
  const usuario = await Usuarios.findOne({username: username})
  const idcarrito = usuario.carritoactual;  
  const carrito = await CarritoModel.findOne({_id: idcarrito})
      const arrProductos = carrito.productos; 
      try{
        const nuevoArr = arrProductos.filter(element => element._id != idprod)
        logger.log("info", nuevoArr)
        const carritoActualizado = await CarritoModel.findOneAndUpdate(
          {_id: idcarrito},
          { $set: {productos: nuevoArr}},
          { new: true}) 
      }        
        catch(err){
          logger.log("error", "no se pudo eliminar producto del carrito ")
        }
        
  /*
  let carritoSinProducto = await CarritoModel.updateOne(
    { _id: idcarrito }, 
    { $pull: { productos: { _id: id_prod } } },
    { new: true}
  )
  */
  res.redirect("/ver-carrito")
}

const deleteCarrito =  async (req, res)=>{
  const {username} = req.user;
  const usuario = await Usuarios.findOne({username: username})
  const idcarrito = usuario.carritoactual; 
  let carritoEliminado = await CarritoModel.deleteOne({ _id: idcarrito })
  const carritoAlUser = await Usuarios.findOneAndUpdate(
    {username: username},
    { $set: {carritoactual: "vacío"}})
    res.redirect("/login")

}


const confirmarPedido = async (req, res)=>{
  const {username} = req.user;
  const usuario = await Usuarios.findOne({username: username})
  const user = {
    username:usuario.username,
    password:usuario.password, 
    telefono:usuario.telefono, 
    nombre:usuario.nombre, 
    apellido:usuario.apellido, 
    avatar:usuario.avatar, 
    edad:usuario.edad, 
    direccion:usuario.direccion
    }  //buscar el user en la base de datos y extraer el dato telefono

  const carritoID = req.body.idcarrito;
  

  //NODEMAILER al ADMIN
  logger.log("info",  carritoID)
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
         to: whatsappADMIN
       }
  const whatsPedido = await enviarWhatsapp(whatsappMensaje);
  

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
  postCrearCarrito,
  getCarrito,
  postAgregarProdCarrito,
  deleteCarrito,
  deleteProdDelCarrito,
  confirmarPedido
  };