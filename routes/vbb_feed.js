/**
 * Created by rongo on 25.01.16.
 */

var express = require('express');
var router = express.Router();

var async = require('async');
var request = require('request');
var Geopoint = require('geopoint');

//if object is empty
function notEmptyObject(obj) {
    for (var propName in obj) {
        if (obj.hasOwnProperty(propName)) {
            return true;
        }
    }
    return false;
}

var trainStations = ["9058101",
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
];


function getNextStation(sbody, tbody) {
    sbody = JSON.parse(sbody);
    tbody = JSON.parse(tbody);

    var result = [];
    var l = 0;
    //Iterate over Train Objects
    for (var k = 0; k < tbody["t"].length; k++) {
        //Check if line S42
        if (tbody["t"][k]["n"].match(".*S42")) {
            result.push({
                trainID: tbody["t"][k]["i"],
                x: tbody["t"][k]["x"],
                y: tbody["t"][k]["y"],
                stations: [],
                p: tbody["t"][k]["p"]
            });
            //calculate geoPosition
            var trainPoint = new Geopoint(tbody["t"][k]["x"] / Math.pow(10, 6), tbody["t"][k]["y"] / Math.pow(10, 6), false);
            //Iterate over Station Objects
            for (var i = 1; i < sbody["stops"].length; i++) {
                //Iterate over AvailableProducts in StationObject
                for (var j = 0; j < sbody["stops"][i][7].length; j++) {
                    //console.log(sbody.stops[i][7][j])
                    //Check if AvailableProduct is in StationObject
                    if (sbody["stops"][i][7][j][1].match("S42")) {
                        var stationPoint = new Geopoint(sbody["stops"][i][0] / Math.pow(10, 6), sbody["stops"][i][1] / Math.pow(10, 6), false);
                        var newDist = trainPoint.distanceTo(stationPoint, true);
                        //console.log(stationPoint);
                        result[l].stations.push({
                            stationName: sbody["stops"][i][3], //StationName
                            stationID: sbody["stops"][i][4],
                            latX: sbody["stops"][i][0], //Lat(x)
                            longY: sbody["stops"][i][1], //Long(y)
                            distance: newDist //DistTrainStation
                        });
                        //console.log(sbody.stops[i][7][j][1] + " lat(x):" + sbody.stops[i][0]/Math.pow(10, 6) + " long(y):" + sbody.stops[i][1]/Math.pow(10, 6))
                    }
                }
            }
            //sort Station to TrainID by distance
            result[l].stations.sort(function (a, b) {
                return a.distance - b.distance
            });
            //raiseStation array
            l++;
            //console.log(tbody.t[k].n + " lat(x):" + tbody.t[k].x + " long(y):" + tbody.t[k].y)
        }
    }
    return result;
}

