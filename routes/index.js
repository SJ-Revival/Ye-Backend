var express = require('express');
var router = express.Router();

var fs = require('fs-extra');
var formidable = require('formidable');
var util = require('util');

var shortid = require('shortid');
var config = require('../config');

var async = require('async');

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

//form example for image upload
var form = "<!DOCTYPE HTML><html><body>" +
    "<form method='post' action='/search/addimage' enctype='multipart/form-data'>" +
    "<input type='file' name='image'/>" +
    "<input type='submit' /></form>" +
    "</body></html>";

router.post('/addimage', function(req, res) {

    db = req.db;
    var locationlist = db.get('locationlist');
    var imagelist = db.get('imagecollection');

    var generatedID = shortid.generate();

    //create Instance from formidable to get access of files
    form = new formidable.IncomingForm();

    //pareses the request
    //fill the form instance with request data
    form.parse(req, function (err, fields, files) {

        var fb_id = fields.fb_id;
        var img_description = fields.img_description;
        var place_id = fields.place_id;
        form.username = fields.username;
        form.password = fields.password;
        form.uploadDir = '/opt/express-server' + '/images/' + generatedID + '.jpg';
        //console.log(form.username + form.password + '  ' + fb_id + '  ' +place_id + '  ' + img_description + '  ' + notEmptyObject(files) + '  ')
        //console.log(files)

        if (form.username == config.hangry.username && form.password == config.hangry.password && fb_id != null && img_description != null && place_id != null && notEmptyObject(files)) {

            form.validation = true;
            if (err) {
                console.log(err);
            } else {

                //find location in locationlist, retrieve objectID for imagelist update
                locationlist.find({'place_id': place_id}, {}, function (e, docs) {
                    var location_id = docs[0]._id.toString()

                    //push new image object to imagecollection to Location_ID (found in locationlist)
                    //{w:1} option gives result parameter back in callback
                    imagelist.update({'location_id': location_id}, {
                        $push: {
                            images: {

                                'fb_id': fb_id,
                                'image_url': generatedID + '.jpg',
                                'image_description': img_description,
                                'timestamp': new Date().toJSON()

                            }
                        }
                    }, {upsert:true,w:1}, function (err, result) {

                        if (err)console.log(err);
                        console.log('Added ' + result + ' image object to Location:  ' + location_id);

                    });

                    if (e)console.log(e);

                });
            }
        } else {
            res.writeHead(400, {'content-type': 'application/json'});
            res.write(JSON.stringify({fields: 'fields missing', files: 'file missing'}))
            res.end();
            form.validation = false;

        }

    });

    form.on('error', function (err) {
        console.log(err);
        request.resume()

    });
    //emitted when request has ended and all data are flushed
    //end callback doesn't take any parameter
    form.on('end', function (fields, files) {

        if (form.validation){
        //take this to access parameter from "IncomingForm"-Class from "form" Instance
            var temp_Path = this.openedFiles[0].path;

        fs.copy(temp_Path, form.uploadDir, function (err) {

            if (err) {
                console.log(err);
            } else {
                //lets see it
                res.writeHead(200, {'content-type': 'application/json'});
                res.end(JSON.stringify({image_id: generatedID}));

                console.log("success!!!")

            }

        });
    }
    });

});

