var FS = require('fs');
var Path = require('path');
var Markdown = require("marked");
var knex = require("knex");

var Bookshelf = require('bookshelf');


Markdown.setOptions({
  renderer: new Markdown.Renderer(),
  gfm: true,
  tables: true,
  sanitize: true

})
// This function is used to map wiki page names to files
// on the real filesystem.
function pathFromName(name) {
  return Path.join(__dirname, "pages", name + ".markdown");
}

// Load a file, parse the title and generate the HTML
exports.loadPage = function (name, callback) {
  var path = pathFromName(name);

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
  var path = pathFromName(name);
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




