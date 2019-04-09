var DMX = require('dmx');
var pmx = require('pmx');
var Voice = require('easy-voice');
var lyre_mapping = require('./mappings/lyre.js');

var A = DMX.Animation;

var dmx = new DMX();

var universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/ttyUSB0');

function addressMapping(address, mapping, map_addressage, override) {
  var hash_mapping = mapping['mapping'];
  var addressage = mapping[map_addressage];

  var result_mapping = {};

  hash_mapping.forEach(function(channel_name, index) {
    var channel_nb = address + index;
    result_mapping[channel_nb] = addressage[channel_name] || 0;
    if (override && override[channel_name]) {
      result_mapping[channel_nb] = override[channel_name];
    }
  });

  return result_mapping;
}

function run(address, mapping, map_addressage, override) {
  if (Array.isArray(address)) {
    var result = {};
    address.forEach(function(_address) {
      Object.assign(result, addressMapping(_address, mapping, map_addressage, override))
    })
    return result;
  }

  addressMapping(address, mapping, map_addressage, override);
}

var current_timer = null;

var Lyres = {
  spotMode : function() {
    Voice('Synergy Conference Mode', function() {
      universe.update(run([0, 14], lyre_mapping, 'spot_conf', { dimmer : 50 }));
    });
  },
  reset : function() {
    clearInterval(current_timer);
    universe.update(run([0, 14], lyre_mapping, 'reset', { tilt : 128 }));
  },
  soundMode : function() {
    Voice('Synergy Party mode', function() {
      universe.update(run([0, 14], lyre_mapping, 'sound'));
    });
  },
  publicMode : function() {
    Voice('Synergy Public Light Mode', function() {
      universe.update(run([0, 14], lyre_mapping, 'public_show'));
    });
  },
  strobe : function() {
    universe.update(run([0, 14], lyre_mapping, 'strobe'));
  },
  welcome : function() {
    setTimeout(function() {
      universe.update(run([0, 14], lyre_mapping, 'entrance_show'));
    }, 2000);

    setTimeout(function() {
      Voice('Welcome to Keymetrics!');
    }, 4000);
    setTimeout(function() {
      universe.update(run([0, 14], lyre_mapping, 'reset'));
    }, 8000);
  },
  welcomeUser : function(data) {
    setTimeout(function() {
      universe.update(run([0, 14], lyre_mapping, 'entrance_show'));
    }, 2000);

    let hour = new Date().getHours()
    if (hour < 11 || hour > 17) {
      setTimeout(function() {
        if (data.indexOf(':') !== -1) {
          return Voice(...data.split(':'))
        }
        Voice(data + ' welcome to Keymetrics');
      }, 4000);
    }

    setTimeout(function() {
      universe.update(run([0, 14], lyre_mapping, 'reset'));
    }, 8000);
  },
  alertMode : function() {
    Voice('Synergy Alert Mode');

    var TIME = 1000;

    var anim = new A()
        .add(run([0, 14], lyre_mapping, 'alert_mode_s2'), TIME)
        .delay(1300)
        .add(run([0, 14], lyre_mapping, 'alert_mode_s1'), TIME)
        .delay(1300)
        .add(run([0, 14], lyre_mapping, 'alert_mode_s2'), TIME)


    anim.run(universe);

    current_timer = setInterval(function() {
      var anim = new A()
          .add(run([0, 14], lyre_mapping, 'alert_mode_s2'), TIME)
          .delay(1300)
          .add(run([0, 14], lyre_mapping, 'alert_mode_s1'), TIME)


      anim.run(universe);
    }, TIME * 2 + 2800);
  }
}

// Expose all Lyres method as PM2 server actions
// Object.keys(Lyres).forEach(function(action) {
//   pmx.action(action, function(reply) {
//     if (typeof(data) == 'function') {
//       reply = data;
//       data = ''
//     }
//     Lyres[action](data);
//     reply({ success : true, action_name : action });
//   })
// });

var timeout = 2000
function effect() {
  universe.update(run([0, 14], lyre_mapping, 'step1'));
  setTimeout(() => {
    universe.update(run([0, 14], lyre_mapping, 'step2'));
    setTimeout(() => {
      effect()
    }, timeout)
  }, timeout)
}

effect()

//universe.update(run([0, 14], lyre_mapping, 'sound2'));

//return false;

//Voice('Welcome. Synergy Initialized.');

// var anim = new A()
//     .add(run([0, 14], lyre_mapping, '9991'), 1000)
//     .delay(1300)
//     .add(run([0, 14], lyre_mapping, '9992'), 1000)
//     .delay(1300)
//     .add(run([0, 14], lyre_mapping, '9993'), 1000)

// var anim = new A()
//     .add(run([0, 14], lyre_mapping, 'circle1'), 10000)
//     .delay(13000)
//     .add(run([0, 14], lyre_mapping, 'circle2'), 10000)


// anim.run(universe)
//Lyres.strobe();
// Voice('Hello Cel Del', function() {

// });

//Lyres.reset();
