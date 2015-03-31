var Markdown = require("marked")

var renderer = new Markdown.Renderer();


Markdown.setOptions({
  renderer: renderer,
  gfm: true,
  tables: true,
  sanitize: false

})



renderer.image = function( href, title, text ) {
    var result = ' alt="' + text.trim() + '" '; // this will be used to store our dimension string (if applicable)
    var w, h; // our width & height variables
 
    // title tags need to be between double quotes
    var rTitle = /&quot;(\w*\s*)+&quot;/;
 
    // dimension values need to prefix with an equal sign
    // followed by at least one digit and the times 'x' sign
    // and (optionally) MAY have a second value
    var rDims = /=(\d+)x(\d*)/;
 
    // classes to be placed within the image need to be prefixed with a colon
    // any subsequent classes to be added with a "." without any leading or trailing
    // spaces. IT MUST HAVE A SPACE IN FRONT OTHERWISE IT WILL CONFLICT WITH
    // LINKS CONTAINING http://...
    var rClass = /\s+:([^\)|\s]+)/;
 
    // ids need to be prefixed with a hash symbol. MUST HAVE A SPACE BEFORE OTHERWISE
    // CAN GET CONFUSED WITH URLs.
    var rId = /\s+#([^\)|\s]+)/;
 
    // first let's grab the title and then remove from href
    if ( title === null ) {
        var getTitle = rTitle.exec( href );
        if ( getTitle && getTitle[0].length ) {
            title = getTitle[0].replace( /&quot;/g , "" );
            result += ' title="' + title + '" ';
        }
        href = href.replace( rTitle, "" );
    }
 
    // get dimension values from href
    var getDims = rDims.exec( href );
    if ( getDims[0].length ) {
        // width is the first dimension value
        w = getDims[1];
        result += ' width="' + w + '" ';
        // height is the second dimension value (optional)
        if ( getDims.length > 1 ) {
            h = getDims[2];
            result += ' height="' + h + '" ';
        }
        href = href.replace( rDims, "" );
    }
 
    // get class tag from href
    var getClass = rClass.exec( href );
    if ( getClass && getClass[0].length ) {
        var c = getClass[1];
        result += ' class="' + c + '" ';
        href = href.replace( rClass, "" );
    }
 
    // get id tag from href
    var getId = rId.exec( href );
    if ( getId && getId[0].length ) {
        var i = getId[1];
        result += ' id="' + i + '" ';
        href = href.replace( rId, "" );
    }
 
    return '<img src="' + href.trim() + '" ' + result + '>';
 
};


exports.Markdown = Markdown 
