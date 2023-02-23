const logger = require("./winston-logger");
const Usuarios = require("./models/usuarios")
const {enviarMail, transporter, mailADMIN} = require("./nodemailer")




function getRoot(req, res) {
    res.render("index", {});
    logger.log("info", "/ - GET")
}
  



  function getSignup(req, res) {
    logger.log("info", "/signup - GET")
    if (req.isAuthenticated()) {
      const { username, password } = req.user;
      const user = { username, password };
      res.render("profileUser", { user });
    } else {
      res.render("signup");
    }
  }

  async function postSignup(req, res) {
    logger.log("info", "/signup - POST")
    const {  username, password, nombre, apellido, direccion, edad, telefono, avatar } = req.user;
    const user = {  username, password, nombre, apellido, direccion, edad, telefono, avatar };
    const mailOptionsNuevoReg = {
      from: 'App Tienda',
      to: mailADMIN,
      subject: 'Nuevo registro',
      html: `<div>
            <p>Nuevo usuario registrado:</p>
              <ul>
                <li>Nombre: ${user.nombre} </li>
                <li>Apellido: ${user.apellido} </li>
                <li>>Email: ${user.username}</li> 
                <li>Edad: ${user.edad}</li>  
                <li>Dirección: ${user.direccion}</li>  
                <li>Teléfono: ${user.telefono}</li> 
                <li> <img src=" ${user.avatar}" alt=" ${user.nombre}" /> </li> 
              </ul>
              </div>`
    }
    const emailReg = await enviarMail(mailOptionsNuevoReg)
    res.render("profileUser", { user });
  }

  function getFailsignup(req, res) {
    logger.log("info", "/failsignup - GET")
    res.render("signup-error");
  }


  
  function getLogin(req, res) {
    logger.log("info", "/login - GET")
    if (req.isAuthenticated()) {
        const { username, password, telefono, nombre, apellido, avatar, edad, direccion  } = req.user;
        const user = { username, password, telefono, nombre, apellido, avatar, edad, direccion  };
        res.render("profileUser", { user });
      } else {
        res.render("login");
      }
  }



async function postLogin(req, res){
    const { username, password } = req.user;
  const usuario = await Usuarios.findOne({username: username})
  const user = {
    username:usuario.username,
    password:usuario.password, 
    telefono:usuario.telefono, 
    nombre:usuario.nombre, 
    apellido:usuario.apellido, 
    avatar:usuario.avatar, 
    edad:usuario.edad, 
    direccion:usuario.direccion,
    carritoactual: usuario.carritoactual
  }
  res.render("profileUser", { user});
  logger.log("info", "/login - POST - render profileUser")
}

function getFaillogin(req, res) {
  logger.log("info", "/faillogin - GET")
  res.render("faillogin")
}



function getLogout(req, res){
  logger.log("info", "/logout - GET")
  const { username, password } = req.user;
  const user = { username, password };
    req.session.destroy((err) => {
      if (err) {        
        console.log(err)
            res.send("no se pudo deslogear");
      } else {
        
            res.render("logout", {user} );
        
        }
    });
}

function failRoute(req, res) {
  res.status(404).render("routing-error", {});
  }

module.exports = {
    getRoot,
    getLogin,
    getSignup,
    postLogin,
    postSignup,
    getFaillogin,
    getFailsignup,
    getLogout,
    failRoute,
  };