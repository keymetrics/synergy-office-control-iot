
let km = new Keymetrics()

km.use('browser', {
  client_id: '3412235273'
})

//alert(km.actions.triggerAction)

window.onerror = function (errorMsg, url, lineNumber) {
  alert('Error: ' + errorMsg + ' Script: ' + url + ' Line: ' + lineNumber);
}

km.actions.triggerAction('5a26ca0ff419704978defc63', {
  server_name: 'door-control',
  process_id: 0,
  action_name: 'open door'
}).then(rep => {
  km.user.retrieve()
	  .then((response) => {
	    km.actions.triggerAction('5a26ca0ff419704978defc63', {
		    server_name: 'common-space',
		    process_id: 1,
		    action_name: 'welcomeUser',
		    opts : response.data.username
	    }).then(rep => {
	    })
	  })

  $('#h2-logo').html('Welcome!');
}).catch(err => {
  alert(err);
});
