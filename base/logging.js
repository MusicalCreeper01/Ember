function tags (){
    var time = new Date();
    var s = "";
    s += '[' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + '] '
    return s;
}

var lv = 1;

module.exports.level = {
    DEBUGGING: 0,
    INFO: 1,
    WARNINGS: 2,
    ERROR: 3
}

module.exports.level = (targetLevel) => {
    lv = targetLevel;
}

module.exports.info = (tag, text, level) => {
    if(level == undefined) level == module.exports.level.INFO;
    if(level < lv) return;

    console.log(tags() + '['+tag+'] ' + text);
}

module.exports.error = (tag, text) => {
    module.exports.info(tag, '\x1b[31m'+text + '\x1b[0m', module.exports.level.ERROR)
}
module.exports.warn = (tag, text) => {
    module.exports.info(tag, '\x1b[33m'+text + '\x1b[0m', module.exports.level.ERROR)
}
