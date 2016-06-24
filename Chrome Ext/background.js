let appIsRunning = false

function updateIcon(current) {
  	chrome.browserAction.setIcon({path:"icon" + current + ".png"});
}

chrome.runtime.onMessageExternal.addListener(function(message) {
	let mes

	try {
		mes = JSON.parse(message)
	} catch(e) {
		console.log('Only JSON accepted')
	}

	if (mes.hasOwnProperty('serverRunning')) {
		if (mes.serverRunning) {
			updateIcon('_On')
		} else {
			updateIcon('_Off')
		}
	}
})

chrome.runtime.onMessage.addListener(function(message) {
	let mes,
		port

	try {
		mes = JSON.parse(message)
	} catch(e) {
		console.log('Only JSON accepted')
	}

	if (mes.hasOwnProperty('startServer')) {
		if (mes.startServer) {
			port = chrome.runtime.connect('kejjailklidpodgempkdnjgcdifpmgph')
			
			port.onMessage.addListener((message2) => {
				let mes2

				try {
					mes2 = JSON.parse(message2)
				} catch(e) {
					console.log('Only JSON accepted')
				}

				if (mes2.hasOwnProperty('received')) {
					if (mes2.received) {
						port.disconnect()
					}
				} else if (mes2.hasOwnProperty('resend')) {
					if (mes2.resend) {
						function postMessageStart() {
							port.postMessage(JSON.stringify({startServer: true}))
						}

						setTimeout(postMessageStart, 100)
					} 
				}
			})

			port.postMessage(JSON.stringify({startServer: true}))
		}
	} else if (mes.hasOwnProperty('stopServer')) {
		if (mes.stopServer) {
			port = chrome.runtime.connect('kejjailklidpodgempkdnjgcdifpmgph')
			
			port.onMessage.addListener((message2) => {
				let mes2

				try {
					mes2 = JSON.parse(message2)
				} catch(e) {
					console.log('Only JSON accepted')
				}

				if (mes2.hasOwnProperty('received')) {
					if (mes2.received) {
						port.disconnect()
					}
				} else if (mes2.hasOwnProperty('resend')) {
					if (mes2.resend) {
						function postMessageStop() {
							port.postMessage(JSON.stringify({stopServer: true}))
						}

						setTimeout(postMessageStop, 100)
					} 
				}
			})

			port.postMessage(JSON.stringify({stopServer: true}))
		}
	}
})