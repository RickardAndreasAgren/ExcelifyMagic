
var req = require('request');
var fs = require('fs').promises;
var path = require('path');

var target = 'pioneer'; // 'all' || 'pioneer'

var callArgs = process.argv.slice(2);

const configs = {
  all: {
    URL: 'https://mtgjson.com/api/v5/AllPrintings.json',
    DATA_FILE: path.join(__dirname, 'src/data/allsets.json'),
    ETAG_FILE: path.join(__dirname, 'src/data/allsets.etag'),
  },
  pioneer: {
    URL: 'https://mtgjson.com/api/v5/Pioneer.json',
    DATA_FILE: path.join(__dirname, 'src/data/pioneercards.json'),
    ETAG_FILE: path.join(__dirname, 'src/data/pioneercards.etag'),
  },
  setmeta: {
    URL: 'https://mtgjson.com/api/v5/SetList.json',
    DATA_FILE: path.join(__dirname, 'src/data/setmeta.json'),
    ETAG_FILE: path.join(__dirname, 'src/data/setmeta.etag'),
  },
  pioneermeta: {
    URL: 'No',
    DATA_FILE: path.join(__dirname, 'src/data/pioneermeta.json'),
    ETAG_FILE: 'No',
  }
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mtgjson(useConfig, callback) {
  return new Promise((resolve, reject) => {
    const URL = useConfig['URL'];
    const DATA_FILE = useConfig['DATA_FILE'];
    const ETAG_FILE = useConfig['ETAG_FILE'];
    return fs.readFile(ETAG_FILE)
	     .catch(error => {
		console.log(error)
		if(error.code !== "ENOENT") {
			throw "Unsupported error"
		} else {
			return ""
		}
	})
	.then(data => {
      if (data.err) {
        return { err: err };
      }
      let updateFile = true;
      var localEtag = data ? data.toString() : "";

      var options = {};
      if (localEtag) {
        options.headers = { 'if-none-match': localEtag };
      }
      // REBUILD THIS FUCKING THING
      let {res, err} = req(URL, options, function(err, res) {
        console.log(`Request sent to ${URL}, got response `);
        console.log(!!res);
        console.log('Error is');
        console.log(err ? err : 'nothing');
        console.log('SCode');
        console.log(res.statusCode);
        return {res: res ? res : !!res,err: err};
      });
      while(!res && !err) {
        sleep(500);
      }

      var noInternetConnection = !!err;
      if (noInternetConnection || res.statusCode === 304) {
        console.log('No connection');
        updateFile = fs.readFile(DATA_FILE,'utf-8')
          .then(data => {
            console.log(`Data type is ${typeof data} with length ${data.length ? data.length : '<Not applicable>'}`);
            if (data && data.err) {
              console.log('Error reads:');
              console.log(data.err);
              reject(data.err);
            }
            if(data) {
              console.log('Readfile success');
              if(data.data) {
                console.log('Is good');
              }
              data.forEach(el => {
                console.log(el.name);
              });
              return false;
            } else {
              return data;
            }
          })
          .catch(error => {
            console.log('EEEK1');
            console.log(error.reason);
            console.log(error);
          });
      }

      if(!updateFile) {
        return 0;
      }
      console.log(`Updating ${DATA_FILE}`)
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
              console.log('EEEK2');
              console.log(error);
            });
        })
        .catch(error => {
          console.log('EEEK3');
          console.log(error);
        });
    });
  })
    .then(data => {
      console.log('Delivery to promise');
      return data;
    })
    .catch(error => {
      console.log('BAD STUFF');
      console.log(error);
    });
}

function validatePioneer() {
  console.log('Not implemented');
  return false;
}

function validateStandard() {
  console.log('Not implemented');
  return false;
}

function writePioneerMeta(allsets,allcards) {
  const config = configs.pioneermeta;
  //  October 5, 2012
  const pioneerTime = Date.parse('01 Oct 2012 00:00:00 UTC');
  // type == 'expansion' || type == 'core'
  var pioneer = {data: {}};

  // get only pioneer sets
  console.log(typeof allsets);
  allsets.data.filter(element => {
    const setTime = Date.parse(element.releaseDate);
    if(setTime > pioneerTime) {
      if(element.type == 'expansion' || element.type == 'core') {
        pioneer[element.code] = element;
      };
    };
  });
  let saveJson = JSON.stringify(pioneer);
  return fs.writeFile(config['DATA_FILE'], saveJson)
    .then(data => {
      if (data && data.err) {
        reject(data.err);
      }
      return true;
    });
}

async function go() {
  if (callArgs[0] == '-1' || callArgs[0] == 'pioneer' || callArgs.length < 1) {
    mtgjson(configs.pioneer).then(cards => {
      console.log(!!cards);
      console.log('Done');
    });
  } else if (callArgs[0] == '-2' || callArgs[0] == 'all') {
    mtgjson(configs.all).then(cards => {
      console.log(!!cards);
      console.log('Done');
    });
  } else if (callArgs[0] == '-10' || callArgs[0] == 'validate') {
    let whut = callArgs[1];
    if(whut) {
      if(whut == 'pioneer') {
        validatePioneer();
      } else if(whut == 'standard') {
        validateStandard();
      } else {
        throw new Error("Invalid syntax");
      }
    }
  } else if(callArgs[0] == '-4' || callArgs[0] == 'pioneerMeta') {
    mtgjson(configs.all).then(cards => {
      console.log(!!cards);
      console.log('Done getting all');

      mtgjson(configs.setmeta).then(sets => {
        console.log(!!sets);
        console.log('Done getting setlist');
        writePioneerMeta(sets,cards);
        console.log('Done writing pioneer meta');
      });
    });

  }
}

try {
  go();
} catch (e) {
  console.log(e.message);
} finally {
  console.log('Arguments are: ');
  console.log('-1 | Pioneer');
  console.log('-2 | all');
  console.log('-4 | pioneerMeta');
  console.log('-10 | validate');
  console.log('With added: standard | Pioneer');
}
