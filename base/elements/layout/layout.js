
var layouts = {
    "basic": {
        "start": [
            '<div class="main">',
            '<'+ (overrides.nav || 'nav') +' class="header">',
            '<div class="body">',
            '<'+ (overrides.footer || 'footer') +' class="footer">'
        ],
        "end": [
            '</div>',
            '</'+ (overrides.nav || 'nav') +'>',
            '</div>',
            '</'+ (overrides.footer || 'footer') +'>'
        ]
    }
}

function start (){
    var layout = (args[0] || 'basic');
    layout = layout != undefined ? layout : 'basic';

    if(depth == undefined)
        return layouts[layout].start[0];
    else{
        var l = layouts[layout].start[depth+1];
        if(l == undefined){
            log.error('elements/layout', 'Layout "' + layout + '" does not have a level ' + depth + '!')
            return
        }else
            return layouts[layout].start[depth+1];
    }
}
function end (){
    var layout = (args[0] || 'basic');
    layout = layout != undefined ? layout : 'basic';
    // return '</div>';
    if(depth == undefined)
        return layouts[layout].end[0];
    else{
        var l = layouts[layout].end[depth+1];
        if(l == undefined){
            log.error('elements/layout', 'Layout "' + layout + '" does not have a level ' + depth + '!')
            return
        }else
            return layouts[layout].end[depth+1];
    }

}

function html(depth){
    return '';
}
function server (){
    return ` server.get('/', (req, res)=>{

    });`;
}

/*function css (){
    return "";
}*/
