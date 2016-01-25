/**
 * Created by rongo on 29.07.15.
 */
var express = require('express');
var router = express.Router();

var shortid = require('shortid');
var config = require('../config');


router.post('/rating', function(req, res) {

    var db = req.db;
    var locationlist = db.get('locationlist');
    var ratinglist = db.get('ratinglist');

    //pareses the request
    //fill the form instance with request data
    var username = req.body.username;
    var password = req.body.password;
        var fb_id = req.body.fb_id;
        var heart = req.body.heart;
        var place_id = req.body.place_id;

        if (username == config.hangry.username && password == config.hangry.password && fb_id != null && place_id != null && heart == 1)
        {
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

        } else {
            res.writeHead(400, {'content-type': 'application/json'});
            res.write(JSON.stringify({fields: 'fields missing'}));
            res.end();
        }

});

module.exports = router;