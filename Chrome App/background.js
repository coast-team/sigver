var sigVerBG
if (!id) {
	var id = id = "SigVer_App_Window_1"	
}

chrome.runtime.onConnectExternal.addListener(function(port) {
	port.onMessage.addListener((message) => {
		let mes,
			sigVerWindow,
			response

		try {
			mes = JSON.parse(message)
		} catch(e) {
			console.log('Only JSON accepted')
		}

		try {
			sigVerWindow = chrome.app.window.get(id)
			console.log('The sigVerWindow is initialized')
		} catch(e) {
			console.log("Can't get the sigVerWindow, will retry on demand")
		}

		if (mes.hasOwnProperty('startServer')) {
			if (mes.startServer) {
				try {
					if (!sigVerBG.isRunning) {
						sigVerBG.start(8000)
						sigVerWindow.contentWindow.updateSwitch()
					}
					sigVerWindow.hide()
					port.postMessage(JSON.stringify({received: true}))
					port.disconnect()
				} catch(e) {
					port.postMessage(JSON.stringify({resend: true}))
				}
			}
		} else if (mes.hasOwnProperty('stopServer')) {
			if (mes.stopServer) {
				try {
					if (sigVerBG.isRunning) {
						sigVerBG.stop(8000)
						sigVerWindow.contentWindow.updateSwitch()
						sigVerWindow.contentWindow.init()
					}
					sigVerWindow.hide()
					port.postMessage(JSON.stringify({received: true}))
					port.disconnect()
				} catch(e) {
					port.postMessage(JSON.stringify({resend: true}))
				}
			}
		}
	})
})

chrome.app.runtime.onLaunched.addListener(function() {
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
	}, function() {
		// When the window is created, create a new instance of sigver
		sigVerBG = new SigVer()

		if (sigVerBG.isRunning) {
			chrome.runtime.sendMessage('ojejgneppnladelhcnndbhigjjdjmkhg', JSON.stringify({serverRunning: true}))
		} else {
			chrome.runtime.sendMessage('ojejgneppnladelhcnndbhigjjdjmkhg', JSON.stringify({serverRunning: false}))
		}

		var sigVerWindow = chrome.app.window.get(id)

		sigVerWindow.onClosed.addListener(function() {
			sigVerBG.stop()
		})
	})
})
