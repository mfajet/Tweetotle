var express = require('express');
var app = express();
var config = require('./config.js');

var Twitter = require('twitter');
var twitterConfig = {
    consumer_key: config.twitterConsumerKey,
    consumer_secret: config.twitterConsumerSecret,
    access_token_key: config.twitterAccessToken,
    access_token_secret: config.twitterAccessTokenSecret,
}

var twitter = new Twitter(twitterConfig);

var googleMapsClient = require('@google/maps').createClient({
  key: config.googleKey
});
var ChipsAndGuac = require('chipsandguac');

var streamParams = {
	follow: config.twitterUserID,
	track: "Chiptole"
};
twitter.stream('statuses/filter', streamParams, function (stream) {
    stream.on('data', function (data) {
      order(data);
  	});
	stream.on('error', function (error) {
		console.log('ERROR: ' + error.message);
	});
});

var order = function(data){

  tweet= data;
  console.log(JSON.stringify(tweet));
  if(tweet.place){
    var zipcode;
    if(tweet.text=="I want Chipotle!"){
      console.log("Ordering start: " + tweet.place.full_name);
      googleMapsClient.geocode({
        address: tweet.place.full_name
      }, function(err, response) {
        if (!err) {
          var location = response.json.results[0].address_components;
          location.map(function(obj){
            if(obj.types[0]=="postal_code"){
              zipcode = obj.long_name;
              console.log(zipcode);
              ChipsAndGuac.getNearbyLocations(zipcode).then(function(locations) {
                console.log(JSON.stringify(locations));
                var cag = new ChipsAndGuac({
                  email:config.chipotleEmail,
                  password:config.chiptolePassword,
                  locationId: locations[0].id,
                  phoneNumber:config.chipotlePhoneNum// must match user profile
                });
                cag.getOrders().then(function(orders) {
                  console.log(JSON.stringify(orders));
                  cag.submitPreviousOrderWithId(orders[0].id, true).then(function(orderDetails) {
                    console.log(orderDetails);
                  });
                });
              });
            }
          });
        }else {
          console.log("Couldn't find location");
        }
      });
    }
  }
}
