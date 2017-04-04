function html (){
    args[0] = args[0] || '';
    var type = args[1] || 'text';
    return '<input type="'+type+'" placeholder="'+args[0]+'">';
}
