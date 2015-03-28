// Load our model abstraction so we can load and save pages in the wiki.
var passport = require('passport');
var DB = require('../db');
var Model = require('../model')
var bcrypt = require('bcrypt-nodejs');
// When the wiki is initially loaded, simply redirect to the `home` page.
//exports.index = function(req, res) {
//  res.redirect("/home");
//};

// Load a page from the database and render as html
exports.index = function (req, res, next) {
  DB.loadPage(req.params.name, function (err, page) {
    if (err) return next(err);
    if (page.exists==false && !req.isAuthenticated())
      res.redirect('/')
    if (page.exists==false && req.isAuthenticated())
      res.redirect('/'+req.params.name+"/edit")
    page['isAuth']=req.isAuthenticated()
    res.render('view', page);
  });
};

// Load a page from the database and render edit form
exports.edit = function (req, res, next) {

  if(!req.isAuthenticated()) {
      res.redirect('/signin');
  }
  else{
  DB.editPage(req.params.name, function (err, page) {
    if (err) return next(err);
    res.render('edit', page);
  });
  }
};

// Save changes to a page and redirect to view page
exports.save = function (req, res, next) {
  if(!req.isAuthenticated()) {
      res.redirect('/signin');
  } 
  else {
  console.log(req.body)
  DB.savePage(req.params.name, req.body.markdown, function (err) {
    if (err) return next(err)
    //res.redirect("/" + req.params.name);
    res.redirect("/");
  });
  }
}


var signIn = function(req, res, next) {
   if(req.isAuthenticated()) res.redirect('/');
   res.render('signin', {title: 'Sign In'});
};

var signInPost = function(req, res, next) {
   passport.authenticate('local', { successRedirect: '/',
                          failureRedirect: '/signin'}, function(err, user, info) {
      if(err) {
         return res.render('signin', {title: 'Sign In', errorMessage: err.message});
      } 

      if(!user) {
         return res.render('signin', {title: 'Sign In', errorMessage: info.message});
      }
      return req.logIn(user, function(err) {
         if(err) {
            return res.render('signin', {title: 'Sign In', errorMessage: err.message});
         } else {
            return res.redirect('/');
         }
      });
   })(req, res, next);
};

var signUp = function(req, res, next) {
   if(req.isAuthenticated()) {
      res.redirect('/');
   } else {
      res.render('signup', {title: 'Sign Up'});
   }
};

var signUpPost = function(req, res, next) {
   var user = req.body;
   var usernamePromise = null;
   usernamePromise = new Model.User({username: user.username}).fetch();
   return usernamePromise.then(function(model) {
      if(model) {
         res.render('signup', {title: 'signup', errorMessage: 'username already exists'});
      } else {
         //****************************************************//
         // MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
         //****************************************************//
         var password = user.password;
         var hash = bcrypt.hashSync(password);

         var signUpUser = new Model.User({username: user.username, password: hash});

         signUpUser.save().then(function(model) {
            // sign in the newly registered user
            signInPost(req, res, next);
         });  
      }
   });
};


var signOut = function(req, res, next) {
   if(!req.isAuthenticated()) {
      notFound404(req, res, next);
   } else {
      req.logout();
      res.redirect('/signin');
   }
};



// 404 not found
var notFound404 = function(req, res, next) {
   res.status(404);
   res.render('404', {title: '404 Not Found'});
};


exports.signIn=signIn
exports.signInPost=signInPost
exports.signUpPost=signUpPost
exports.signUp = signUp
exports.signOut= signOut
exports.notFound404 = notFound404
