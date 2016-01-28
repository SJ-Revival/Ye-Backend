var express = require('express');
var router = express.Router();

var util = require('util');
//if object is empty
function notEmptyObject(obj){
    for(var propName in obj){
        if(obj.hasOwnProperty(propName)){
            return true;
        }
    }
    return false;
}

//app.get('/report/:chart_id/:user_id', function (req, res) {
//    // res.sendFile(filepath);
//});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET Hello World page. */
router.get('/helloworld', function(req, res) {
  res.render('helloworld', { title: 'Hello, World!' });
});


//GET S Trains
//http://fahrinfo.vbb.de/bin/query.exe/dny?look_minx=13078331&look_maxx=13736825&look_miny=52461974&look_maxy=52578126&tpl=trains2json2&look_productclass=1&look_json=yes&performLocating=1&look_nv=zugposmode|2|interval|30000|intervalstep|2000|

//GET S Stations
http://fahrinfo.vbb.de/bin/query.exe/dny?performLocating=2&tpl=stop2shortjson&look_minx=13080563&look_maxx=13734593&look_miny=52483514&look_maxy=52556631&&look_stopclass=1&look_nv=get_shortjson|yes|get_lines|yes|combinemode|1|density|26|

/* GET current S Bahn state */



module.exports = router;