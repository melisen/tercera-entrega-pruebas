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
    




    async borrarTodosLosCarritos(){ 
      //const todos = await this.modelo.deleteMany({})
    }

}

module.exports = ContenedorCarrito