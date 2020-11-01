var req = require('request');
var fs = require('fs').promises;
var path = require('path');

const TARGET = 'pioneer'; // 'all' || 'pioneer'

const configs = {
  all: {
    URL: 'http://mtgjson.com/api/v5/AllPrintings.json',
    DATA_FILE: path.join(__dirname, 'src/data/allsets.json'),
    ETAG_FILE: path.join(__dirname, 'src/data/allsets.etag'),
  },
  pioneercards: {
    URL: 'http://mtgjson.com/api/v5/Pioneer.json',
    DATA_FILE: path.join(__dirname, 'src/data/pioneercards.json'),
    ETAG_FILE: path.join(__dirname, 'src/data/pioneercards.etag'),
  },
};

function mtgjson(useConfig, callback) {
  return new Promise((resolve, reject) => {
    const URL = useConfig['URL'];
    const DATA_FILE = useConfig['DATA_FILE'];
    const ETAG_FILE = useConfig['ETAG_FILE'];
    return fs.readFile(ETAG_FILE).then(data => {
      if (data.err) {
        return { err: err };
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
          fs.readFile(DATA_FILE)
            .then(data => {
              if (data && data.err) {
                reject(data.err);
              }
              console.log('Readfile success');

              resolve(JSON.parse(data));
            })
            .catch(error => {
              console.log('EEEK');
              console.log(error);
            });
        }

        fs.writeFile(DATA_FILE, res.body)
          .then(data => {
            if (data && data.err) {
              reject(data.err);
            }

            fs.writeFile(ETAG_FILE, res.headers.etag)
              .then(data => {
                if (data && data.err) {
                  reject(data.err);
                }

                resolve(JSON.parse(res.body));
              })
              .catch(error => {
                console.log('EEEK');
                console.log(error);
              });
          })

          .catch(error => {
            console.log('EEEK');
            console.log(error);
          });
      });
    });
  })
    .then(data => {
      return data;
    })
    .catch(error => {
      console.log('BAD STUFF');
      console.log(error);
    });
}

async function go() {
  mtgjson(configs.pioneer).then(cards => {
    console.log(!!cards);
    console.log('Done');
    // Cards is object, not JSON already
  });
}

go();