router.post('/rating', function(req, res) {

    var db = req.db
    var locationlist = db.get('locationlist');
    var ratinglist = db.get('ratinglist');
    //create Instance from formidable to get access of files
    form = new formidable.IncomingForm();

    //pareses the request
    //fill the form instance with request data
    form.parse(req, function (err, fields, files) {

        var fb_id = fields.fb_id;
        var heart = fields.heart;
        var place_id = fields.place_id;

        if (fields.username == config.hangry.username && fields.password == config.hangry.password && fb_id != null && place_id != null && heart == 1)
            {
                if (err) {
                    console.log(err);
                } else {
                    //if fb_id and place_id match, downrate the location and pull out fd_id from ratinglist
                    ratinglist.find({$and :[{'place_id' : place_id, 'items' : {'fb_id' : fb_id}}]},function(e,doc){
                        console.log(doc[0])
                        if(doc.length > 0){
                            ratinglist.update({'place_id' : place_id},{

                                $pull:{
                                    items : {'fb_id' : fb_id}
                                }

                            },function(err,result){

                                locationlist.update({'place_id' : place_id},{

                                    $inc : { rating : -1 }

                                },function(err_1,result_1){

                                    locationlist.find({'place_id' : place_id},{},function(e,docs){

                                        res.writeHead(200, {'content-type': 'application/json'});
                                        res.end(JSON.stringify({ rating : false , counter : docs[0].rating }));
                                    })


                                });
                            });
                            //if place_id and fb_id doesnt match, rate +1 the location and add fb_id to ratinglist
                        } else {
                            ratinglist.update({'place_id' : place_id},{
                                            $push : {
                                                items : {
                                                    fb_id : fb_id
                                                }
                                            }
                                        },{upsert:true,w:1},function(err,result){

                                locationlist.update({'place_id' : place_id},{

                                    $inc : { rating : 1 }

                                },function(err_1,result_1){


                                    locationlist.find({'place_id' : place_id},{},function(e,docs){

                                        res.writeHead(200, {'content-type': 'application/json'});
                                        res.end(JSON.stringify({ rating : true , counter : docs[0].rating }));
                                    })
                                });
                            });


                        }
                    })

                }

            } else {
            res.writeHead(400, {'content-type': 'application/json'});
            res.write(JSON.stringify({fields: 'fields missing'}));
            res.end();
        }
    })

});

router.post('/friendsfeed',function(req,res){


    //friendsfeed for images from friends, found by fb_id in imagecollection
    var db = req.db
    var imagecollection = db.get('imagecollection');

    if ( req.body.username == config.hangry.username && req.body.password == config.hangry.password ){

        var list = { images : []};
        var shor_list = { images : []};
        var counter = 10;

            imagecollection.find({}, {}, function (err, docs) {
                for (key in req.body.friends) {
                    for (key_1 in docs) {
                        for (key_2 in docs[key_1].images) {
                            if (req.body.friends[key] == docs[key_1].images[key_2].fb_id) {
                                list.images.push(
                                    docs[key_1].images[key_2]
                                )
                            }
                        }
                    }
                }
                //shuffle array of images
                var keys;
                if( Object.keys) keys = Object.keys(list.images);
                else keys = (function(obj) {var k, ret = []; for( k in obj) if( obj.hasOwnProperty(k)) ret.push(k); return ret;})(list.images);

                //shuffle the keys
                keys.sort(function() {return Math.random()-0.5;});

                //push the keys to new array
                function doSomething(key) {
                    if(list.images[key] != null) {
                        shor_list.images.push(
                            list.images[key]
                        )
                    }
                }
                if( keys.forEach) keys.forEach(doSomething);
                else (function() {for( var i=0, l=counter; i<l; i++) doSomething(keys[i]);})();

                res.json(shor_list)
            });

    } else {
        res.writeHead(400, {'content-type' : 'application/json'});
        res.end(JSON.stringify({ "fields" : "parameters missing"}));
    }



});

router.post('/userfeed',function(req,res){


    //friendsfeed for images from friends, found by fb_id in imagecollection
    var db = req.db
    var imagecollection = db.get('imagecollection');

    if ( req.body.username == config.hangry.username && req.body.password == config.hangry.password ){

        var list = { images : []};
        var shor_list = { images : []};
        var counter = 10;

        imagecollection.find({"images.fb_id":req.body.fb_id}, {}, function (err, docs) {
                for (key_1 in docs) {
                    for (key_2 in docs[key_1].images) {
                        if (req.body.fb_id == docs[key_1].images[key_2].fb_id) {
                            list.images.push(
                                docs[key_1].images[key_2]
                            )
                        }
                    }
                }

            //shuffle array of images
            var keys;
            if( Object.keys) keys = Object.keys(list.images);
            else keys = (function(obj) {var k, ret = []; for( k in obj) if( obj.hasOwnProperty(k)) ret.push(k); return ret;})(list.images);

            //shuffle the keys
            keys.sort(function() {return Math.random()-0.5;});

            //push the keys to new array
            function doSomething(key) {
                if(list.images[key] != null) {
                    shor_list.images.push(
                        list.images[key]
                    )
                }
            }
            if( keys.forEach) keys.forEach(doSomething);
            else (function() {for( var i=0, l=counter; i<l; i++) doSomething(keys[i]);})();

            res.json(shor_list)
        });

    } else {
        res.writeHead(400, {'content-type' : 'application/json'});
        res.end(JSON.stringify({ "fields" : "parameters missing"}));
    }



});


module.exports = router;