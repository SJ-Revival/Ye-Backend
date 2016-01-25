/**
 * Created by rongo on 09.07.15.
 */
    var GooglePlaces = require('googleplaces');
    var assert = require('assert');
    var config = require('../config');
    var search = new GooglePlaces(config.google.apiKey, config.google.outputFormat);
    var async = require('async');
    var data = {items: []};
    var token = true;
    var counter = 0;

    module.exports = {

        //asynchronous callback function needed
        search: function (parameters, callback) {

            async.whilst(function () {
                console.log(token +'  ' + counter);
                return counter < 3 && token;
            },function(next) {


                console.log(parameters)
                search.placeSearch(parameters, function (error, response) {

                    //build json from google response
                    for (key in response.results) {

                        console.log(response.results[key].name);
                        data.items.push(
                            {
                                place_id: response.results[key].place_id,
                                name: response.results[key].name,
                                location: [response.results[key].geometry.location.lat, response.results[key].geometry.location.lng],
                                address: response.results[key].vicinity
                            }
                        );

                    }

                    data.total = response.results.length;

                    if(response.next_page_token != undefined){
                        parameters.pagetoken = response.next_page_token;
                        token = true
                    } else {
                        token = false
                    }

                    if (error) throw error;
                    //assert.notEqual(response.results.length, 0, "Place search must not return 0 results");

                    counter++
                    //need timer here, cant request immediately after first search request (sleep 4000)
                    //other ways like below: node fiber and thread sleep
                    setTimeout(function(){
                        next()
                    }, 4000);
                });
            }, function(err){
                if(err)console.log(err);
                callback(data);

            })

    }
}
//
// exports.<newFunctionName> = <functionname>