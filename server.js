
const express = require("express")
const session = require("express-session");
const {Server: HTTPServer} = require("http")
const {Server: IOServer} = require("socket.io");
const {faker} = require("@faker-js/faker");
const  {mongoose}  = require("mongoose");
const Usuarios = require("./models/usuarios");
const handlebars = require('express-handlebars');
const routes = require("./routes");
const routesCarrito = require("./routes-carrito");
const routeInfo = require("./routeInfo");
const routeFork = require("./routeFork");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const {normalizr, normalize, schema, denormalize} = require("normalizr");
const bcrypt = require("bcrypt");
const parseArgs = require("minimist");
const logger = require("./winston-logger");

const dotenv = require('dotenv');
if (process.env.MODE != 'production'){
  dotenv.config()
}

const MODE = process.env.MODE;
const DATABASEURL = process.env.DATABASEURL;
const PORT = process.env.PORT;
let HOST = '0.0.0.0';




//const argsPORT = parseArgs(process.argv.slice(2));
//const PORT = process.argv[2];

const app = express()


const httpServer = new HTTPServer(app)
const io = new IOServer(httpServer)

app.use(express.urlencoded({extended: true}))
app.use(express.json());

//PERSISTENCIA PRODUCTOS
const ContenedorMongoDB = require("./ContenedorMongoDB.js");
const ProdModel = require("./models/productos")
const Productos = new ContenedorMongoDB(DATABASEURL, ProdModel);


// PERSISTENCIA MENSAJES
const ContenedorFS =  require('./contenedor-fs.js');
const mensajesFS = new ContenedorFS('./mensajes.json')




app.use(express.static((__dirname,'views')));

//*HANDLEBARS
app.set('views', './views/')
 const hbs = handlebars.engine({
  defaultLayout: "index.hbs",
   extname: "hbs",
   layoutsDir: "./views/layouts/",
   partialsDir: "./views/partials"
 });
 app.engine("hbs", hbs);
 app.set("view engine", "hbs");



//SESSION
const MongoStore = require("connect-mongo");
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: DATABASEURL,
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
      socket: {
        port: PORT,
        host: HOST,
      },
      cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 600000, //10 min
      }
  }),
  secret: "secreto",
  resave: false,
  saveUninitialized: false
  })
);



mongoose
  .connect(DATABASEURL)
  .then(() => logger.log("info", "Connected to DB"))
  .catch((e) => {
    console.error(e);
    throw "cannot connect to DB";
  });


 
 

function isValidPassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

function createHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

passport.use(
  "login",
  new LocalStrategy((username, password, done) => {
    Usuarios.findOne({ username }, (err, user) => {
      if (err) return done(err);

      if (!user) {
        console.log("User Not Found with username " + username);
        return done(null, false);
      }

      if (!isValidPassword(user, password)) {
        console.log("Invalid Password");
        return done(null, false);
      }

      return done(null, user);
    });
  })
);

