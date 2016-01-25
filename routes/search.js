/**
 * Created by rongo on 15.07.15.
 */
var express = require('express');
var router = express.Router();

var yelp = require('./yelp');
var google = require('./google');
var async = require('async');

var cat_filter;
var db;
var collection;
var jsonYelp;
var jsonGoogle;
// location=Jena&geo_coord=50.9289793,11.5843442&rad_filter=500&cat_filter=italian

//for array search task in mongoDB
//model.find({
//    '_id': { $in: [
//        '4ed3ede8844f0f351100000c',
//        '4ed3f117a844e0471100000d',
//        '4ed3f18132f50c491100000e'
//    ]}
//}, function(err, docs){
//    console.log(docs);
//});

function loopSearch (response,response_1){

    var trim_Google_Lat;
    var trim_Google_Long;
    var trim_Yelp_Lat;
    var trim_Yelp_Long;
    var big_image_url;
    var stringReplace_Yelp;
    var stringReplace_Google;
    //loop through google response
    //the reason for loop, to merge yelp and google response with locaition geocoord
    for (key in response.items) {

        //loop through yelp response
        for (key_1 in response_1.items) {
            //how to compare responses from yelp and google
            //one idea to compare coord
            trim_Google_Lat = response.items[key].location[0].toFixed(3);
            trim_Google_Long = response.items[key].location[1].toFixed(3);
            trim_Yelp_Lat = response_1.items[key_1].location[0].toFixed(3);
            trim_Yelp_Long = response_1.items[key_1].location[1].toFixed(3);
            //Replace Street name with nothing, only street number
            stringReplace_Yelp = response_1.items[key_1].address.replace( /^\D+/g, '');
            //Replace Street name with nothing, only street number
            stringReplace_Google = response.items[key].address.split(',')[0].replace( /^\D+/g, '');
            //console.log(stringReplace_Google);

            //compare geocoord with accuracy of 3 comma places and the number of street
            if (trim_Google_Lat == trim_Yelp_Lat && trim_Google_Long == trim_Yelp_Long && stringReplace_Google == stringReplace_Yelp) {

                if(response_1.items[key_1].yelp_rating != null)response.items[key].yelp_rating = response_1.items[key_1].yelp_rating;
                //if the coords match, add image url from yelp API
                //change jpg size with regex replace
                big_image_url = response_1.items[key_1].image_url;
                console.log(big_image_url)
                if (big_image_url != null)big_image_url = big_image_url.replace('ms.jpg', '348s.jpg');
                response.items[key].images = [];
                response.items[key].images.push({
                    image_url : big_image_url,
                    image_description : 'Yelp Picture'
                });
            }
        }
    }

}

function completeSearch (jsonGoogle,jsonYelp,callback) {



    //Call google class to get results from GoogleAPI
    google.search(jsonGoogle, function (response) {
        //Call yelp API to get results from Yelp API
        yelp.yelpSearch(jsonYelp, function (response_1) {

            //call the for loop through google and yelp responses
            loopSearch(response,response_1);

            callback(response);
        });
    });
}

router.get('/', function(req, res){

    //check for Yelp API if category is set
    if ( req.query.cat_filter == '' || req.query.cat_filter == null ) {
        cat_filter = 'restaurants';
    } else {
      cat_filter = 'restaurants,' + req.query.cat_filter;
    };

    jsonYelp = {
        //'location': req.query.location,
        'll': [ req.query.geo_coord ],
        'category_filter': req.query.cat_filter,
        'radius_filter': req.query.rad_filter,
        'term': [ 'restaurants' ],
        'sort': 0,
        'limit': 20,
        //'offset': req.query.offset
    };

    jsonGoogle = {
        'location' : [ req.query.geo_coord ],
        'radius' : req.query.rad_filter,
        'types' : [ 'restaurant' ],
        //keyword sometimes returns zero results
        'keyword' : req.query.cat_filter
        //to get more suggest comment it out
        //'opennow' : false
    };

    if ( req.query.is_open == 'true' ){
        jsonGoogle.opennow = true
    } else {
        console.log("Show all locations open/closed")

    }
    //here comes the JSON Restaurant response (function parameter(response) is name of function)
    completeSearch(jsonGoogle,jsonYelp,function (response) {

        db = req.db;
        var locationlist = db.get('locationlist');
        var imagelist = db.get('imagecollection')

        //use async function for the loop, to wait for each search with MongoDB
        //loop through mongo db with place id, to look if id with items exists
        async.eachSeries(response.items,function(item,cb) {
            locationlist.find({'place_id': item.place_id}, {}, function (e, locations) {
                if (locations.length > 0 ){
                    item.rating = locations[0].rating;
                    var location_id = locations[0]._id.toString();
                    //if images exist, add it to JSON response
                    imagelist.find({'location_id': location_id},{},function(e,docs){
                        if(docs.length > 0) {
                            //console.log(docs[0].images[0])
                            if (item.images != undefined)var yelp_img = item.images[0];
                            for (key in docs[0].images){
                                docs[0].images[key].image_url = 'http://ec2-52-28-74-34.eu-central-1.compute.amazonaws.com/images/' + docs[0].images[key].image_url;
                            }
                            item.images = docs[0].images;
                            if (yelp_img != null)item.images.push( yelp_img );
                        }
                    })

                }else{
                    //If place doesnt exist in db, create it
                    locationlist.insert({
                        'place_id' : item.place_id,
                        'name' : item.name,
                        'rating' : 0,
                        'counter' : 0
                    }, function (err, doc){
                        if (err) {
                            // If it failed, return error
                            console.log("There was a problem adding the information to the database.");
                        }
                        else {
                            //And forward to success page
                            console.log('Added new location to database');
                        }

                    });
                };
                cb(e)
            })
        }, function(e){
            if (e)throw e;

            //Build new JSON Object for Places with Image only
            var response_clean = { items : [] };
            for (key in response.items){
                if (response.items[key].hasOwnProperty('images')){

                    response_clean.items.push(response.items[key]);
                }
            }

            //here you get the answer from HTTP Request in JSON Format
            //res.json(response)
            res.json(response_clean)
        });
    })
});

router.get('/category', function(req, res){

    //show category list
    db = req.db;
    collection = db.get('categorylist');

    collection.find({},{},function(e,docs){
        res.json(docs);
    })

});

router.get('/yelp', function(req, res){

    var test = 40;
    jsonYelp = {
        //'location': req.query.location,
        'll': [ req.query.geo_coord ],
        'category_filter': req.query.cat_filter,
        'radius_filter': req.query.rad_filter,
        'term': [ 'restaurants' ],
        'sort': 1,
        'limit': 20,
        'offset': test
    };

    yelp.yelpSearch(jsonYelp,function(response){
        res.json(response);
    })

});

router.get('/google', function(req, res){

    var body = [];
    var token = true;
    jsonGoogle = {
        'location' : [ req.query.geo_coord ],
        'radius' : req.query.rad_filter,
        'types' : [ 'restaurant' ],
        //keyword sometimes returns zero results
        'keyword' : req.query.cat_filter,
        //to get more suggest comment it out
    };

    if ( req.query.is_open == 'true' ){
        jsonGoogle.opennow = true
    } else {
        console.log("Show all locations open/closed")

    }

        //google.search(jsonGoogle, function (response) {
        //
        //    res.json(response);
        //
        //
        //});
    var counter = 0


            google.search(jsonGoogle, function (response) {

               res.json(response)

            });




});

module.exports = router;