function getClosestStation(trains) {
    var calc = [];

    for (var j = 0; j < trains.length; j++) {

        // try to get interpolatet positions from trains
        //iterate through trains
        //console.log("First station distance:   " + trains[j].stations[0].distance)
        if (trains[j].stations[0].distance == 0) {
            var startStation = trains[j].stations[0].stationID;
            var indexStart = trainStations.indexOf(startStation.toString());
            var stopStation = null;
            //console.log(indexStart)
            if ((indexStart + 1) > trainStations.length) {
                stopStation = trainStations[0];
            } else {
                stopStation = trainStations[indexStart + 1];
                //console.log("If station not last in array:   " + stopStation)
            }

            //console.log("If startStation is zero:   " + startStation + "  " + stopStation)
        } else {
            var first_station = trains[j].stations[0].stationID;
            var first_indexStation = trainStations.indexOf(first_station.toString());

            var second_station = trains[j].stations[1].stationID;
            var second_indexStation = trainStations.indexOf(second_station.toString());
            //console.log("If startStation is not zero:   " + first_station + "  " +first_indexStation  + "   " + second_station + "  " + second_indexStation);

            if (first_indexStation < second_indexStation) {
                startStation = first_station;
                stopStation = second_station;
            } else {
                startStation = second_station;
                stopStation = first_station;
            }
        }

        var result = {trainID: trains[j].trainID};

        //iterate through stations from train
        for (var i = 0; i < trains[j].stations.length; i++) {
            var station = trains[j].stations[i];

            //console.log(station.stationID)
            if (station.stationID == startStation) {

                result.startStation = station.stationName;
                result.startID = station.stationID;
                result.startLatX = station.latX;
                result.startLongY = station.longY;
                result.startDistance = station.distance;
            }

            if (station.stationID == stopStation) {
                result.stopStation = station.stationName;
                result.stopID = station.stationID;
                result.stopLatX = station.latX;
                result.stopLongY = station.longY;
                result.stopDistance = station.distance;
            }


        }

        var startStationPoint = new Geopoint(result.startLatX / Math.pow(10, 6), result.startLongY / Math.pow(10, 6), false);
        var stopStationPoint = new Geopoint(result.stopLatX / Math.pow(10, 6), result.stopLongY / Math.pow(10, 6), false);
        result.p = [];


        for (i = 0; i < trains[j].p.length; i++) {
            var trainPoint = new Geopoint(trains[j].p[i].x / Math.pow(10, 6), trains[j].p[i].y / Math.pow(10, 6), false);
            var startDist = trainPoint.distanceTo(startStationPoint, true);
            var stopDist = trainPoint.distanceTo(stopStationPoint, true);
            var percentage = 100 / (startDist + stopDist) * startDist;
            //console.log("percentage:  " + percentage + " for time:  " + trains[j].p[i].t)
            result.p.push({
                percentage: percentage,
                time: trains[j].p[i]["t"]
            })

        }

        result.percentage = 100 / (result.startDistance + result.stopDistance) * result.startDistance;

        //console.log(result.trainID + "   " + result.startDistance + "+" + result.stopDistance + ":" + result.percentage);
        calc.push(result);
        //console.log(calc)
    }
    return calc;
}


//app.get('/report/:chart_id/:user_id', function (req, res) {
//    // res.sendFile(filepath);
//});


//GET S Trains
//http://fahrinfo.vbb.de/bin/query.exe/dny?look_minx=13078331&look_maxx=13736825&look_miny=52461974&look_maxy=52578126&tpl=trains2json2&look_productclass=1&look_json=yes&performLocating=1&look_nv=zugposmode|2|interval|30000|intervalstep|2000|

//GET S Stations
//http://fahrinfo.vbb.de/bin/query.exe/dny?performLocating=2&tpl=stop2shortjson&look_minx=13080563&look_maxx=13734593&look_miny=52483514&look_maxy=52556631&&look_stopclass=1&look_nv=get_shortjson|yes|get_lines|yes|combinemode|1|density|26|

/* GET current S Bahn state */
router.get('/bahnfeed', function (req, res) {
    var look_minx = 13049664;
    var look_maxx = 13765492;
    var look_miny = 52468876;
    var look_maxy = 52571240;
    var tpl = "trains2json2";
    var look_productclass = 65;
    var look_json = "yes";
    var performLocating = 1;
    var look_nv = "zugposmode|2|interval|30000|intervalstep|2000|";

    var base_url = "http://fahrinfo.vbb.de/bin/query.exe/dny?";
    var request_url_trains = base_url
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


    //grid to small, need more locations with one API request or create own JSON with S42 stations
    performLocating = 2;
    tpl = "stop2shortjson";
    look_nv = "get_shortjson|yes|get_lines|yes|combinemode|1|density|26|";
    var look_stopclass = 1;


    var request_url_stations = base_url
        + "performLocating="
        + performLocating
        + "&look_minx="
        + look_minx
        + "&look_maxx="
        + look_maxx
        + "&look_miny="
        + look_miny
        + "&look_maxy="
        + look_maxy
        + "&tpl="
        + tpl
        + "&look_stopclass="
        + look_stopclass
        + "&look_nv="
        + look_nv;

    //request_url_trains = "http://localhost/vbb/vbb_trains"
    request_url_stations = "http://localhost/vbb/vbb_stations";

    console.log(request_url_stations);
    console.log(request_url_trains);

    request(request_url_stations, function (serror, sresponse, sbody) {
        if (!serror && sresponse.statusCode == 200) {
            request(request_url_trains, function (terror, tresponse, tbody) {
                if (!terror && tresponse.statusCode == 200) {

                    var distance = getNextStation(sbody, tbody);
                    var result = getClosestStation(distance);

                    res.json(result);
                    res.end()
                }
            });
        }
    });
});

router.get('/stationfeed', function (req, res) {
    var json = require('../stations.json');
    res.json(json);
    res.end()

});

module.exports = router;
