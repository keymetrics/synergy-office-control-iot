

return;

// Brute force pin checks

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

for (var j = 0; j < 30; j++) {
  let gpio5 = new Gpio({pin:j});

  gpio5.write(0); // write 1 to pin 5
}


var i = 0
process.stdin.on('keypress', (str, key) => {
  console.log('trying pin', i)
  recur(i);
  i++
  if (key == 'a')
    process.exit(0)
});

function recur(pin) {
  let gpio5 = new Gpio({pin:pin});

  gpio5.write(1); // write 1 to pin 5

}


recur(0);

//gpio5.write(0); // write 0 to pin 5
