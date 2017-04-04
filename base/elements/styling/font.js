var name = args[0];

function css (){
    options.font = name;
    return "@import url('" + args[1] + "');";
}
