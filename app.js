var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var requestify = require('requestify');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.set('port', process.env.PORT || 3000);

var Twit = require('twit')
var nodeDrpc = require('node-drpc');
var nodeDrpcClient =  new  nodeDrpc("152.46.18.144", 3772);
var sploutBaseUrl = 'http://152.46.19.147:4412/api/query/inverted_index_2?key=&sql=select%20*%20from%20tweet_index%20where%20word%20=%20%22';

var T = new Twit({
  consumer_key: 'GxJmUr1a8GWJkasgcC6noJC6P',
  consumer_secret: 'HsBSoBTDQapSxILBkhvncz5v4uQba5q36UhLE72SpJTiTJZR3l',
  access_token: '2197692912-pr1vTBxWrsM1AjzDACKk1IU7wufQ9YCOAOEhh6a',
  access_token_secret: 'caLInLVR5YAW3bCOqHLh4NVWfDMHvLT4ILuNDeOv8CT7f'
});

io.on('connection', function(socket) {
  var mm;
  var start_time;
  socket.on('search', function(msg) {
    mm = msg;
    start_time = new Date().getTime();
    drpcQuery(msg, tweet_test);
    sploutQuery(msg, merge_lambda);
  });

  function tweet_test(tweets) {
    socket.emit("result_drpc_time", tweets.length + " results in " +
                                          (new Date().getTime() - start_time)/1000 + " seconds");
    //sploutQuery(mm, tweets, merge_lambda);
    socket.emit("result_drpc", tweets);
    for(var i = 0; i < tweets.length; i = i + 2) {
      if(i + 2 > tweets.length) {
        setInterval(function() { socket.emit("result_drpc", tweets.slice(i)); }, 5000);
      } else {
        setInterval(function() { socket.emit("result_drpc", tweets.slice(i, i + 2)); }, 5000);
      }
    }
  }

  function merge_lambda(tweets) {
    socket.emit("result_splout_time", tweets.length + " results in " +
                                            (new Date().getTime() - start_time)/1000 + " seconds");
    socket.emit("result_splout", tweets);
    for(var i = 0; i < tweets.length; i = i + 2) {
      if(i + 2 > tweets.length) {
        setInterval(function() { socket.emit("result_splout", tweets.slice(i)); }, 5000);
      } else {
        setInterval(function() { socket.emit("result_splout", tweets.slice(i, i + 2)); }, 5000);
      }
    }
  }
});

function sploutQuery(msg, merge_lambda) {
  var tweets = [];
  requestify.get( sploutBaseUrl + msg + '%22')
      .then(function(response) {
        try {
          var tweetText = response.getBody()["result"][0]["tweet"];
          var tweetIds = tweetText.split(" ");
          tweetIds.forEach(function (tweetId) {
            if (tweetId.length > 0) {
              var id = tweetId.substr(0, tweetId.indexOf("_"));
              var username = tweetId.substr(tweetId.indexOf("_") + 1);
              if (id.length > 0 && username.length > 0) {
                tweets.push({uname: username, id: id});
              }
            }
          });
        } catch(err) {
          //Empty response from splout, not an error
        }
      merge_lambda(tweets);
  });
}

function drpcQuery(msg, tweet_test) {
  nodeDrpcClient.execute("get_tweets", msg, function(err, response) {
    var tweets = [];
    if (err) {
      console.error(err);
      // implement error handling logic here
    } else {
      var tweetIds = response.split(",");
      console.log(tweetIds);
      tweetIds.forEach(function(tweetId) {
        if(tweetId.length > 0) {
          var id = tweetId.substr(0, tweetId.indexOf("_"));
          var username = tweetId.substr(tweetId.indexOf("_") + 1);
          if(id.length > 0 && username.length > 0) {
            tweets.push({uname: username, id: id});
          }
        }
      });
      tweet_test(tweets);
    }
  });
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
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
http.listen(app.get('port'));
