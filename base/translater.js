var log = require('./logging');

var TAG = "Translater";

var strip = (script) => {
    //script = script.replace(/\/\*(\*(?!\/)|[^*])*\*\//g, ''); // block comments
    //script = script.replace(/\/\/?.*\n/g, ''); // single line comments
    //script = script.replace(/\/\/?.*\n\r/g, ''); // single line comments with windows carrage return charaters and newlines
    //script = script.replace(/\/\/?.*\r/g, ''); // single line comments with windows carrage return charaters
    //Strip comments
    var inQuote = false;
    var inComment = false;
    var blockComment = false;
    var out = "";
    for(var i = 0; i < script.length; ++ i){
        var c = script[i];
        if(c == '\"' || c == '\'')
            inQuote =! inQuote;

        if(!inQuote ){
            if(!inComment && c == '/' && i+1 < script.length-1 && script[i+1] == '/')
                inComment = true;
            if(inComment && c.match(/[\r\n]/g) && !blockComment)
                inComment = false;
            if(!inComment && c == '/' && i+1 < script.length-1 && script[i+1] == '*'){
                inComment = true;
                blockComment = true;
            }
            if(inComment && blockComment && c == '*' && i+1 < script.length-1 && script[i-1] == '/'){
                inComment = false;
                blockComment = false;
            }
        }

        if(!inComment)
            out += c;
    }
    script = out;
    console.log(out);


    script = script.replace(/^\s*$/gm, ''); // remove blank lines
    script = script.replace(/^[ \t]+|[ \t]+$/gm, ''); // strip leading and trailing whitespaces
    script = script.replace(/\s*{/gm, '{'); // remove whitespaces between closing ) and starting {
        //https://regex101.com/r/9dGokB/3
    script = script.replace(/\;(?=([^"]*"[^"]*")*[^"]*$)/g, '') // remove all ; that are not in brackets since we don't use them - user convenience feature to be lax like javascript

    return script;
}

module.exports = (script, callback) => {
    var structure = [];
    script = strip(script);
    process(structure, script)
    //console.dir(structure[Object.keys(structure)[0]].children);
    console.log(JSON.stringify(structure));
    callback(structure);
}

var process = (structure, script) => {
    //console.log('processing: "' + script + '"')
    var s = '';
    var name = '';
    var openings = 0;
    var body = false;
    var openingLine = -1;
    var line = 0;
    var inString = false;
    var currentBody = undefined;
    var extendedBody = false;
    var bodyIndex = 0;
    for (var i = 0, len = script.length; i < len; i++) {
        var c = script[i];
        if(c == '{' && !inString){
            //if( currentBody == undefined){
                console.log('found body start at ' + line)
                if(!body){
                    console.log('starting body...')
                    openingLine = line;
                    body = true;
                    s = ''
                }else{
                    s += c;
                    ++openings;
                }
        } else if(c == '}' && !inString ){
            if(openings > 0){
                s += c;
                --openings
            }
            if (body && openings == 0){

                //console.log(name)
                var params = null;
                var new_name = name;
                if(name.indexOf('(') >= 0 && name.indexOf(')') >= 0){
                    params = name.split('(')[1].split(')')[0].replace(/\\\"/gm, '').split(',');

                    new_name = name.split('(')[0];
                }
                new_name = new_name.replace(/^\s+|\s+$/gm, '');
                currentBody = new_name;

                var sc = s;

                if(((i+1 < script.length-1 && script[i+1] == '{') || (i+2 < script.length-1 && script[i+2] == '{'))){ // next is another body
                    if(extendedBody) {
                        var sc = s.slice(0, -1).substring(1);
                        s = '';
                        structure[bodyIndex].scripts.push(sc)
                    }else {
                        extendedBody = true;
                        var n = {"children": [], "name": new_name, "parameters": params, "type": 'body', 'scripts': []};
                        structure.push(n);
                        var sc = s;
                        n.scripts.push(sc);
                        bodyIndex = structure.length-1;

                        s = '';

                        bodyIndex = structure.length-1;
                    }
                }else { // is end
                    if(extendedBody) {

                        var sc = s.slice(0, -1).substring(1);
                        s = '';
                        structure[bodyIndex].scripts.push(sc)

                        name = '';
                        body = false;
                        extendedBody = false;

                        structure[bodyIndex].scripts.forEach(function(_script){
                            var ch = [];
                            structure[bodyIndex].children.push(ch);
                            process(ch, _script);
                        });
                        return;
                    }else {
                        var n = {"children": [], "name": new_name, "parameters": params, "type": 'body'};
                        structure.push(n);

                        var sc = s;

                        s = '';
                        name = '';
                        body = false;
                        extendedBody = false;

                        if(sc != '') {
                            process(n.children, sc);
                            return;
                        }
                    }
                }
            }
        }else if (!body && c == ')' && s.indexOf('(') >= 0 && (i+1 < script.length && script[i+1] != '{') && !inString) { // Shortcodes text("args")
            if(script[i+1].match(/\s/g)){
                s += c;
                console.log('found shortcode: ' + s);
                //console.log('found shortcode: ' + s);
                //http://stackoverflow.com/questions/11456850/split-a-string-by-commas-but-ignore-commas-within-double-quotes-using-javascript
                var params = name.split('(')[1].split(')')[0].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                for(var index = 0; index < params.length; ++index){
                    params[index] = params[index].replace(/\"/g, ''); // remove escaped quotes that wreck code
                }

                console.log('params: ' + JSON.stringify(params));
                structure.push({
                    "type": 'shortcode',
                    "name": name.split('(')[0],
                    "parameters": params //.split(',')
                });
                s = '';
                name='';
            }
        }else if (!body && c.match(/\s*[\r\n]/g)) { // End of line
            var params = [];
            var spli = s.split(' ');
            if(spli.length > 2){
                for(var b = 2; b < spli.length; ++b)
                    params.push(spli[b]);
            }
            if(s.indexOf('macro') >= 0)
                structure.push({"type": 'macro', "name": s.split(' ')[1], "parameters": params});
            if(s.indexOf('import') >= 0)
                structure.push({"type": 'import', "name": s.split(' ')[1], "parameters": params});

            s = '';
            name="";
        }
        else {
            s += c;
            if(!body) name += c;
        }

        if(c.match(/\s/g)){
            ++line;
        }
        if(c == '"' || c == "'")
            inString = !inString;


        if(i == script.length-1) {
            if(body)
                log.error(TAG, 'Failed to find closing bracket for body begining at line ' + openingLine)
        }
    }
}
