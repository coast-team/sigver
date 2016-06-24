let appButton = document.getElementById('start-app'),
    startButton = document.getElementById('start-serv'),
    stopButton = document.getElementById('stop-serv')

function launchApp(id) {
  chrome.management.launchApp(id);
}

function launchSigVer() {
  var isInstalled = false,
      id

  chrome.management.getAll(function(info) {
    for (var i = 0 ; i < info.length ; i++) {
      if (info[i].isApp && info[i].name === "SigVer Chrome Application") {
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

// function launchServer() {
//   launchSigVer()

//   chrome.runtime.sendMessage('kejjailklidpodgempkdnjgcdifpmgph', JSON.stringify({hide: true}))
// }

function startServer() {
  launchSigVer()
  chrome.runtime.sendMessage(JSON.stringify({startServer: true}))
}

function stopServer() {
  launchSigVer()
  chrome.runtime.sendMessage(JSON.stringify({stopServer: true}))
}

appButton.addEventListener('click', launchSigVer)
startButton.addEventListener('click', startServer)
stopButton.addEventListener('click', stopServer)