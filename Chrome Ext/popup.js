let launchAppButton = document.getElementById('launch-app'),
    startServerButton = document.getElementById('start-serv'),
    stopServerButton = document.getElementById('stop-serv'),
    closeAppButton = document.getElementById('close-app')



/**
 * Launch the app with the given ID
 * @param {string} id ID of the app to launch
 */
function launchApp(id) {
  chrome.management.launchApp(id)
}

/**
 * Launch the SigVer app if installed
 */
function launchSigVer() {
  var isInstalled = false,
      id

  chrome.management.getAll((info) => {
    for (var i = 0 ; i < info.length ; i++) {
      if (info[i].isApp && info[i].name === "SigVer Manager") {
        isInstalled = true
        id = info[i].id
      }
    }

    if (isInstalled) {
      launchApp(id)
    } else {
      alert('SigVer is not installed')
    }
  })
}

/**
 * Launch the SigVer app and send a message to itself to start the server (handled in background.js)
 */
function startServer() {
  launchSigVer()
  chrome.runtime.sendMessage(JSON.stringify({startServer: true}))
}

/**
 * Launch the SigVer app and send a message to itself to stop the server (handled in background.js)
 */
function stopServer() {
  launchSigVer()
  chrome.runtime.sendMessage(JSON.stringify({stopServer: true}))
}

function closeSigVer() {
  chrome.runtime.sendMessage(JSON.stringify({closeApp: true}))
}

// Add listeners for the different buttons of the pop-up window
launchAppButton.addEventListener('click', launchSigVer)
startServerButton.addEventListener('click', startServer)
stopServerButton.addEventListener('click', stopServer)
closeAppButton.addEventListener('click', closeSigVer)
