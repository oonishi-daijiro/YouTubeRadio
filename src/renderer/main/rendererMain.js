let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
document.getElementById('pause').className = 'fas fa-play'
const ipcRenderer = window.api.ipcRenderer
let player; //youtube iframe api instance will be here
let playingStat = {
  moved: false,
  listIndex: 0,
  invalidReported: false
}
let videoIdList = []

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '300',
    width: '288',
    events: {
      'onReady': YTonPlayerReady,
      'onStateChange': YTonStateChange,
      'onError': YTonPlayerError
    }
  });
}

ipcRenderer.on('replyUrlList', (event, args) => {
  if (!args.list.length) {
    return
  }
  videoIdList = args.list
  ipcRenderer.send('setParsedIdlist', videoIdList)
  player.loadPlaylist(videoIdList)
  window.alert(";;")
  player.seekTo(48)
  player.playVideo()
  player.setLoop(true)
})


function YTonPlayerError(event) {
  if (event.data === 150) {
    window.api.ipcRenderer.send('playingError', {
      data: event.data,
      videoUrl: player.getVideoUrl()
    })
  }
}

function YTonPlayerReady(event) {
  ipcRenderer.send('getUrlSettings', '') // get list of id from json
  player.setVolume(50)
}

function YTonStateChange(event) {}

let soundBars = []
const bars = document.getElementsByClassName('bars')
Array.from(bars).forEach((e) => {
  soundBars[soundBars.length] = e
})

const getUrl = document.getElementById('getUrl')
getUrl.addEventListener('click', () => {
  ipcRenderer.send('newWindow', '')
})

let pause = document.getElementById('pause')

pause.addEventListener('click', () => {
  if (!videoIdList.length) {
    return
  }
  pause.className === "fas fa-pause" ? (() => {
    player.pauseVideo()
    pause.className = "fas fa-play"
    soundBars.forEach(element => {
      element.style.animationPlayState = 'paused'
    });
  })() : (() => {
    player.playVideo()
    pause.className = "fas fa-pause"
    soundBars.forEach(element => {
      element.style.animationPlayState = 'running'
    });
  })()
}, false)

const back_10sec = document.getElementById('back_10sec')

back_10sec.addEventListener('click', () => {
  if (!videoIdList.length || playingStat.moved) {
    return
  } else {
    player.previousVideo()
  }
})

const nextVideo = document.getElementById('nextVideo')

nextVideo.addEventListener('click', () => {
  if (!videoIdList.length || playingStat.moved) {
    return
  } else {
    player.nextVideo()
  }
}, false)

let volume = document.getElementById('volume')

volume.addEventListener('click', () => {
  volume.style.display = 'none'
  canvas.style.display = 'block'
  let volume_num = 50 - player.getVolume() / 2
  field.fillStyle = '#444444';
  field.fillRect(0, volume_num, canvas.width, canvas.height);
}, false)

let canvas = document.getElementById('canvas')
const field = canvas.getContext('2d')

canvas.addEventListener('mousemove', (event) => {
  if (event.which === 1) {
    let y = event.offsetY
    field.fillStyle = '#444444';
    field.clearRect(0, 0, canvas.width, y + 50);
    field.fillRect(0, y, canvas.width, canvas.height);
    player.setVolume(100 - y * 2)
    y >= 50 ? (() => {
      volume.className = 'fas fa-volume-mute'
    })() : (() => {
      volume.className = 'fas fa-volume-up'
    })()
    canvas.addEventListener('mouseup', () => {
      setTimeout(() => {
        canvas.style.display = 'none'
        volume.style.display = 'block'
      }, 500);
    }, false)
    canvas.addEventListener('mouseout', () => {
      setTimeout(() => {
        canvas.style.display = 'none'
        volume.style.display = 'block'
      }, 500);
    }, false)
  }
}, false);

canvas.addEventListener('click', (event) => {
  if (event.which === 1) {
    let y = event.offsetY
    field.fillStyle = '#444444';
    field.clearRect(0, 0, canvas.width, y + 50);
    field.fillRect(0, y, canvas.width, canvas.height);
    player.setVolume(100 - y * 2)
    y >= 50 ? (() => {
      volume.className = 'fas fa-volume-mute'
    })() : (() => {
      volume.className = 'fas fa-volume-up'
    })()
    canvas.addEventListener('mouseup', () => {
      setTimeout(() => {
        canvas.style.display = 'none'
        volume.style.display = 'block'
      }, 500);
      canvas.addEventListener('mouseout', () => {
        setTimeout(() => {
          canvas.style.display = 'none'
          volume.style.display = 'block'
        }, 500);
      }, false)
    }, false)
  }
}, false);

// renderer event process

ipcRenderer.on('pause', (e) => {
  pause.className = "fas fa-play"
  soundBars.forEach(element => {
    element.style.animationPlayState = "paused"
  });
})

ipcRenderer.on('playing', (e) => {
  pause.className = "fas fa-pause"
  soundBars.forEach(element => {
    element.style.animationPlayState = 'running'
  });
})

const close = document.getElementById('close_button')

close.addEventListener('click', () => {
  ipcRenderer.send('close', 'close')
}, false)

const minimize = document.getElementById('minimize')

minimize.addEventListener('click', () => {
  ipcRenderer.send('minimize', 'minimize')
}, false)

ipcRenderer.on('messageShowed', (event, args) => {
  playingStat.moved = true
  const playingIndex = player.getPlaylistIndex()
  videoIdList.splice(playingIndex, 1)
  ipcRenderer.send('setParsedIdlist', videoIdList)
  setTimeout(() => {
    player.loadPlaylist(videoIdList)
    player.playVideoAt(playingIndex)
    player.setLoop(true)
    playingStat.moved = false
  }, 6000);
})

ipcRenderer.on('urlList', (event, args) => {
  playingStat.listIndex = player.getPlaylistIndex()
  const nowId = videoIdList[playingStat.listIndex]
  videoIdList = []
  let currentTime = player.getCurrentTime()
  for (const prop in args) {
    videoIdList[videoIdList.length] = args[prop]
  }
  videoIdList.forEach((element, index) => {
    if (!(element.length === 11)) {
      videoIdList.splice(index, 1)
    }
  })
  if (videoIdList.length === 0) {
    return
  }
  if (!(nowId === videoIdList[playingStat.listIndex])) {
    currentTime = 0
  }
  if (playingStat.listIndex > videoIdList.length - 1) {
    playingStat.listIndex = videoIdList.length - 1
  }
  soundBars.forEach(element => {
    element.style.animationPlayState = 'running'
  });
  if (videoIdList.length === 1) {
    player.loadPlaylist({
      listType: "playlist",
      playlist: videoIdList,
      index: playingStat.listIndex,
      startSeconds: currentTime
    })
    player.playVideo()
    player.setLoop(true)
    return
  }
  ipcRenderer.send('setParsedIdlist', videoIdList)
  player.loadPlaylist({
    listType: "playlist",
    playlist: videoIdList,
    index: playingStat.listIndex,
    startSeconds: currentTime
  })
  player.playVideo()
  player.setLoop(true)
})