passport.use(
  "signup",
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      Usuarios.findOne({ username: username }, function (err, user) {
        if (err) {
          logger.log("error", "Error in SignUp ");
          return done(err);
        }

        if (user) {
          logger.log("error", "User already exists");
          return done(null, false);
        }

        const newUser = {
          username: username,
          password: createHash(password),
          nombre: req.body.nombre,
          apellido: req.body.apellido,
          edad: req.body.edad,
          direccion: req.body.direccion,
          telefono: req.body.telefono,
          avatar: req.body.avatar,
          carritoactual: "vacío"
        };
        Usuarios.create(newUser, (err, userWithId) => {
          if (err) {
            logger.log("error", "Error in Saving user in Usuarios ");
            return done(err);
          }

          logger.log("info", user);
          logger.log("info", "User Registration succesful");
          return done(null, userWithId);
        });
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  Usuarios.findById(id, done);
});

app.use(passport.initialize());
app.use(passport.session());


//crear productos random para "/productos-test"
let listaProductos = [];
function crearProductosRandom(){
    for(let i=0; i<5; i++){
        listaProductos.push( 
            {
                title: faker.commerce.product().toString(),
                price: faker.commerce.price(100, 200, 0, '$').toString(),
                thumbnail: faker.image.imageUrl(100, 100).toString()
            } 
        )
    }
    return listaProductos;
}







//RUTAS

app.get("/", 
routes.getRoot,
 )

app.get("/login", routes.getLogin);
app.post("/login",
  passport.authenticate("login", { failureRedirect: "/faillogin" }),
  routes.postLogin
);
app.get("/faillogin", routes.getFaillogin);

app.get("/signup", routes.getSignup);
app.post("/signup",
  passport.authenticate("signup", { failureRedirect: "/failsignup" }),
  routes.postSignup
);
app.get("/failsignup", routes.getFailsignup);


  function auth(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      logger.log("error", "error en auth")
      res.redirect("/login");
    }
  }


  app.get('/api/nuestros-productos', auth, async (req, res)=>{
    try{
      const productos = await Productos.listarTodos();
    const todosProd = productos.map( (item) => (
      {
        _id: item._id,
        title:item.title,
        price:item.price,
        thumbnail:item.thumbnail,
        category:item.category
      }
    ))
    logger.log("info", "/api/nuestros-productos - GET")  
    res.render("nuestros-productos", {data: {todosProd}})    
  }
  catch(err){
    logger.log("error", "/nuestros-productos -  GET  - error al mostrar catálogo de productos")
  }
  })

  app.post("/api/nuestros-productos/cat", async (req, res)=>{
    const {category} = req.body;
    res.redirect(`/api/nuestros-productos/${category}`)
  })

  app.get('/api/nuestros-productos/:category', auth, async (req, res)=>{
  try{
    const {category} = req.params
    
    if(category=="todos"){
      console.log(category)
      const productos = await Productos.listarTodos();
      const todosProd = productos.map( (item) => (
        {
          _id: item._id,
          title:item.title,
          price:item.price,
          thumbnail:item.thumbnail,
          category:item.category
        }
      ))
      logger.log("info", "/api/nuestros-productos/:category - GET")  
      res.render("nuestros-productos", {data: {todosProd}}) 
    } else{
      const productos = await Productos.listarCategory(category);
      
      const todosProd = productos.map( (item) => (
        {
          _id: item._id,
          title:item.title,
          price:item.price,
          thumbnail:item.thumbnail,
          category:item.category
        }
      ))
      logger.log("info", "/api/nuestros-productos/:category - GET")  
      res.render("nuestros-productos", {data: {todosProd}}) 
    }
   
  }
  catch(err){
    logger.log("error", "/api/nuestros-productos/:category -  GET  - error al mostrar catálogo por categoría")
  }
})

  app.post("/nuestros-productos", async (req, res)=>{
const {idprod} = req.body;

const producto = await Productos.buscarPorId(idprod);
const prod = {
title: producto.title,
thumbnail: producto.thumbnail,
price: producto.price,
id: idprod,
category:item.category
}
res.render("detalle-producto", {data:{prod}})
})

 


app.post('/api/carrito', auth, routesCarrito.postCrearCarrito)



app.post('/api/carrito/productos', auth, routesCarrito.postAgregarProdCarrito)
//agrega un producto al carrito desde card de producto

app.get("/ver-carrito", async (req, res)=>{
      const {username} = req.user;
      const usuario = await Usuarios.findOne({username: username})
      const idcarrito = usuario.carritoactual;   
      res.redirect(`/api/carrito/${idcarrito}/productos/`)
})


app.get("/api/carrito/:id/productos/", auth,  routesCarrito.getCarrito)
//ver tabla de productos en el carrito


