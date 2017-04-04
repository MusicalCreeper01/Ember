var html_template = `
<html>
    <head>
        @head
    </head>
    <body>
        @body
    </body>
</html>
`

var server_template = `
    var server = require('server');
    @content
`;

var removeComments = (input) => {
    var inQuote = false;
    var inComment = false;
    var blockComment = false;
    var out = "";
    for(var i = 0; i < input.length; ++ i){
        var c = input[i];
        if(c == '\"' || c == '\'')
            inQuote =! inQuote;

        if(!inQuote ){
            if(!inComment && c == '/' && i+1 < input.length-1 && script[i+1] == '/')
                inComment = true;
            if(inComment && c.match(/[\r\n]/g) && !blockComment)
                inComment = false;
            if(!inComment && c == '/' && i+1 < input.length-1 && script[i+1] == '*'){
                inComment = true;
                blockComment = true;
            }
            if(inComment && blockComment && c == '*' && i+1 < input.length-1 && script[i-1] == '/'){
                inComment = false;
                blockComment = false;
            }
        }

        if(!inComment)
            out += c;
    }
    return out;
}


var path = require('path');
var fs = require('fs');

var vm = require('vm');

var log = require('./logging');

var TAG = "Compiler";

var elements = {};
var macros = {};
var imports = {};

var html = "";
var css = "";
var server = "";

var htmlelementoverrides = {};

function searchModules (obj, dir, parent){
    if(parent == undefined)
    parent = "";
    var files = fs.readdirSync(dir);
    files.forEach(file => {
        if(fs.lstatSync(path.join(dir, file)).isDirectory()){
            log.info(TAG, 'Checking for compiler elements in "/'+parent+path.parse(file).name+'/"', log.level.INFO);
            searchModules(obj, path.join(dir, file), path.parse(file).name + '/')
        } else {
            log.info(TAG, 'Loading compiler element "/'+parent+path.parse(file).name+'"', log.level.INFO);
            var data = fs.readFileSync(path.join(dir, file), 'utf8');
            obj[path.parse(file).name] = data;
        }
    });
}

var options = {
    font: 'sans-serif'
}

module.exports = (object, callback) => {
    scriptMacros = [];

    elements = {};
    macros = {};

    html = "";
    css = "";

    searchModules(elements, path.join(__dirname, 'elements'))
    searchModules(macros, path.join(__dirname, 'macros'))
    searchModules(imports, path.join(__dirname, 'imports'))

    processImports(object);

    var o = "";
    object.forEach(function(rootNode){
        console.log(' ===== Root Node: ' + rootNode.name)
        process(rootNode)
    })

    log.info(TAG, 'Finished compiling! ')

    css = css.replace(/@font/g, options.font);

    html = html_template.replace(/@body/g, html);
    html = html.replace(/@head/g, '<style>'+css+'</style>');

    log.info(TAG, html);
    log.info(TAG, css);

    callback(html, css, server);
}

var scriptMacros = [];
var scriptImports = [];

function processImports (node){
    log.info(TAG, 'Executing imports...', log.level.DEBUGGING)
    scriptImports = [];
    node.forEach(function(n){
        if(n.type == 'import')
        scriptImports.push(n);
    })
    scriptImports.forEach(function(node) {
        var name  = node.name;
        if(imports[name] != undefined) {
            log.info(TAG, 'Executing import ' + name, log.level.DEBUGGING)
            css +=     removeComments(executeModuleSafe(imports[name], node.parameters, 'css', name, {"files":{"html": html, "css": css, "server": server}}));
            html =     executeModuleSafe(imports[name], node.parameters, 'html', name, {"files":{"html": html, "css": css, "server": server}}) + html;
            var post = executeModuleSafe(imports[name], node.parameters, 'post', name, {"files":{"html": html, "css": css, "server": server}})
            if(post != undefined && post != '') {
                html = post[0];
                css = post[1];
                server = post[2];
            }
        }else {
            log.warn(TAG, 'Cannot find import ' + name)
        }
    });
    log.info(TAG, 'Executed imports!', log.level.DEBUGGING)
}

function process (node, bodydepth){
    var name = node.name;

    if(node.type == 'macro'){
        return;
    }
    if(node.type == 'import'){
        return;
    }

    if(elements[name] != undefined) {
        log.info(TAG, 'Compiling node using module "'+name+'"', log.level.DEBUGGING);

        css += removeComments(executeModuleSafe(elements[name], node.parameters, 'css', name, {depth: undefined}))
        if(node.type == 'body'){
            html += executeModule(elements[name], node.parameters, 'start', name, {depth: undefined});
            html += executeModuleSafe(elements[name], node.parameters, 'html', name, {depth: undefined});
        }else {
            html += executeModule(elements[name], node.parameters, 'html', name, {depth: undefined});
        }

        if(node.children != undefined){
            for(var f = 0; f < node.children.length; ++f) {
                if(node.children[f].constructor === Array){
                     for (var _ii = 0; _ii < node.children[f].length; ++_ii) {
                         html += executeModule(elements[name], node.parameters, 'start', name, {depth: f});
                         process(node.children[f][_ii], f);
                         html += executeModule(elements[name], node.parameters, 'end', name, {depth: f});
                     }
                }else{
                     process(node.children[f]);
                }
            }
        }


        if(node.type == 'body')
        html += executeModule(elements[name], node.parameters, 'end', name, {depth: undefined});

    }else {

        html += '<' + node.name + '>' + node.parameters[0] + '</' + node.name + '>';

        log.warn(TAG, 'Reference to non-existent compiler module "'+name+'", filling with tag equivelent!');
    }
}

function executeModule (s, args, func, dispname, args2){
    s += func + '()';
    var sandbox = {
        args: args,
        log: log,
        options: options,
        overrides: htmlelementoverrides
    }
    if(args2 != undefined) {
        for(var k in args2) {
            sandbox[k] = args2[k];
        }
    }
    //console.log(JSON.stringify(sandbox));
    var script = new vm.Script(s);
    var context = new vm.createContext(sandbox);
    options = sandbox.options;

    var res = "";
    try {
        res = script.runInContext(context);
        return res;
    } catch (e) {
        console.log(e instanceof ReferenceError);
        if (e instanceof ReferenceError){
            log.warn(TAG, 'Attempted to execute non-existent function "'+func+'" in module "'+dispname+'"');
        }else {
            log.error(TAG, 'Non-terminal error occured while trying to execute "'+func+'" in module "'+dispname+'": ' + e.message);
        }
        return "";
    }
    //}
    return '';
}
function executeModuleSafe (s, args, func, dispname, args2){
    //if(elements[name] != undefined) {
    //    var s = elements[name];
    s += func + '()';
    var sandbox = {
        args: args,
        log: log,
        options: options,
        overrides: htmlelementoverrides
    }
    if(args2 != undefined) {
        for(var k in args2) {
            sandbox[k] = args2[k];
        }
    }
    var script = new vm.Script(s);
    var context = new vm.createContext(sandbox);
    options = sandbox.options;

    var res = "";
    try {
        res = script.runInContext(context);
        if(res != undefined && typeof res == 'string' && res != 'undefined'){
            return res;
        } else{
            return "";
        }
    } catch (e) {
        log.warn(TAG, 'Attempted to execute non-existent function "'+func+'" in module "'+dispname+'": ' + e.message, log.level.DEBUGGING);
        return "";
    }
    //}
    return '';
}
