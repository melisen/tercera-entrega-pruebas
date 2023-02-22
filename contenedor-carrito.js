const  {mongoose}  = require("mongoose");
const  {connect}  = require("mongoose");
const logger = require("./winston-logger");

mongoose.set('strictQuery', false)

class ContenedorCarrito{
    constructor( rutaConnect, modelo){
        this.rutaConnect = rutaConnect;
        this.modelo = modelo;
        //this.childmodel = childmodel;
    }

    async connectMG() {
        try {
          await connect(this.rutaConnect, { useNewUrlParser: true });
        } catch (e) {
          console.log(e);
          throw 'cannot connect to the db';
        }
      }


    

    async listarTodos(){
        //ver todos los carritos
        const todos = await this.modelo.find({})
        return todos
    }

    async crearCarritoVacio(){
      try{
        const nuevoCarrito = new this.modelo({
          productos: []
        });

        const objCarrito = await nuevoCarrito.save() 
        return objCarrito._id 
      } catch(err){
        logger.log("error", "error al crear carrito")      
      }     
    }
      
    async crearCarrito(objetoProd){
      try{
        const nuevoCarrito = new this.modelo({
          productos: [objetoProd]
        });

        const objCarrito = await nuevoCarrito.save() 
        return objCarrito._id 
      } catch(err){
        logger.log("error", "error al crear carrito")      
      }      
    }

/*
    async buscarUltimoCarrito(){
        let ultimoCarritoID = await this.modelo.find({}).sort({_id: -1}).limit(1)
        return ultimoCarritoID._id
    }
    */

    
    async buscarPorId(_id){
  const element = await this.modelo.findOne({_id: _id});
  return element
    }
    

    async incorporarProdAlCarrito(id, objetoProd){
      //Adding Subdocs to Arrays
      //modelopadre.modelohijo.push({objeto});
      const carritoActualizado = await this.modelo.findOneAndUpdate(
        {_id: id},
        { $push: {productos: objetoProd}},
        { new: true}) 
        return carritoActualizado
        //set the new option to true to return the document after update was applied.
      //const insertar = await this.modelo.findById(idCarrito).productos.push(objetoProd);
    }

    async deleteProdDelCarrito(id, id_prod){
      // interactuar con botón eliminar de la tabla del carrito
      const carritoActualizado = await this.modelo.findOneAndUpdate(
        { '_id': id }, 
        { $pull: { productos: { _id: id_prod } } },
        false, // Upsert
        true, // Multi
    );
    return carritoActualizado
    }
    

    async deleteCarritoById(_id){

    }


    async borrarTodosLosCarritos(){ 
      //const todos = await this.modelo.deleteMany({})
    }

}

module.exports = ContenedorCarrito