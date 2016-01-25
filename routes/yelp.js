/**
 * Created by rongo on 30.06.15.
 */
var yelp = require('yelp');
var config = require('../config');

    var yelp = yelp.createClient({
        consumer_key: config.yelp.consumer_key,
        consumer_secret: config.yelp.consumer_secret,
        token: config.yelp.token,
        token_secret: config.yelp.token_secret,
        ssl: true
    });


module.exports = {

    checkValue : function (json) {
    //Check if there are empty or undefined keys in URL-Substring
    for (key in json) {
        if (json[key] == null) {
            delete json[key];
        }
    }
    //return the cleaned JSON String without empty keys
    return json
    },
    //give cleaned JSON string to search function

    yelpSearch : function(cleanJSON, callback) {

    yelp.search(cleanJSON, function (err, result) {
        if (err === null) {
            //parse JSONString in Object
            //var obj = JSON.parse(result);
            var data = {items: []};

            data.total = result.businesses.length;

            for (key in result.businesses) {


                data.items.push(
                    {
                        id: result.businesses[key].id,
                        name: result.businesses[key].name,
                        location: [ result.businesses[key].location.coordinate.latitude, result.businesses[key].location.coordinate.longitude ],
                        image_url: result.businesses[key].image_url,
                        address: result.businesses[key].location.address[0],
                        yelp_rating: result.businesses[key].rating

                    }
                );
            }
            callback(data);
        } else {
            console.log(err);
        }
    });
    }
};