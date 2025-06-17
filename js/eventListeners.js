window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'w':
      player.jump()
      keys.w.pressed = true
      break
    case 'ArrowUp':
      player.jump()
      keys.arrowUp.pressed = true
      break
    case 'a':
      keys.a.pressed = true
      break
    case 'ArrowRight':
      keys.arrowRight.pressed = true
      player.lastDirection = 'right'
      break
    case 'd':
      keys.d.pressed = true
      break
    case 'ArrowLeft':
      keys.arrowLeft.pressed = true
      player.lastDirection = 'left'
      break
    case 'Enter': 
      player.shoot()
      break
    case ' ': 
      player.dodge()
      break
  }
})

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'a':
      keys.a.pressed = false
      break
    case 'ArrowRight':
      keys.arrowRight.pressed = false
      break
    case 'd':
      keys.d.pressed = false
      break
    case 'ArrowLeft':
      keys.arrowLeft.pressed = false
      break
  }
})

// On return to game's tab, ensure delta time is reset
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastTime = performance.now()
  }
})
