var FS = require('fs');
var Path = require('path');
//var Markdown = require("marked");
//var MdRenderer=require("./md-override")
var knex = require("knex");
var Bookshelf = require('bookshelf');
var async = require('async');
var textile = require('textile-js')


var Markdown =  textile //Markdown = require('js-markdown-extra').Markdown

function orderize(files){
   var pageObjs = []
   for (var i = 0; i<files.length; i++){
     var file = files[i].name
     var order = parseInt(file.split("_")[0])
     if(!isNaN(order)) {
      var divId = file.split("_")[1].split(".markdown")[0]
      var md = files[i].markdown
      var html = files[i].html
      pageObjs.push ({name: file.split(".markdown")[0], order:order, divId:divId, markdown:md, html:html })
    }
   }
  return pageObjs.sort(function(a,b){ return a.order - b.order });
 }


// This function is used to map wiki page names to files
// on the real filesystem.
function pathFromNameMd(name) {
  return Path.join(__dirname, "pages", name + ".markdown");
}

function pathFromName(name) {
  return Path.join(__dirname, "pages", name);
}


function pathFromDir() {
  return Path.join(__dirname, "pages");
}


function fullPath(files) {
  var paths = []
  for (var i= 0; i < files.length; i++)
    paths.push(pathFromName(files[i]))

  return paths 
}

// Load a file, parse the title and generate the HTML
exports.loadPage = function (name, callback) {
  var path = pathFromNameMd(name);
  console.log("..."+name)
//  if (name != "home"){
//    return callback(null,{exists: false})

//  }
  

  FS.readdir(pathFromDir(), function(err,files){
      var pathfiles=fullPath(files)
      var fileObj = []
      async.map(pathfiles, FS.readFile, function(err, data){
          for( var  i = 0; i < files.length; i++){
            //console.log(files[i])
            try{
              var html = Markdown(data[i].toString())
              //console.log(html)
              fileObj.push({name : files[i], markdown:data[i], html:html} )
            }
            catch (err){ }
            
          }
          var torender = orderize(fileObj)
          callback(null,{exists:true, torender:torender})
          
      })  

  })

};

exports.editPage = function (name, callback) {
  var path = pathFromNameMd(name);
  console.log(path) 

  
  FS.readFile(path, 'utf8', function (err, markdown) {

    var exists = true;
    if (err) {
      if (err.code === "ENOENT") {
        // Generate a placeholder body.
        markdown = "# " + name.replace(/_/g, " ") +
          "\n\n" + "This page does not exist yet.";
        exists = false;
      } else {
        // Forward on all other errors.
        return callback(err);
      }
    }

    // Parse and render the markdown.
    /*var tree = Markdown.parse(markdown);
    var title = name;
    for (var i = 1, l = tree.length; i < l; i++) {
      if (tree[i] && tree[i][0] === "header") {
        title = tree[i][2];
        tree.splice(i, 1);
        break;
      }
    }*/

  var html = Markdown(markdown);
    
    callback(null, {
      name: name,
      title: null,
      exists: exists,
      markdown: markdown,
      html: html,
    });
   

  });
 
};
// Saving is simple.  Just put the markdown in the file
exports.savePage = function (name, value, callback) {
  var path = pathFromNameMd(name);
  console.log(path)
  console.log(value)
  FS.writeFile(path, value, callback);
};

var dbFile = Path.join(__dirname, 'app.db');
var DB = Bookshelf(knex({
   client: 'sqlite3', 
   connection: { filename: dbFile }
}));

FS.exists(dbFile, function(exists) {
    if (!exists) {
        console.log("create a new DB")
        DB.knex.schema.createTable('Users', function(table) {
            table.increments("id")
            table.string('username')
            table.string('password')
        }).then( function(){ console.log("DB created") })
    }
})

exports.DB = DB;




