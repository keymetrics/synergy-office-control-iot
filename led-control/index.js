const express = require('express')
const bodyParser = require('body-parser');
const leds = require('rpi-ws281x-native')
const nbLeds = require('./config/config.js').ledCount
const schedule = require('node-schedule');
const Keymetrics = require('kmjs-core')
const Measured = require('measured')
const pmx = require('pmx')
const Voice = require('./voice.js');
var exec = require('child_process').exec;

//////////////////////////
// Leds control methods //
//////////////////////////

function getColorInt(hex) {
  return parseInt(`0x${hex}`)
}

function colorAllLeds(color) {
  let ledsArr = []
  for (let i = 0; i < nbLeds; i++) {
	  ledsArr[i] = color
  }
  return ledsArr;
}

function rgb2Int(r, g, b) {
  return ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff)
}

// Led mapping
// +------- 1187, 1650 -----------+---0,152------+
// |              |               |              |
// 970, 1187 (217)|               |           153, 354 (201)
// |              |               |              |
// +--------------+-- 354, 970 ---+--------------+
//
// 0, 152 = first third
class LedStrip {
  constructor() {
    this.ledsData = new Uint32Array(nbLeds)
    this.currentEffectRunning = null

    this.snakeEffectColor = '33FFFF';

    leds.init(nbLeds, {
      dmaNum: 10 //because read-only for RPi3 bug
    })

    process.on('SIGINT', function () {
      leds.reset()
      setTimeout(function() { process.exit(0) });
    })

    var self = this;

    this.snakeEffect(this.snakeEffectColor, 3);
    this.api();
    this.keymetricsIntegration();
    this.exposeActions();
  }

  keymetricsIntegration() {
    var self = this;
    let km = new Keymetrics()
    var meter = new Measured.Meter();

    km.use('standalone', {
      refresh_token: process.env.KM_CORE
    })

    km.bucket.retrieveAll()
      .then((res) => {
        // find our bucket
        let bucket = res.data.find(bucket => bucket.name === 'Keymetrics')
        km.realtime.subscribe(bucket._id).catch(console.error);

        km.realtime.on(`${bucket.public_id}:*:human:event`, function(events) {
          events.forEach(function(event) {
            if (event.name == 'new:real:customer' || event.name == 'new:real:update:subscription') {
              self.setEffect('NewCustomer', 4);
              console.log(new Date(), 'NEW CUSTOMER');
            }

            if (event.name == 'bucket:feedback') {
              self.setEffect('Churn', 4);
              console.log(new Date(), 'NEW CUSTOMER');
            }
          });
        })

        var i = 0;

        setInterval(function() {
          var stats = meter.toJSON();

          if (stats.currentRate > 0.1)
            self.setEffect('Error', 10);
        }, 10000);
      })
  }

  exposeActions() {
    var self = this;

    pmx.action('newcustomer', function(reply) {
      Voice('Congratulation, new customer from Paypal enteprise.', function() {
        self.setEffect('NewCustomer', 3);
      });
      reply({success:true});
    });

    pmx.action('lostcustomer', function(reply) {
      Voice('Customer has been lost...', function() {
        self.setEffect('Churn', 4);
      });
      reply({success:true});
    });

    pmx.action('lightAmbience', function(reply) {
      self.clear();
      self.lightAmbientOne();
      setInterval(function() {
        self.lightAmbientOne(function() {});
      }, 6000);
      reply({success:true});
    });

    pmx.action('tech:error', function(reply) {
      Voice('Keymetrics Error Rate is too high...', function() {
        self.setEffect('Error', 4);
      });
      reply({success:true});
    });

    pmx.action('marseillaise', function(reply) {
      exec('mpg123 material/marseillaise.mp3');
      self.setEffect('France', 4);
      reply({success:true});
    });

    pmx.action('speak', function(text, reply) {
      Voice(text, function() {
      });
      reply({success:true});
    });

    pmx.action('speak:fr', (text, reply) => {
      Voice(text, 'fr-FR', () => {})
      reply({success: true})
    });
    pmx.action('speak:pt', function(text, reply) {
      Voice(text, 'pt-BR', function() {
      });
      reply({success:true});
    });

    pmx.action('speak:in', function(text, reply) {
      Voice(text, 'hi-IN', function() {
      });
      reply({success:true});
    });

    pmx.action('speak:it', function(text, reply) {
      Voice(text, 'it-IT', function() {
      });
      reply({success:true});
    });
    pmx.action('speak:zh', (text, reply) => {
      Voice(text, 'zh', () => {})
      reply({success: true})
    })
  }

