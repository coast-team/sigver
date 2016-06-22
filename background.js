var sigVerBG
var id = "SigVer_App_Window_1"

chrome.app.runtime.onLaunched.addListener(function() {
	let allWindows = chrome.app.window.getAll()

	// Control if the app is already running
	// If it is, show the corresponding window
	for (let i = 0 ; i < allWindows.length ; i++) {
		if (allWindows[i].id === "SigVer_App_Window_1") {
			allWindows[i].show()
			allWindows[i].setMinimumSize(
				{
					minWidth: 470,
					minHeight: 685
				}
			)
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

		var sigVerWindow = chrome.app.window.get(id)

		sigVerWindow.onClosed.addListener(function() {
			sigVerBG.stop()
		})

		// Under development
		// The following code is used to hold messages coming from the Netflux API
		chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
			let response = {}
			if (mes.hasOwnProperty('startServer')) {
				if (mes.startServer) {
					if (!sigVerBG.isRunning) {
						sigVerWindow.contentWindow.startAndStopServer()
					}
					response.address = sigVerWindow.contentWindow.getFirstAddress()
					sendResponse(response)
				}
			} else if (mes.hasOwnProperty('stopServer')) {
				if (mes.stopServer) {
					if (sigVerBG.isRunning) {
						sigVerWindow.contentWindow.startAndStopServer()
					}
				}
			}
		})
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