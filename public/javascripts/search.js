/**
 * Created by aadisriram on 4/24/15.
 */

var port = 3000;

var server_name = "http://localhost:" + port + "/";
var server = io.connect(server_name);

server.on("result_drpc_time", function(message) {
   $("#time-taken-storm").html(message);
});

server.on("result_splout_time", function(message) {
   $("#time-taken-splout").html(message);
});

server.on("result_drpc", function(message) {
   message.forEach(function(tweet) {
      $("#tweet-container-drpc").append(
          '<blockquote class="twitter-tweet"><p>Loading tweet ' + tweet.id  + '</p><a href="https://twitter.com/'+ tweet.uname + '/status/' + tweet.id +'"></a></blockquote><script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>'
      );
   });
});

server.on("result_splout", function(message) {
   message.forEach(function(tweet) {
      $("#tweet-container-splout").append(
          '<blockquote class="twitter-tweet"><p>Loading tweet ' + tweet.id  + '</p><a href="https://twitter.com/'+ tweet.uname + '/status/' + tweet.id +'"></a></blockquote><script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>'
      );
   });
});

$('form').submit(function(){
   $("#tweet-container-drpc").empty();
   $("#tweet-container-splout").empty();
   server.emit("search", $("#hashtag").val());
   return false;
});
