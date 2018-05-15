var DMX = require('dmx')
var A = DMX.Animation
var dmx = new DMX()
var universe = dmx.addUniverse('demo', 'enttec-usb-dmx-pro', '/dev/ttyUSB0')
var joystick = new (require('joystick'))(0, 2500, 40);

var x = 0
var y = 0


joystick.on('axis', function(data) {
    if (data.number == 3) {
	var val = Math.floor((data.value / 32767 * 60) + 110);
	x = val;
    }
    else if (data.number == 1) {
	var val = Math.floor((data.value / 32767 * 57) + 57);
	y = val;
	
    }    
    else if (data.number == 0) {
	var val = Math.floor((data.value / 32767 * 60) + 110);
	//var val = Math.floor((data.value / 32767 * 127) + 127);
	x = val;
    }

    universe.update({
	0 : x, // rotate y
	1 : y
    })
});

joystick.on('button', function(data) {
    if (data.number == 0 && data.value == 1)
	universe.update({
	    0 : x, // rotate y
	    1 : y,
	    2 : 255,
	    3 : 250,
	    4 : 250,
	    5 : 250,
	    6 : 250,
	    7: 0
	})
    if (data.number == 0 && data.value == 0)
	universe.update({
	    0 : x, // rotate y
	    1 : y,
	    2 : 0,
	    3 : 0,
	    4 : 0,
	    5 : 0
	})
    if (data.number == 3 && data.value == 1) {
	universe.update({
	    0 : 100, // rotate y
	    1 : 0,
	    2 : 0,
	    3 : 0,
	    4 : 0,
	    5 : 0
	})

	var MIN = 35;
	var MAX = 180;
	var anim = new A()
		.add({
		    0 : MIN, // rotate y
		    1: 0 // rotate z
		}, 3000)
		.add({
		    0 : MAX,
		    1 : 0
		}, 300).run(universe);

	
	setInterval(function() {
	    var anim = new A()
		.add({
		    0 : MIN, // rotate y
		    1: 0 // rotate z
		}, 3000)
		.add({
		    0 : MAX,
		    1 : 0
		}, 300).run(universe);
	}, 4000)
	
    }
});
