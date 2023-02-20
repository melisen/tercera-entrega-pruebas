const mongoose = require("mongoose");

const ProductoAlCarrito = new mongoose.Schema({
  title: { type: String, required: true, max: 100 },
  price: { type: Number, required: true },
  thumbnail: { type: String, required: true, max: 10000 },
  quantity: { type: Number, required: true }
});

const CarritoSchema = new mongoose.Schema({
    productos: [ProductoAlCarrito],
},
{ timestamps: true });

const CarritoModel = mongoose.model("carritos", CarritoSchema);
module.exports = CarritoModel;

/*const childSchema = new Schema({ name: 'string' });
const parentSchema = new Schema({
  // Array of subdocuments
  children: [childSchema],
  // Single nested subdocuments
  child: childSchema
});
*/
