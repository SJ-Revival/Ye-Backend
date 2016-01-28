/**
 * Created by rongo on 25.01.16.
 */

var express = require('express');
var router = express.Router();

var config = require('../config');

var async = require('async');
var request = require('request');
var Geopoint = require('geopoint');

//if object is empty
function notEmptyObject(obj){
    for(var propName in obj){
        if(obj.hasOwnProperty(propName)){
            return true;
        }
    }
    return false;
}

trainStations = ["9058101",
    "9068201",
    "9079221",
    "9078201",
    "9077106",
    "9190001",
    "9120003",
    "9120001",
    "9110012",
    "9110004",
    "9110003",
    "9110002",
    "9110001",
    "9007102",
    "9009104",
    "9001201",
    "9020202",
    "9020201",
    "9026207",
    "9024106",
    "9024102",
    "9040101",
    "9044101",
    "9045102",
    "9044202",
    "9054105",
    "9054104"
]

console.log(trainStations.indexOf('9058101'));

function getNextStation(sbody, tbody) {
    sbody = JSON.parse(sbody);
    tbody = JSON.parse(tbody);

    result = [];
    l = 0;
    //Iterate over Train Objects
    for(k = 0; k < tbody.t.length; k++) {
        //Check if line S42
        if(tbody.t[k].n.match(".*S42")) {
            result.push({
                trainID: tbody.t[k].i,
                stations: []
            });
            //calculate geoPosition
            trainPoint = new Geopoint(tbody.t[k].x/Math.pow(10, 6), tbody.t[k].y/Math.pow(10, 6));
            //Iterate over Station Objects
            for(i = 1; i < sbody.stops.length; i++) {
                //Iterate over AvailableProducts in StationObject
                for(j = 0; j < sbody.stops[i][7].length; j++) {
                    //console.log(sbody.stops[i][7][j])
                    //Check if AvailableProduct is in StationObject
                    if(sbody.stops[i][7][j][1].match("S42")){
                        stationPoint = new Geopoint(sbody.stops[i][0]/Math.pow(10, 6), sbody.stops[i][1]/Math.pow(10, 6));
                        newDist = trainPoint.distanceTo(stationPoint, true);
                        console.log(stationPoint);
                        result[l].stations.push({
                                stationName: sbody.stops[i][3], //StationName
                                stationID: sbody.stops[i][4],
                                latX: sbody.stops[i][0], //Lat(x)
                                longY: sbody.stops[i][1], //Long(y)
                                distance: newDist //DistTrainStation
                    });
                        //console.log(sbody.stops[i][7][j][1] + " lat(x):" + sbody.stops[i][0]/Math.pow(10, 6) + " long(y):" + sbody.stops[i][1]/Math.pow(10, 6))
                    }
                }
            }
            //sort Station to TrainID by distance
            result[l].stations.sort(function(a,b){
               return a.distance - b.distance
            });
            //raiseStation array
            l++;
            //console.log(tbody.t[k].n + " lat(x):" + tbody.t[k].x + " long(y):" + tbody.t[k].y)
        }
    }
    return result;
}

function getClosestStation(trains, dist) {
    result = [];

    for(j = 0; j < trains.length; j++) {
        if(trains[j].stations[0].distance == 0){
            startStation = trains[j].stations[0].stationID;
            indexStart = trainStations.indexOf(startStation);
            stopStation = trains[j].stations[indexStart + 1];
        }
        for (i = 0; i < trains[j].stations.length; i++) {

            if (dist == null || trains[j].stations[i].distance <= dist) {

            }


        }
    }

}



//app.get('/report/:chart_id/:user_id', function (req, res) {
//    // res.sendFile(filepath);
//});



//GET S Trains
//http://fahrinfo.vbb.de/bin/query.exe/dny?look_minx=13078331&look_maxx=13736825&look_miny=52461974&look_maxy=52578126&tpl=trains2json2&look_productclass=1&look_json=yes&performLocating=1&look_nv=zugposmode|2|interval|30000|intervalstep|2000|

//GET S Stations
//http://fahrinfo.vbb.de/bin/query.exe/dny?performLocating=2&tpl=stop2shortjson&look_minx=13080563&look_maxx=13734593&look_miny=52483514&look_maxy=52556631&&look_stopclass=1&look_nv=get_shortjson|yes|get_lines|yes|combinemode|1|density|26|

    /* GET current S Bahn state */
    router.get('/bahnfeed', function(req, res) {
        var look_minx = 13049664
        var look_maxx = 13765492
        var look_miny = 52468876
        var look_maxy = 52571240
        var tpl = "trains2json2"
        var look_productclass = 65
        var look_json = "yes"
        var performLocating = 1
        var look_nv = "zugposmode|2|interval|30000|intervalstep|2000|"

        base_url = "http://fahrinfo.vbb.de/bin/query.exe/dny?"
        request_url_train = base_url
            + "look_minx="
            + look_minx
            + "&look_maxx="
            + look_maxx
            + "&look_miny="
            + look_miny
            + "&look_maxy="
            + look_maxy
            + "&tpl="
            + tpl
            + "&look_productclass="
            + look_productclass
            + "&look_json="
            + look_json
            + "&performLocating="
            + performLocating
            + "&look_nv="
            + look_nv;

        request_url_trains = "http://localhost/vbb/vbb_trains"
        request_url_stations = "http://localhost/vbb/vbb_stations"

        trainList = []
        request(request_url_stations, function(serror, sresponse, sbody){
            if (!serror && sresponse.statusCode == 200){
                request(request_url_trains, function(terror, tresponse, tbody){
                    if (!terror && tresponse.statusCode == 200){

                        distance = getNextStation(sbody, tbody);
                        result = getNextStation(distnace);





                        res.json(distance);
                        res.end()

                    }


                });
            }
        });


    });

module.exports = router;
