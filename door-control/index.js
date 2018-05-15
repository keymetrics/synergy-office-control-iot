
const Gpio = require('orange-pi-gpio');
let door_relay = new Gpio({pin:29});
const pmx = require('pmx');

// Init door
door_relay.write(0);

function openDoor() {
  door_relay.write(1);
  setTimeout(function() {
    door_relay.write(0);
  }, 3000);
}

pmx.action('open door', function(reply) {
  openDoor();
  reply({success:true});
});
