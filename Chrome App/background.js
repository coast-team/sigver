var sigVerBG
if (!id) {
	var id = "SigVer_App_Window_1"	
}

// The SigVer Launcher extension connects to the app
chrome.runtime.onConnectExternal.addListener((port) => {
	// The app receives a message on this connection
	port.onMessage.addListener((message) => {
		let mes,
			sigVerWindow

		try {
			mes = JSON.parse(message)
		} catch(e) {
			console.log('Only JSON accepted')
		}

		// If the window already exists (opened or not) then we get it
		try {
			sigVerWindow = chrome.app.window.get(id)
		} catch(e) {
			console.log("Can't get the sigVerWindow, will retry on demand")
		}

		if (mes.hasOwnProperty('startServer')) {
			// The extension is asking to start the server
			if (mes.startServer) {
				try {
					if (!sigVerBG.isRunning) {
						// If the server is not already running, start it and update the window
						sigVerBG.start(8000)
						sigVerWindow.contentWindow.updateSwitch()
					}

					// Hide the window
					sigVerWindow.hide()

					// Notify the extension that the server is started
					port.postMessage(JSON.stringify({received: true}))

					// Leave the connection
					port.disconnect()
				} catch(e) {
					// Notify the extension that something went wrong, and wait for a new message
					port.postMessage(JSON.stringify({resend: true}))
				}
			}
		} else if (mes.hasOwnProperty('stopServer')) {
			// The extension is asking to stop the server
			if (mes.stopServer) {
				try {
					if (sigVerBG.isRunning) {
						// If the server is running, stop it and update the window
						sigVerBG.stop()
						sigVerWindow.contentWindow.updateSwitch()
						sigVerWindow.contentWindow.init()
					}

					// Hide the window
					sigVerWindow.hide()

					// Notify the extension that the server is stopped
					port.postMessage(JSON.stringify({received: true}))

					// Leave the connection
					port.disconnect()
				} catch(e) {
					// Notify the extension that something went wrong, and wait for a new message
					port.postMessage(JSON.stringify({resend: true}))
				}
			}
		} else if (mes.hasOwnProperty('closeApp')) {
			// The extension is asking to close the app
			if (mes.closeApp) {
				try {
					// Close the window
					sigVerWindow.close()

					// Notify the extension that the server is stopped
					port.postMessage(JSON.stringify({received: true}))

					// Leave the connection
					port.disconnect()
				} catch(e) {
					// Notify the extension that something went wrong, and wait for a new message
					port.postMessage(JSON.stringify({resend: true}))
				}
			}
		}
	})
})

chrome.app.runtime.onLaunched.addListener(() => {
	let allWindows = chrome.app.window.getAll()

	// Control if the app is already running
	// If it is, show the corresponding window
	for (let i = 0 ; i < allWindows.length ; i++) {
		if (allWindows[i].id === "SigVer_App_Window_1") {
			allWindows[i].show()
			return
		}
	}

	// Else, create a new window
  	chrome.app.window.create('index.html', {
  		id: id,
	    innerBounds: {
		    width: 470,
		    height: 685,
		    minWidth: 470,
		    minHeight: 685
	    }
	}, () => {
		// When the window is created, create a new instance of sigver
		sigVerBG = new SigVer()

		// Send to the extension the state of the server
		if (sigVerBG.isRunning) {
			chrome.runtime.sendMessage('poegkddcofnkjaclakbkmilkncnajglf', JSON.stringify({serverRunning: true}))
		} else {
			chrome.runtime.sendMessage('poegkddcofnkjaclakbkmilkncnajglf', JSON.stringify({serverRunning: false}))
		}

		var sigVerWindow = chrome.app.window.get(id)

		// Stop the server when the app's window is closed
		sigVerWindow.onClosed.addListener(() => {
			sigVerBG.stop()
		})
	})
})
