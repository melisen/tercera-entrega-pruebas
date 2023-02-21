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
  console.log("idcarrito en postAgregarProdCarrito", idcarrito)
  
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
  res.render("carrito", {productosMap, id});
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

module.exports = {
  getCrearCarrito,
  postCrearCarrito,
  getCarrito,
  postAgregarProdCarrito,
  deleteCarrito,
  deleteProdDelCarrito
  };