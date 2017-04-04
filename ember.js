var log = require('./base/logging');
var translater = require('./base/translater');
var compile = require('./base/compiler');

var path = require('path');
var fs = require('fs');

Object.prototype.extend = function(object) {
    // loop through object
    for (var i in object) {
        // check if the extended object has that property
        if (object.hasOwnProperty(i)) {
            // mow check if the child is also and object so we go through it recursively
            if (typeof this[i] == "object" && this.hasOwnProperty(i) && this[i] != null) {
                this[i].extend(object[i]);
            } else {
                this[i] = object[i];
            }
        }
    }
    return this;
};

var rmdir = function(dir) {
    var list = fs.readdirSync(dir);
    for(var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);

        if(filename == "." || filename == "..") {
            // pass these files
        } else if(stat.isDirectory()) {
            // rmdir recursively
            rmdir(filename);
        } else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);
};

var TAG = 'Ember';
var logging = true;

var node_location = process.argv[0];
var cwd_location = __dirname;

if(logging)
    log.level(log.level.DEBUGGING);

log.info(TAG, 'Node location "' + node_location + '"', log.level.DEBUGGING);
log.info(TAG, 'Current Directory "' + cwd_location + '"', log.level.DEBUGGING);

log.info(TAG, 'Starting Ember Compiler...');
log.info(TAG, 'Checking file...');

var project_location = process.argv[2];

if(!path.isAbsolute(project_location)){
    project_location = path.join(cwd_location, project_location);
}

if (!fs.existsSync(project_location)) {
    log.error(TAG, 'File does not exist!');
    return;
}else {
    fs.readFile(project_location, 'utf8', function(err, page_text) {
        log.info(TAG, 'Translating layout to JSON...');
        translater(page_text, (output) => {
            log.info(TAG, 'Translated!');
            log.info(TAG, output);
            log.info(TAG, 'Compiling JSON to project...');
            compile(output, (html, css, server)=>{
                if (fs.existsSync(path.join(cwd_location, 'output'))){
                    rmdir(path.join(cwd_location, 'output'));
                }
                fs.mkdirSync(path.join(cwd_location, 'output'));

                var outloc = path.join(cwd_location, 'output', path.parse(project_location).name + '.html');
                fs.writeFile(outloc, html, function(err) {
                    if(err) {
                        return log.error(TAG, err);
                    }
                });
                outloc = path.join(cwd_location, 'output', path.parse(project_location).name + '.css');
                fs.writeFile(outloc, css, function(err) {
                    if(err) {
                        return log.error(TAG, err);
                    }
                });
                outloc = path.join(cwd_location, 'output', path.parse(project_location).name + '.js');
                fs.writeFile(outloc, server, function(err) {
                    if(err) {
                        return log.error(TAG, err);
                    }
                });
            })

            /*if (fs.existsSync(path.join(cwd_location, 'output'))){
                rmdir(path.join(cwd_location, 'output'));
            }
            fs.mkdirSync(path.join(cwd_location, 'output'));

            var outloc = path.join(cwd_location, 'output', path.parse(project_location).name + '.html');
            fs.writeFile(outloc, output, function(err) {
                if(err) {
                    return console.log(err);
                }


                fs.createReadStream('application/script.js').pipe(fs.createWriteStream(path.join(cwd_location, 'output', 'script.js')));

                log.info(TAG, 'Saved output to ' + outloc);
            });*/
        });
    });
}
