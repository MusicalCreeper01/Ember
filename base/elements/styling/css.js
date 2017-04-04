function html () {
    if(args[1] != undefined)
        if(args[1] == true)
            return "<style>" + args[0] + "</style>";
    return "";
}

function css (){
    //log.info('CSS', 'args[1]')
    //log.info('CSS', args[0]);
    if(args[1] != undefined)
        if(args[1] == true)
            return "";
    return args[0];
}
