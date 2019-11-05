var req = require('request');
var fs = require('fs');
var path = require('path');

const TARGET = 'pioneer'; // 'all' || 'pioneer'

const configs = {
  all: {
    URL: 'http://mtgjson.com/json/AllSets.json',
    DATA_FILE: path.join(__dirname, 'src/data/allsets.json'),
    ETAG_FILE: path.join(__dirname, 'src/data/allsets.etag'),
  },
  pioneer: {
    URL: 'http://mtgjson.com/json/PioneerCards.json',
    DATA_FILE: path.join(__dirname, 'src/data/pioneer.json'),
    ETAG_FILE: path.join(__dirname, 'src/data/pioneer.etag'),
  },
};

const URL = configs[TARGET]['URL'];
const DATA_FILE = configs[TARGET]['DATA_FILE'];
const ETAG_FILE = configs[TARGET]['ETAG_FILE'];

function mtgjson(callback) {
  fs.readFile(ETAG_FILE, function(err, data) {
    if (err) {
      return callback(err);
    }
    console.log('No error');
    var localEtag = data.toString();

    var options = {};
    if (localEtag) {
      options.headers = { 'if-none-match': localEtag };
    }
    req(URL, options, function(err, res) {
      console.log('Request sent, got');
      console.log(!!res);
      console.log('Error is');
      console.log(err ? err : 'nothing');
      console.log('SCode');
      console.log(res.statusCode);
      var noInternetConnection = !!err;
      if (noInternetConnection || res.statusCode === 304) {
        return fs.readFile(DATA_FILE, function(err, data) {
          if (err) {
            return callback(err);
          }
          console.log('Readfile success');

          callback(null, JSON.parse(data));
        });
      }

      fs.writeFile(DATA_FILE, res.body, function(err) {
        if (err) {
          return callback(err);
        }

        fs.writeFile(ETAG_FILE, res.headers.etag, function(err) {
          if (err) {
            return callback(err);
          }

          callback(null, JSON.parse(res.body));
        });
      });
    });
  });
}

function go() {
  mtgjson(function(err, data) {
    if (err) {
      return console.log(err);
    }
    // Console.log(data.ELD.cards);
    console.log('Done');
    // Prints out all cards from the Limited Edition Alpha (LEA) set
  });
}

go();
