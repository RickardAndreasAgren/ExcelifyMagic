
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
  },
  pioneercustom: {
    URL: 'No',
    DATA_FILE: path.join(__dirname, 'src/data/pioneercustom.json'),
    ETAG_FILE: 'No',
  }
};

function mtgjson(useConfig, callback) {
  return new Promise((resolve, reject) => {
    const URL = useConfig['URL'];
    const DATA_FILE = useConfig['DATA_FILE'];
    const ETAG_FILE = useConfig['ETAG_FILE'];
    fs.readFile(ETAG_FILE)
	      .catch(error => {
    		console.log(error)
    		if(error.code !== "ENOENT") {
    			throw "Unsupported error"
    		} else {
    			return ""
    		}
    	 })
    	 .then(async data => {
          if (data.err) {
            return { err: err };
          }
          let updateFile = true;
          var localEtag = data ? data.toString() : "";

          var options = {};
          if (localEtag) {
            options.headers = { 'if-none-match': localEtag };
          }

          console.log(`Getting ${URL}`);
          let resultData = await wrappedReq(URL, options, handleData, {URL: URL, DATA_FILE: DATA_FILE, ETAG_FILE: ETAG_FILE});
          if(resultData.error) {
            console.log(`Call to ${URL} complete, with error ${resultData.error}`)
            return reject(resultData.error);
          } else {
            console.log(`Call to ${URL} complete`)
            return resolve(resultData);
          }
        });
  });
}

async function handleData(res, callbackData) {
  const URL = callbackData['URL'];
  const DATA_FILE = callbackData['DATA_FILE'];
  const ETAG_FILE = callbackData['ETAG_FILE'];
  var noInternetConnection = !!res.error;
  if(res && res.body) {
    if(typeof res.body === 'string') {
      res.body = JSON.parse(res.body)
    }
  }
  if (noInternetConnection || res.statusCode === 304) {
    console.log('No connection');
    console.log(`Reading ${DATA_FILE}`);
    return await fs.readFile(DATA_FILE)
      .then(data => {
        let jsonData;
        try {
          jsonData = JSON.parse(data);
        } catch (e) {
          console.log('JSON parse failed');
          console.log(e);
        }
        console.log(`Data type is ${typeof jsonData} with length ${jsonData.length ? jsonData.length : '<Not applicable>'}`);
        if (jsonData && jsonData.err) {
          console.log('Error reads:');
          console.log(jsonData.err);
          return {error: jsonData.err};
        }
        if(jsonData) {
          console.log('Readfile success');
          if(jsonData.data) {
            console.log('Is good');
          }
          /* data.forEach(el => {
            console.log(el.name);
          });*/
          return jsonData;
        } else {
          return 1;
        }
      })
      .catch(error => {
        console.log('EEEK1');
        console.log(error.reason);
        console.log(error);
        return {error: error};
      });
  } else {
    console.log(`Updating ${DATA_FILE}`)
    let completion = await fs.writeFile(DATA_FILE, JSON.stringify(res.body))
      .then(data => {
        if (data && data.err) {
          return {error: data.err};
        }

        return fs.writeFile(ETAG_FILE, res.headers.etag)
          .then(data => {
            if (data && data.err) {
              return {error: data.err};
            }

            return res.body;
          })
          .catch(error => {
            console.log('EEEK2');
            console.log(error);
            return {error: error};
          });
      })
      .catch(error => {
        console.log('EEEK3');
        console.log(error);
        return {error: error};
      });
      return completion;
  }
};

async function wrappedReq(url, options, callback, callbackData) {
  return new Promise((resolve, reject) => {
    req(url, options, async function(err, res) {
      console.log(`Request sent to ${url}, got response `);
      console.log(!!res);
      console.log(`Error is ${err ? err : 'nothing'}`);
      console.log(`SCode: ${res.statusCode}`);
      const result = err ? {error: err} : res;
      if(result.error) {
        reject(result);
      }
      const data = await callback(result, callbackData);
      console.log(`callback result: ${!!callbackData}`);
      resolve(data);
    });
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
  var pioneerMeta = {data: {}};

  // get only pioneer sets
  console.log(typeof allsets);
  allsets.data.filter(element => {
    const setTime = Date.parse(element.releaseDate);
    if(setTime > pioneerTime) {
      if(element.type == 'expansion' || element.type == 'core') {
        pioneerMeta.data[element.code] = element;
      };
    };
  });
  let saveJson = JSON.stringify(pioneerMeta);
  return new Promise((resolve,reject) => {
    fs.writeFile(config['DATA_FILE'], saveJson)
    .then(data => {
      if (data && data.err) {
        reject(data.err);
      }
      console.log(`Wrote ${config['DATA_FILE']}`);
      resolve(pioneerMeta);
    });
  });
}

function writePioneerCustom(pioneermeta, allcards) {
  const config = configs.pioneercustom;
  var pioneer = {data: {}};
  Object.keys(pioneermeta.data).forEach(set => {
    pioneer.data[set] = allcards.data[set];
  });
  let saveJson = JSON.stringify(pioneer);
  return fs.writeFile(config['DATA_FILE'], saveJson)
    .then(data => {
      if (data && data.err) {
        reject(data.err);
      }
      return pioneer;
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
        writePioneerMeta(sets,cards)
        .then(pMeta => {
          console.log('Done writing pioneer meta');
          let mIs = !!pMeta ? "Meta in" : "Meta missing";
          let cIs = !!cards ? "Cards in" : "Cards missing";
          console.log(`${mIs} - ${cIs}`);
          writePioneerCustom(pMeta,cards);
          console.log('Done writing pioneer custom');
        })
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
  console.log('With added: standard | pioneer');
}