  clear() {
    clearInterval(this.snakeTimer);
    this.ledsData.fill(getColorInt('000000'));
    leds.render(this.ledsData);
  }

  setEffect(mode, iterations, done) {
    var self = this;

    this.clear();

    var _it = 0;

    (function exec(_it) {
      _it++;

      if (_it > iterations) {
        self.clear()
        return self.snakeEffect(self.snakeEffectColor, 3)
      }

      self['effect' + mode](function() {
        exec(_it);
      });
    })(_it)
  }

  snakeEffect(color, speed) {
    var i = 0;
    var self = this;

    leds.setBrightness(10);

    this.snakeTimer = setInterval(function() {
	    for (var j = 0; j < speed; j++) {
	      self.ledsData[i + j] = getColorInt(color)
	    }
	    i += speed;
	    leds.render(self.ledsData);

	    if (i >= nbLeds) {
	      clearInterval(self.snakeTimer);
	      if (color == '000000')
		      color = self.snakeEffectColor
	      else
		      color = '000000'
	      self.snakeEffect(color, speed)
	    }
    }, 60)
  }


  schedule() {
    // Standup start
    schedule.scheduleJob('15 10 * * *', function(){
      zoneColor('FF0000', '00FF00', '0000FF', 20);

      setTimeout(function() {
	      zoneColor('FF0000', '00FF00', '0000FF', 20);
      }, 1500);
    });

    // End of standup
    schedule.scheduleJob('35 10 * * *', function(){
      leds.reset()
    });

    // France time
    schedule.scheduleJob('30 11 * * *', function(){
      zoneColor('0000FF', 'FFFFFF', 'FF0000', 20);
      setTimeout(function() {
	      leds.reset();
      }, 1000 * 30);
    });

    // Food time
    schedule.scheduleJob('30 12 * * *', function(){
      zoneColor('00FF00');

      setTimeout(function() {
	      leds.reset();
      }, 2 * 1000 * 60);
    });

    // Rush
    schedule.scheduleJob('00 15 * * *', function(){
      zoneColor('FF0000');

      setTimeout(function() {
	      leds.reset();
      }, 1000 * 10);
    });
  }

  lightAmbientOne(cb) {
    var self = this;
    var START = 10;
    var END = 15;
    var STEP = 1;
    var i =  START;
    var color = '33FFFF';

    this.zoneColor(color, color, color, START);

    var t = setInterval(function() {
	    leds.setBrightness(i += STEP);
	    if (i > END) {
	      clearInterval(t);
	      var t2 = setInterval(function() {
		      leds.setBrightness(i -= STEP);
		      if (i < START) {
		        clearInterval(t2);
            return cb ? cb() : false;
          }
	      }, 50);
	    }
    }, 50);
  }

  effectError(cb) {
    var self = this;

    var color = 'FF0000';

    this.zoneColor('222222', '222222', color, 100);

    setTimeout(function() {
      self.clear();
      setTimeout(function() {
        cb();
      }, 200);
    }, 400);
  }

  effectChurn(cb) {
    var self = this;

    var color = 'FF0000';

    this.zoneColor('222222', 'FF0000', '222222', 100);

    setTimeout(function() {
      self.clear();
      setTimeout(function() {
        cb();
      }, 200);
    }, 400);
  }

  effectFrance(cb) {
    this.zoneColor('0000FF', 'FFFFFF', 'FF0000', 250);

    setTimeout(() => {
      this.clear();
      cb()
    }, 10000);
  }

