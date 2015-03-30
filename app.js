var Express = require('express');
var Routes = require('./routes');
var passport = require('passport');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var sqlite3 = require('sqlite3');
var Model = require('./model');
var LocalStrategy = require('passport-local').Strategy;
// var TryCatch = require('./trycatch');

var App = Express();

// Configuration



passport.use(new LocalStrategy(function(username, password, done) {
   new Model.User({username: username}).fetch().then(function(data) {
      var user = data;
      if(user === null) {
         return done(null, false, {message: 'Invalid username or password'});
      } else {
         user = data.toJSON();
         if(!bcrypt.compareSync(password, user.password)) {
            return done(null, false, {message: 'Invalid username or password'});
         } else {
            return done(null, user);
         }
      }
   });
}));



passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(username, done) {
   new Model.User({username: username}).fetch().then(function(user) {
      done(null, user);
   });
});


App.configure(function(){
  App.set('views', __dirname + '/views');
  App.set('view engine', 'jade');
  // This gives us scoped errors with long stack traces
  // App.use(function (req, res, next) {
  //   TryCatch(next, next);
  // });
  App.use(cookieParser());
  App.use(bodyParser());
  App.use(session({ secret: 'whenidrinktoomuchigetdrunk' })); // session secret
  App.use(passport.initialize());
  App.use(passport.session());
  App.use(Express.bodyParser());
  App.use(Express.methodOverride());
  App.use(App.router);
  App.use(Express.static(__dirname + '/public'));
});

App.configure('development', function(){
  App.use(Express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

App.configure('production', function(){
  App.use(Express.errorHandler()); 
});

// Routes
App.get('/', Routes.index);
App.get('/signin', Routes.signIn);
App.post('/signin', Routes.signInPost);
App.get('/signup', Routes.signUp);
App.post('/signup', Routes.signUpPost);
App.get('/signout', Routes.signout)
App.get('/:name', Routes.view);
App.get('/:name/edit', Routes.edit);
App.post('/:name', Routes.save);


server = App.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", server.address().port, App.settings.env);
