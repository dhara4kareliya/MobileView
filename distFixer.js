var fs = require('fs');
var path = require('path');

copyFolderRecursiveSync("images", "dist");
copyFolderRecursiveSync("audio", "dist");

function copyFileSync( source, target ) {

    var targetFile = target;

    // If target is a directory, a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    // Check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    // Copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}

function replace (filename, expression, replacement) {
    fs.readFile(filename, "utf8", (err, data) => {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(expression, replacement);
    
        fs.writeFile(filename, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
}

function fromDir(startPath,filter,callback){

    if (!fs.existsSync(startPath)){
        console.log("no dir ",startPath);
        return;
    }

    var files=fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
        var filename=path.join(startPath,files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()){
            fromDir(filename,filter,callback);
        }
        else if (filter.test(filename)) callback(filename);
    };
};

replace("dist/index.html", /"\//g, '"./');

fromDir('dist/assets',/\.css$/,function(filename){
    console.log('-- found: ',filename);
    replace(filename, /\/assets/g, "../assets");
});