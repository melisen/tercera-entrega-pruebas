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


const getCrearCarrito =async (req, res)=>{
res.render("crear-carrito")
}

const postCrearCarrito = async (req, res)=>{
  //viene de "Crear nuevo carrito" en vista de Nuestros Productos
  const id = await Carritos.crearCarritoVacio();
  res.redirect(`/nuestros-productos/${id}`)
}

const postCarrito =  async (req, res)=>{
  const objetoProd = {
    id:req.body.idprod,
    title: req.body.title,
    price: req.body.price,
    thumbnail: req.body.thumbnail,
    quantity: req.body.unidades
  }

  const idcarrito = req.body.idcarrito;
  console.log(idcarrito)
  
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
          
    } else{
      try{
        const id = await Carritos.crearCarrito(objetoProd);
        res.redirect(`/api/carrito/${id}/productos`)
      }
      catch(err){
        logger.log("error", "no se pudo crear nuevo carrito agregando producto ")
      }
      }     
}



const  getCarrito = async (req, res) => {
  const {id} = req.params;
  //const prodCarrito = await CarritoModel.findById(id).productos;
  const prodCarrito = await CarritoModel.findOne({_id: id});
  const productos = prodCarrito.productos;
  console.log(productos)
  //const prodCarrito = await CarritoModel.findOne({_id: id}, {productos})
  console.log("productos", productos)
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
  const {id} = req.params;
  const {id_prod} = req.params;
  let productoEliminado = await Carritos.deleteProdDelCarrito(id, id_prod)

}

const deleteCarrito =  async (req, res)=>{
  const {id} = req.params
  let carritoEliminado = await Carritos.deleteCarritoById(id)

}

module.exports = {
  getCrearCarrito,
  postCrearCarrito,
  getCarrito,
  postCarrito,
  deleteCarrito,
  deleteProdDelCarrito
  };