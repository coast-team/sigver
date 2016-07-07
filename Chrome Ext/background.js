/**
 * Function which changes the icon of the extension
 */
function updateIcon(icon) {
  	chrome.browserAction.setIcon({path:"icon" + icon + ".png"})
}

// The extension receives a message from the application and updates its icon
chrome.runtime.onMessageExternal.addListener((message) => {
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

// The extension receives a message from itself
chrome.runtime.onMessage.addListener((message) => {
	let mes,
		port

	try {
		mes = JSON.parse(message)
	} catch(e) {
		console.log('Only JSON accepted')
	}

	if (mes.hasOwnProperty('startServer')) {
		// The extension has to tell the app to start the server
		if (mes.startServer) {
			setTimeout(() => {
				// Open a connection with the application
				port = chrome.runtime.connect('dobclcfmeoocbfnghgjcgamkgdlinjif')
				
				// The extension receives a message on this connection
				port.onMessage.addListener((message2) => {
					let mes2

					try {
						mes2 = JSON.parse(message2)
					} catch(e) {
						console.log('Only JSON accepted')
					}

					if (mes2.hasOwnProperty('received')) {
						// The application has received the message and can make what is expected
						if (mes2.received) {
							port.disconnect()
						}
					} else if (mes2.hasOwnProperty('resend')) {
						// The application has received the message but can't make what is expected
						if (mes2.resend) {
							// Resend the message
							setTimeout(() => {port.postMessage(JSON.stringify({startServer: true}))}, 100)
						} 
					}
				})

				// Sending the first message to start the server
				port.postMessage(JSON.stringify({startServer: true}))
			}, 100)
		}
	} else if (mes.hasOwnProperty('stopServer')) {
		// The extension has to tell the app to stop the server
		if (mes.stopServer) {
			// Open a connection with the application
			port = chrome.runtime.connect('dobclcfmeoocbfnghgjcgamkgdlinjif')
			
			// The extension receives a message on this connection
			port.onMessage.addListener((message2) => {
				let mes2

				try {
					mes2 = JSON.parse(message2)
				} catch(e) {
					console.log('Only JSON accepted')
				}

				if (mes2.hasOwnProperty('received')) {
					// The application has received the message and can make what is expected
					if (mes2.received) {
						port.disconnect()
					}
				} else if (mes2.hasOwnProperty('resend')) {
					// The application has received the message but can't make what is expected
					if (mes2.resend) {
						// Resend the message
						setTimeout(() => {port.postMessage(JSON.stringify({stopServer: true}))}, 100)
					} 
				}
			})

			// Sending the first message to stop the server
			port.postMessage(JSON.stringify({stopServer: true}))
		}
	} else if (mes.hasOwnProperty('closeApp')) {
		// The extension has to tell the app to close (will close the window, background scripts will be killed a few seconds later)
		if (mes.closeApp) {
			// Open a connection with the application
			port = chrome.runtime.connect('dobclcfmeoocbfnghgjcgamkgdlinjif')
			
			// The extension receives a message on this connection
			port.onMessage.addListener((message2) => {
				let mes2

				try {
					mes2 = JSON.parse(message2)
				} catch(e) {
					console.log('Only JSON accepted')
				}

				if (mes2.hasOwnProperty('received')) {
					// The application has received the message and can make what is expected
					if (mes2.received) {
						port.disconnect()
					}
				} else if (mes2.hasOwnProperty('resend')) {
					// The application has received the message but can't make what is expected
					if (mes2.resend) {
						// Resend the message
						setTimeout(() => {port.postMessage(JSON.stringify({closeApp: true}))}, 100)
					} 
				}
			})

			// Sending the first message to close the application
			port.postMessage(JSON.stringify({closeApp: true}))
		}
	}
})