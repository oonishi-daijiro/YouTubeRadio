const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
document.getElementById('pause').className = 'fas fa-play'
const ipcRenderer = window.api.ipcRenderer
let player; //youtube iframe api instance will be here

function onYouTubeIframeAPIReady() { // when youtube iframe api get ready, this function will call
  player = new YT.Player('player', {
    height: '300',
    width: '288',
    events: {
      'onReady': YTonPlayerReady,
      'onStateChange': YTonStateChange,
      'onError': YTonPlayerError
    }
  })
}

function getListOfIDandTitleFromStore(callback) {
  (async () => {
    const idList = await new Promise((resolve, reject) => {
      ipcRenderer.getVideoIDandTitle('')
      ipcRenderer.once('replyUrlList', (event, args) => {
        resolve(args);
      })
    })
    return idList
  })().then((replyData) => {
    callback(replyData)
  })
}

function YTonPlayerReady(event) {
  getListOfIDandTitleFromStore((list) => {
    const idListArray = Array.from(list.IDlist.list)
    if (idListArray.length === 0) return
    applyToIframePlayer({
      playlist: idListArray
    }, {
      volume: 50
    })
  })
}

function pauseVideo() {
  pauseButton.className = "fas fa-play"
  soundBars.forEach(element => {
    element.style.animationPlayState = 'paused'
  });
  player.pauseVideo()
}

function playVideo() {
  pauseButton.className = "fas fa-pause"
  soundBars.forEach(element => {
    element.style.animationPlayState = 'running'
  })
  player.playVideo()
}

function applyToIframePlayer(
  config = {
    listType: "playlist",
    playlist: [],
    index: 0,
    startSeconds: 0
  }, optional = {
    volume: -1
  }) {
  player.loadPlaylist(config)
  player.setLoop(true)
  if (optional.volume > 0) {
    player.setVolume(optional.volume)
  }
}

function storeToConfig(data = []) {
  ipcRenderer.applyIDToConfig(data)
}

function removeInvalidID() {
  let currentIndex = player.getPlaylistIndex()
  this.splice(currentIndex, 1)
}

function YTonPlayerError(event) {
  if (event.data === 150) {
    console.log("error 150")
    ipcRenderer.sendErrorOfPlaying({
      data: event.data,
      videoUrl: player.getVideoUrl(),
      errorBody: "動画の所有者が、埋め込み動画プレーヤーでの再生を許可していないため再生できませんクリックで確認"
    })
    const currentIndex = player.getPlaylistIndex() > player.getPlaylist().length - 1 ?
      0 :
      player.getPlaylistIndex()

    const currentPlaylist = player.getPlaylist()
    removeInvalidID.apply(currentPlaylist)
    applyToIframePlayer({
      playlist: currentPlaylist,
      index: currentIndex
    })
    player.playVideo()
    storeToConfig(currentPlaylist)
  }
}

// ### YouTube Iframe API issue ###
// if apply unplayable video at the current index of player, the player will not work.

ipcRenderer.on('applyNewPlaylist', (event, idList) => {
  const videoIdList = Array.from(idList)
  const currentVideoIDList = player.getPlaylist()
  if (currentVideoIDList === null) { // when the player didn't set the playlist
    applyToIframePlayer({
      playlist: videoIdList
    })
    return
  } else if (videoIdList.length === 0) { // when applyed the playlist that has no value:[]
    applyToIframePlayer()
    return
  }
  let currentIndex = player.getPlaylistIndex()
  const currentID = currentVideoIDList[currentIndex]
  let currentTime = player.getCurrentTime()

  if (currentID !== videoIdList[currentIndex]) {
    currentTime = 0
  }

  soundBars.forEach(element => {
    element.style.animationPlayState = 'running'
  })

  applyToIframePlayer({
    playlist: videoIdList,
    index: currentIndex,
    startSeconds: currentTime
  })
})

function YTonStateChange(event) {}

const soundBars = []
const bars = document.getElementsByClassName('bars')
Array.from(bars).forEach((e) => {
  soundBars.push(e)
})

const getUrl = document.getElementById('getUrl')
getUrl.addEventListener('click', () => {
  ipcRenderer.openMkPlaylistWindow()
})

const pauseButton = document.getElementById('pause')

pauseButton.addEventListener('click', () => {
  if (player.getPlaylist() === null) { // when the player didnt has any playlist
    return
  }
  if (pauseButton.className === "fas fa-pause") {
    pauseVideo();
    ipcRenderer.videoPaused()
  } else {
    playVideo();
    ipcRenderer.videoPlayed()
  }
}, false)

const previousVideo = document.getElementById('previousVideo')

previousVideo.addEventListener('click', () => { //when the player didnt has any playlist
  if (player.getPlaylist() === null) {
    return
  }
  player.previousVideo()
})

const nextVideo = document.getElementById('nextVideo')

nextVideo.addEventListener('click', () => { //when the player didnt has any playlist
  if (player.getPlaylist() === null) {
    return
  }
  player.nextVideo()
}, false)

const volume = document.getElementById('volume')

volume.addEventListener('click', () => {
  volume.style.display = 'none'
  canvas.style.display = 'block'
  let volume_num = 50 - player.getVolume() / 2
  field.fillStyle = '#444444';
  field.fillRect(0, volume_num, canvas.width, canvas.height);
}, false)

const canvas = document.getElementById('canvas')
const field = canvas.getContext('2d')

function setVolumeFromOfsetY(y) {
  field.fillStyle = '#444444';
  field.clearRect(0, 0, canvas.width, y + 50);
  field.fillRect(0, y, canvas.width, canvas.height);
  player.setVolume(100 - y * 2)
  y >= 50 ? (() => {
    volume.className = 'fas fa-volume-mute'
  })() : (() => {
    volume.className = 'fas fa-volume-up'
  })()
}

canvas.addEventListener('click', (event) => {
  if (event.which === 1) {
    setVolumeFromOfsetY(event.offsetY)
  }
}, false);

canvas.addEventListener('mousemove', (event) => {
  if (event.which === 1) {
    setVolumeFromOfsetY(event.offsetY)
  }
}, false);

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



// renderer event process

ipcRenderer.on('pause', (e) => {
  pauseButton.className = "fas fa-play"
  soundBars.forEach(element => {
    element.style.animationPlayState = "paused"
  });
})

ipcRenderer.on('playing', (e) => {
  pauseButton.className = "fas fa-pause"
  soundBars.forEach(element => {
    element.style.animationPlayState = 'running'
  })
})

ipcRenderer.on('playVideo', () => {
  playVideo()
})

ipcRenderer.on('pauseVideo', () => {
  pauseVideo()
})

ipcRenderer.on('previousVideo', () => {
  player.previousVideo()
  ipcRenderer.videoPlayed()
})

ipcRenderer.on('nextVideo', () => {
  player.nextVideo()
  ipcRenderer.videoPlayed()
})

ipcRenderer.on('jumpVideo', (event, index) => {
  player.playVideoAt(index)
  player.seekTo(0)
  ipcRenderer.videoPlayed()
})

const close = document.getElementById('close_button')

close.addEventListener('click', () => {
  ipcRenderer.closeWindow()
}, false)

const minimize = document.getElementById('minimize')

minimize.addEventListener('click', () => {
  ipcRenderer.minimizeWindow()
}, false)
