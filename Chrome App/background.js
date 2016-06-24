var sigVerBG
if (!id) {
	var id = id = "SigVer_App_Window_1"	
}

// var windowCreated = new CustomEvent(
// 	"windowCreated", 
// 	{
// 		detail: {},
// 		bubbles: false,
// 		cancelable: true
// 	}
// );


// chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
// 	// let mes,
// 	// 	response = {}
	
// 	// try {
// 	// 	mes = JSON.parse(message)
// 	// } catch(e) {
// 	// 	console.log('Only JSON accepted')
// 	// }

// 	// console.log(mes)

// 	// if (mes.hasOwnProperty('startServer')) {
// 	// 	if (mes.startServer) {
// 	// 		if (!sigVerBG.isRunning) {
// 	// 			sigVerWindow.contentWindow.startAndStopServer()
// 	// 		}
// 	// 		response.address = sigVerWindow.contentWindow.getFirstAddress()
// 	// 		sendResponse(response)
// 	// 	}
// 	// } else if (mes.hasOwnProperty('stopServer')) {
// 	// 	if (mes.stopServer) {
// 	// 		if (sigVerBG.isRunning) {
// 	// 			sigVerWindow.contentWindow.startAndStopServer()
// 	// 		}
// 	// 	}
// 	// } else if (mes.hasOwnProperty('hide')) {
// 	// 	if (mes.hide) {
// 	// 			setTimeout(chrome.app.window.get("SigVer_App_Window_1").hide, 100)
// 	// 	}
// 	// }
	
// 	// var sigVerWindow = chrome.app.window.get(id)
// 	// sigVerWindow.contentWindow.document.getElementsByTagName('html')[0].addEventListener('windowCreated', () => {
// 	chrome.runtime.onMessage.addListener(function(mes, sen, sResp) {
// 		try {
// 			mes = JSON.parse(mes)
// 		} catch(e) {
// 			console.log('Only JSON accepted')
// 		}

// 		if (mes.hasOwnProperty('windowCreated')) {
// 			chrome.runtime.sendMessage('kejjailklidpodgempkdnjgcdifpmgph', message)
// 		}
// 	})
		
// 	// })
// })

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
			// allWindows[i].setMinimumSize(
			// 	{
			// 		minWidth: 470,
			// 		minHeight: 685
			// 	}
			// )
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
		// chrome.runtime.sendMessage(JSON.stringify({windowCreated: true}))

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

		// // Under development
		// // The following code is used to hold messages coming from the Netflux API and the SigVer Chrome extension
		// chrome.runtime.onMessageExternal.addListener(function(message, sender, sendResponse) {
		// 	let mes,
		// 		response = {}
			
		// 	try {
		// 		mes = JSON.parse(message)
		// 	} catch(e) {
		// 		console.log('Only JSON accepted')
		// 	}

		// 	console.log(mes)

		// 	if (mes.hasOwnProperty('startServer')) {
		// 		if (mes.startServer) {
		// 			if (!sigVerBG.isRunning) {
		// 				sigVerWindow.contentWindow.startAndStopServer()
		// 			}
		// 			response.address = sigVerWindow.contentWindow.getFirstAddress()
		// 			sendResponse(response)
		// 		}
		// 	} else if (mes.hasOwnProperty('stopServer')) {
		// 		if (mes.stopServer) {
		// 			if (sigVerBG.isRunning) {
		// 				sigVerWindow.contentWindow.startAndStopServer()
		// 			}
		// 		}
		// 	} 
		// 	// else if (mes.hasOwnProperty('hide')) {
		// 	// 	if (mes.hide) {
		// 	// 		sigVerBG.start(8000)
		// 	// 		sigVerWindow.contentWindow.updateSwitch()
		// 	// 		setTimeout(sigVerWindow.hide, 50)
		// 	// 	}
		// 	// }
		// })

		// chrome.runtime.onMessage.addListener(function(message) {
		// 	let mes
			
		// 	console.log('catch')

		// 	try {
		// 		mes = JSON.parse(message)
		// 	} catch(e) {
		// 		console.log('Only JSON accepted')
		// 	}

		// 	if (mes.hasOwnProperty('hide')) {
		// 		if (mes.hide) {
		// 			sigVerBG.start(8000)
		// 			sigVerWindow.contentWindow.updateSwitch()
		// 			setTimeout(sigVerWindow.hide, 50)
		// 		}
		// 	}
		// })
	})
})

// }, (win) => {
	// // When we close the application, save sigVer
	// chrome.app.window.onClosed.addListener(function() {
	// 	sigVer = chrome.app.window.current().contentWindow.sigVer
	// })

	// // If sigVer exists, set it on the new window
	// win.contentWindow.sigVer = sigVer
// }, function() {
// 	let win = chrome.app.window.getAll()[0]
// 	win.onClosed.addListener(function() {
// 		win.sigVer.stop()
// 	})

// chrome.runtime.onMessage.addListener(function(message) {
// 	message = JSON.parse(message)

// 	if (message.hasOwnProperty('server')) {
// 		if (message.server) {
// 			
// 		}
// 	}
// })

// }, (win) => {
// 	// if (count != 1) {
// 	// 	let firstWindow = chrome.app.window.get('1')
// 	// 	win.sigVer = firstWindow.contentWindow.sigVer
// 	// }

// 	let firstWindow = chrome.app.window.get('1')
// 	// let thisWindow = chrome.app.window.get(''+count)

// 	win.sigVer = firstWindow.contentWindow.sigVer
// let win2 = chrome.app.window.get('kejjailklidpodgempkdnjgcdifpmgph')

// if() {
// 	console.log(win2.sigVer)
// 	appWindow = win2
// } else {
// 	appWindow =
// }

// chrome.app.runtime.onRestarted.addListener(function(win) {
// 	chrome.storage.local.clear()
// 	chrome.app.window.create('index.html', {
// 		id: ""+count,
//     	innerBounds: {
//       		width: 470,
//       		height: 675,
//       		minWidth: 470,
//      	 	minHeight: 675,
//     	}
	// }, (win) => {
	// 	// if (count != 1) {
	// 	// 	let firstWindow = chrome.app.window.get('1')
	// 	// 	win.sigVer = firstWindow.contentWindow.sigVer
	// 	// }

	// 	let firstWindow = chrome.app.window.get('1')
	// 	// let thisWindow = chrome.app.window.get(''+count)

	// 	win.sigVer = firstWindow.contentWindow.sigVer
// 	})

// 	count++

// 	win = appWindow
// })

// chrome.app.window.onClosed.addListener(function() {
//   alert(sigVer)
//   sigVer.stop()
// })

// chrome.runtime.onMessage.addListener(function(message) {
// 	log('message recu')
// 	console.log(message)
// })

// chrome.runtime.onMessageExternal.addListener(function(mes) {
// 	console.log(mes)
// })