app.get("/seguir-comprando", async (req, res)=>{    
  const {username} = req.user;
      const usuario = await Usuarios.findOne({username: username})
      const haycarrito = usuario.carritoactual;   
  if(haycarrito == "vacío"){
    res.redirect("/api/carrito")
  }else{
    try{
      const productos = await Productos.listarTodos();
      const todosProd = productos.map( (item) => (
        {
          _id: item._id,
          title:item.title,
          price:item.price,
          thumbnail:item.thumbnail,
          category:item.category
        }
      ))
      logger.log("info", "/seguir-comprando - GET")  
      res.render("nuestros-productos", {data: {todosProd}})
    }
    catch(err){
      logger.log("error", "/nuestros-productos -  GET  - error al mostrar catálogo de productos")
    }
  }


})

app.post('/api/carrito/productos/del', auth, routesCarrito.deleteProdDelCarrito) 
//eliminar un producto del carrito

app.delete('/api/carrito', auth, routesCarrito.deleteCarrito)
//eliminar carrito
  
app.post('/api/carrito/confirmar-pedido', auth, routesCarrito.confirmarPedido)

  
  app.get("/api/productos", auth, async (req, res)=>{
    const { username, password, nombre } = req.user;
    const user = { username, password, nombre };
    try{
        if(listaProductos){
            res.render("vista-productos", {user});
            logger.log("info", "/api/productos - GET")
        }else{
          logger.log("error", "error al mostrar vista de productos");
          res.render("error")
        }
    }
    catch(err){
      logger.log("error", "/api/productos -  GET  - error al mostrar vista de productos")
    }
  });

  app.get('/api/productos-test', auth, async (req, res)=>{
    logger.log("info", "/api/productos-test  -   GET")
    res.render("productos-test")
})

app.get("/logout", routes.getLogout);


//INFO OBJETO PROCESS
app.get('/info', routeInfo.getInfo);
// ex FORK DE CHILD PROCESS
app.get('/api/randoms', routeFork.getRandoms);

app.get("*", routes.failRoute);

//NORMALIZACION
function normlizarChat(messages){
            //esquemas para normalizacion
            const author = new schema.Entity('author',{}, { idAttribute: 'email' });

            const message = new schema.Entity('message', 
            { author: author }, 
            { idAttribute: "id" })

            const schemaMessages = new schema.Entity("messages", { messages:[message] })
    
            const dataNormalizada = normalize({ id: "messages", messages }, schemaMessages)
        

 return dataNormalizada
}

//*WEBSOCKET PRODUCTOS Y MENSAJES

io.on('connection', async (socket) =>{
        logger.log("info", "io socket conectado")
        const listaMensajes = await mensajesFS.getAll();
        const listaProd = await Productos.listarTodos();
        
        //const normalizado = normlizarChat(listaMensajes)
        //console.log("normalizado", JSON.stringify(normalizado, null, 4));
        //const desnormalizado = denormalize(normalizado.result, TodosLosMensajesSchema, normalizado.entities);
        //console.log("desnormalizado", desnormalizado);
        socket.emit("mensajes", listaMensajes)
        socket.emit("productos", listaProd)
        socket.emit("prod-test", crearProductosRandom())
        //socket.emit("productos-catalogo", listaProd)

        


                socket.on('new_prod', async (data) =>{
                    try{
                      await Productos.guardar(data)
                      const listaActualizada = await Productos.listarTodos();
                      io.sockets.emit('productos', listaActualizada)
                    }
                    catch{
                      logger.log("error", "error al escuchar productos");
                    }
                   
                })                
                socket.on('new_msg', async (data)=>{
                  try{
                    await mensajesFS.save(data);
                    const listaMensajes = await mensajesFS.getAll();
                    io.sockets.emit('mensajes', listaMensajes) 
                  }
                  catch{
                    logger.log("error", "error al escuchar mensajes");
                  }
                               
                })        

})




        httpServer.listen( PORT, HOST, ()=>{
            console.log('servidor de express escuchando')
        })