  effectNewCustomer(cb) {
    var self = this;
    var i = 0;
    var color = '00FF00';

    this.zoneColor(color, color, color, 1);

    var t = setInterval(function() {
	    leds.setBrightness(i += 4);
	    if (i > 100) {
	      clearInterval(t);
	      var t2 = setInterval(function() {
		      leds.setBrightness(i -= 4);
		      if (i < 10) {
		        clearInterval(t2);
            cb()
          }
	      }, 10);
	    }
    }, 10);
  }

  zoneColor(zone1, zone2, zone3, brightness) {
    var arr = [];

    if (!zone2) {
	    zone2 = zone1;
	    zone3 = zone1;
    }

    if (!brightness)
	    brightness = 250;

    var b = 510
    var r = 770
    var w = 1375
    for (var i = 0; i < b; i++) {
	    arr.push(getColorInt(zone1));
    }

    for (var i = b; i < r; i++) {
	    arr.push(getColorInt(zone2));
    }

    for (var i = r; i < w;i++) {
	    arr.push(getColorInt(zone3));
    }

    for (var i = w; i < 1650; i++) {
	    arr.push(getColorInt(zone2));
    }

    leds.setBrightness(brightness);
    leds.render(arr);
  }

  api() {
    const app = express()
    let currentMode = null

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    app.post('/color/:color', (req, res) => {
	    let color = getColorInt(req.params.color)
	    if (isNaN(color) || color < 0 || color > 16777215) {
	      return res.status(400).json({
		      msg: 'Invalid color',
		      info: 'Must be between 000000 and FFFFFF'
	      })
	    }
	    setAllLedsColor(color)
	    leds.render(ledsData)
	    return res.json({ success: true })
    })

    // Launch a mode by name
    app.post('/mode', (req, res) => {
	    if(currentMode) currentMode.clearAll()
	    let mode = req.body.mode
	    let params = req.body.params || {}
	    console.log(params)
	    if (!modes.hasOwnProperty(mode)) return res.status(404).json({msg: 'Mode not found'})
	    currentMode = new modes[mode](params)
	    res.json({success: true})
    })


    app.post('/tick/:color', (req, res) => {
	    let color = getColorInt(req.params.color)
	    if (isNaN(color) || color < 0 || color > 16777215) {
	      return res.status(400).json({
		      msg: 'Invalid color',
		      info: 'Must be between 000000 and FFFFFF'
	      })
	    }
	    setAllLedsColor(color)
	    leds.render(ledsData)
	    setTimeout(() => {
	      setAllLedsColor(0)
	      leds.render(ledsData)
	    }, 16)
	    return res.json({ success: true })
    })

    app.post('/led/:number/:color', (req, res) => {
	    let color = getColorInt(req.params.color)
	    if (isNaN(color) || color < 0 || color > 16777215) {
	      return res.status(400).json({
		      msg: 'Invalid color',
		      info: 'Must be between 000000 and FFFFFF'
	      })
	    }
	    let led = parseInt(req.params.number)
	    if (led > nbLeds) {
	      return res.status(400).json({
		      msg: 'Invalid led',
		      info: 'Must be between 0 and ' + nbLeds
	      })
	    }
	    ledsData[led] = color
	    leds.render(ledsData)
	    res.json({ success: true })
    })

    app.post('/follow', (req, res) => {
	    let speed = req.query.speed ? parseFloat(req.query.speed) : 10
	    for (let i = 0; i < nbLeds; i++) {
	      setTimeout(setLed.bind(this, i, 0xffffff), i * speed)
	      setTimeout(setLed.bind(this, i, 0x000000), (i + 4) * speed)
	    }
	    res.json({ success: true })
    })

    app.post('/sequence', (req, res) => {
	    setInterval(() => {
	      let color = getRandomHexColor()
	      setAllLedsColor(color)
	      leds.render(ledsData)
	    }, 1000)
	    return res.json({ success: true })
    })

    var server = app.listen((process.env.NODE_ENV === 'production') ? 80 : 3000, function() {
	    console.log(`LED API listening on port ${server.address().port}`);
    })
  }

  /// EFFECTS


}

new LedStrip();
