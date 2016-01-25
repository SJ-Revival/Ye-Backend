var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

//doesnt handly "multipart/form-data"
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var search = require('./routes/search');
var json_api = require('./routes/json');
var app = express();
//add timestamps in front of log messages
require('console-stamp')(console, 'dd/mm/yyyy HH:MM:ss.l');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/hungry');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));


//since logger only returns a UTC version of date, I'm defining my own date format - using an internal module from console-stamp
logger.format('mydate', function() {
    var df = require('console-stamp/node_modules/dateformat');
    return df(new Date(), 'HH:MM:ss.l');
});
app.use(logger(':mydate :method :url :status :res[content-length] - :remote-addr - :response-time ms'));

//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {

  req.db = db;
  next();
});

//comment out because not relevant for project
app.use('/', routes);
//app.use('/users', users);
app.use('/search', search);
app.use('/json', json_api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
console.log('App started in Mode:   ' + app.get('env'));
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
