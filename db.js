var FS = require('fs');
var Path = require('path');
//var Markdown = require("marked");
//var MdRenderer=require("./md-override")
var knex = require("knex");
var Bookshelf = require('bookshelf');
var async = require('async');
var textile = require('textile-js')

var promisify = require("promisify-node");

var fse = promisify(require("fs-extra"));
fse.ensureDir = promisify(fse.ensureDir);


var nodegit = require("nodegit")

var Markdown =  textile //Markdown = require('js-markdown-extra').Markdown

function orderize(files){
   var pageObjs = []
   for (var i = 0; i<files.length; i++){
     var file = files[i].name
     console.log(file)
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

function repoPath(name) {
  return Path.join( name + ".markdown");
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
  console.log(path)
//  if (name != "home"){
//    return callback(null,{exists: false})

//  }
  

  FS.readdir(pathFromDir(), function(err,files){
      var fileObj = []
      var file_ext=".markdown"
      var clean_list = []
      for( var  i = 0; i < files.length; i++){
          var f=files[i]
          if (f.slice( - file_ext.length, f.length ) === file_ext) {
            clean_list.push(f)
          }
       }
      files = clean_list
      
      var pathfiles=fullPath(files) 
      async.map(pathfiles, FS.readFile, function(err, data){
          for( var  i = 0; i < files.length; i++){
              try{
                console.log(f)
                var html = Markdown(data[i].toString().replace(/\r/g,""))
                fileObj.push({name : files[i], markdown:data[i].toString(), html:html} )
              }
               catch (err){ }
                  console.log(err)
              }
          var torender = orderize(fileObj)
          
          callback(null,{exists:true, torender:torender})
          
      })  

  })

};

exports.editPage = function (name, callback) {
  var path = pathFromNameMd(name);

  
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
      markdown: unescape(markdown),
      html: html,
    });
   

  });
 
};
// Saving is simple.  Just put the markdown in the file
exports.savePage = function (name, value, callback) {
  var pathFile = pathFromNameMd(name);
  var repos_relative = repoPath(name); 
  FS.writeFile(pathFile, value.replace(/\r/g,""), function (){
              
              
              
             
  console.log(pathFile)
  var repo;
  var index;
  var oid;

  nodegit.Repository.open(Path.resolve(__dirname, "pages/.git"))
    .then(function(repoResult) {
        console.log(repoResult)
        repo = repoResult;
    })
    .then(function (){ 
      return repo.openIndex();
    })
    .then(function(indexResult) {
     index = indexResult;
    return index.read(1);
    })
    .then(function() {
     // this file is in the root of the directory and doesn't need a full path
      return index.addByPath(repos_relative);
    })
    .then(function() {
  // this will write both files to the index
      return index.write();
    }) 
    .then(function() {
      return index.writeTree();
  })
  .then(function(oidResult) {
    oid = oidResult;
    return nodegit.Reference.nameToId(repo, "HEAD");
  })
  .then(function(head) {
    return repo.getCommit(head);
  })
  .then(function(parent) {
    var author = nodegit.Signature.create("BOB",
      "BOBHASHH", 123456789, 60);
    var committer = nodegit.Signature.create("ALICE COMMIT",
      "alicehash", 987654321, 90);

      return repo.createCommit("HEAD", author, committer, "message", oid, [parent]);
    })
    .done(function(commitId) {
      console.log("New Commit: ", commitId);
      callback()
    });

  })

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




