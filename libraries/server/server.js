
var express = require('express')
var app = express();

var res = undefined;
var req = undefined;

module.exports.get = function(route, callback){
    app.get(route, function(_req, _res){
        req = _req;
        res = _res;
        callback();
    })
};
module.exports.post = function(route, callback){
    app.post(route, function(_req, _res){
        req = _req;
        res = _res;
        callback();
    })
};



app.listen(3000, () => {
    console.log('Ember app running on 300!');
})
