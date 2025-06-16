const BOSS_X_VELOCITY = -20
const BOSS_JUMP_POWER = 250
const BOSS_GRAVITY = 580

class Boss {
  constructor(
    { x, y, width, height, velocity = { x: BOSS_X_VELOCITY, y: 0 } },
    turningDistance = 100,
  ) {
    console.log('Iniciando construtor do Boss')
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.velocity = velocity
    this.isOnGround = false
    this.isImageLoaded = false
    this.maxHealth = 30
    this.currentHealth = this.maxHealth
    this.isAlive = true
    this.isDying = false
    this.detectionRange = 300 // Distância em pixels para detectar o player
    this.isFollowingPlayer = false
    this.player = null // Referência ao player será definida depois
    this.image = new Image()
    this.image.onload = () => {
      console.log('Boss image loaded successfully')
      this.isImageLoaded = true
    }
    this.image.onerror = (error) => {
      console.error('Error loading Boss image:', error)
    }
    console.log('Tentando carregar imagem do Boss:', './images/boss.png')
    this.image.src = './images/boss.png'
    console.log('Boss initialized at position:', { x, y })
    this.elapsedTime = 0
    this.currentFrame = 0
    this.sprites = {
      idle: {
        x: 0,
        y: 0,
        width: 128,
        height: 128,
        frames: 7,
      },
      walk: {
        x: 9,
        y: 228,
        width: 94,
        height: 98,
        frames: 12,
      },
      attack: {
        x: 0,
        y: 256,
        width: 128,
        height: 128,
        frames: 8,
      },
      hit: {
        x: 0,
        y: 384,
        width: 128,
        height: 128,
        frames: 4,
      },
      death: {
        x: 0,
        y: 512,
        width: 128,
        height: 128,
        frames: 6,
      }
    }
    this.currentSprite = this.sprites.walk
    this.facing = 'right'
    this.hitbox = {
      x: this.x + 20,
      y: this.y + 20,
      width: 110,
      height: 104,
    }
    this.distanceTraveled = 0
    this.turningDistance = turningDistance
    this.isInvincible = false
    this.invincibilityTime = 0
  }

  draw(c) {
    if (!this.isAlive && !this.isDying) return

    // Desenha a barra de vida apenas se estiver vivo
    if (this.isAlive) {
      const barWidth = 100
      const barHeight = 10
      const barX = this.x + (this.width - barWidth) / 2
      const barY = this.y - 20

      // Fundo da barra de vida
      c.fillStyle = 'red'
      c.fillRect(barX, barY, barWidth, barHeight)

      // Vida atual
      c.fillStyle = 'green'
      const currentBarWidth = (this.currentHealth / this.maxHealth) * barWidth
      c.fillRect(barX, barY, currentBarWidth, barHeight)
    }

    // Red square debug code
    c.fillStyle = 'rgba(255, 0, 0, 0.5)'
    c.fillRect(this.x, this.y, this.width, this.height)

    // Hitbox - só desenha se existir
    if (this.hitbox) {
      c.fillStyle = 'rgba(0, 0, 255, 0.5)'
      c.fillRect(
        this.hitbox.x,
        this.hitbox.y,
        this.hitbox.width,
        this.hitbox.height,
      )
    }

    if (this.isImageLoaded === true) {
      let xScale = 1
      let x = this.x

      if (this.facing === 'right') {
        xScale = -1
        x = -this.x - this.width
      }

      c.save()
      c.scale(xScale, 1)
      c.drawImage(
        this.image,
        this.currentSprite.x + this.currentSprite.width * this.currentFrame,
        this.currentSprite.y,
        this.currentSprite.width,
        this.currentSprite.height,
        x,
        this.y,
        this.width,
        this.height,
      )
      c.restore()
    } else {
      console.log('Boss image not loaded yet')
    }
  }

  update(deltaTime, collisionBlocks) {
    if (!deltaTime) return
    if (!this.isAlive) return

    // Updating animation frames
    this.elapsedTime += deltaTime
    const secondsInterval = 0.1

    if (this.elapsedTime > secondsInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.currentSprite.frames
      this.elapsedTime = 0
    }

    // Update hitbox position
    this.hitbox.x = this.x + 20
    this.hitbox.y = this.y + 20

    // Verifica se o player está próximo
    if (this.player) {
      const distanceToPlayer = Math.abs(this.x - this.player.x)
      this.isFollowingPlayer = distanceToPlayer < this.detectionRange

      if (this.isFollowingPlayer) {
        // Move em direção ao player
        if (this.player.x < this.x) {
          this.velocity.x = BOSS_X_VELOCITY
        } else {
          this.velocity.x = -BOSS_X_VELOCITY
        }

        // Verifica se há obstáculo à frente e pula se necessário
        if (this.isOnGround) {
          const direction = this.velocity.x > 0 ? 1 : -1
          const nextX = this.x + (direction * 50) // Verifica 50 pixels à frente
          
          // Verifica se há obstáculo à frente
          const hasObstacleAhead = collisionBlocks.some(block => {
            return (
              nextX + this.width > block.x &&
              nextX < block.x + block.width &&
              this.y + this.height > block.y &&
              this.y < block.y + block.height
            )
          })

          // Se houver obstáculo e estiver no chão, pula
          if (hasObstacleAhead) {
            this.velocity.y = -BOSS_JUMP_POWER
            this.isOnGround = false
          }
        }
      } else {
        // Comportamento normal de patrulha
        if (Math.abs(this.distanceTraveled) > this.turningDistance) {
          this.velocity.x = -this.velocity.x
          this.distanceTraveled = 0
        }
      }
    }

    this.applyGravity(deltaTime)
    this.updateHorizontalPosition(deltaTime)
    this.checkForHorizontalCollisions(collisionBlocks)
    this.checkPlatformCollisions(platforms, deltaTime)
    this.updateVerticalPosition(deltaTime)
    this.checkForVerticalCollisions(collisionBlocks)
    this.determineDirection()
  }

  determineDirection() {
    if (this.velocity.x > 0) {
      this.facing = 'left'
    } else if (this.velocity.x < 0) {
      this.facing = 'right'
    }
  }

  updateHorizontalPosition(deltaTime) {
    this.x += this.velocity.x * deltaTime
    this.hitbox.x += this.velocity.x * deltaTime
    if (!this.isFollowingPlayer) {
      this.distanceTraveled += this.velocity.x * deltaTime
    }
  }

  updateVerticalPosition(deltaTime) {
    this.y += this.velocity.y * deltaTime
    this.hitbox.y += this.velocity.y * deltaTime
  }

  applyGravity(deltaTime) {
    this.velocity.y += BOSS_GRAVITY * deltaTime
  }

  handleInput(keys) {
    this.velocity.x = 0

    if (keys.d.pressed) {
      this.velocity.x = BOSS_X_VELOCITY
    } else if (keys.a.pressed) {
      this.velocity.x = -BOSS_X_VELOCITY
    }
  }

  checkForHorizontalCollisions(collisionBlocks) {
    const buffer = 0.0001
    for (let i = 0; i < collisionBlocks.length; i++) {
      const collisionBlock = collisionBlocks[i]

      // Check if a collision exists on all axes
      if (
        this.hitbox.x <= collisionBlock.x + collisionBlock.width &&
        this.hitbox.x + this.hitbox.width >= collisionBlock.x &&
        this.hitbox.y + this.hitbox.height >= collisionBlock.y &&
        this.hitbox.y <= collisionBlock.y + collisionBlock.height
      ) {
        // Check collision while player is going left
        if (this.velocity.x < -0) {
          this.hitbox.x = collisionBlock.x + collisionBlock.width + buffer
          this.x = this.hitbox.x - 20 // Ajusta a posição considerando o offset da hitbox
          this.velocity.x = -this.velocity.x // Inverte a direção
          break
        }

        // Check collision while player is going right
        if (this.velocity.x > 0) {
          this.hitbox.x = collisionBlock.x - this.hitbox.width - buffer
          this.x = this.hitbox.x - 20 // Ajusta a posição considerando o offset da hitbox
          this.velocity.x = -this.velocity.x // Inverte a direção
          break
        }
      }
    }
  }

  checkForVerticalCollisions(collisionBlocks) {
    const buffer = 0.0001
    for (let i = 0; i < collisionBlocks.length; i++) {
      const collisionBlock = collisionBlocks[i]

      // If a collision exists
      if (
        this.hitbox.x <= collisionBlock.x + collisionBlock.width &&
        this.hitbox.x + this.hitbox.width >= collisionBlock.x &&
        this.hitbox.y + this.hitbox.height >= collisionBlock.y &&
        this.hitbox.y <= collisionBlock.y + collisionBlock.height
      ) {
        // Check collision while player is going up
        if (this.velocity.y < 0) {
          this.velocity.y = 0
          this.hitbox.y = collisionBlock.y + collisionBlock.height + buffer
          this.y = this.hitbox.y - 20 // Ajusta a posição considerando o offset da hitbox
          break
        }

        // Check collision while player is going down
        if (this.velocity.y > 0) {
          this.velocity.y = 0
          this.y = collisionBlock.y - this.height - buffer
          this.hitbox.y = this.y + 20 // Ajusta a posição considerando o offset da hitbox
          this.isOnGround = true
          break
        }
      }
    }
  }

  checkPlatformCollisions(platforms, deltaTime) {
    const buffer = 0.0001
    for (let platform of platforms) {
      if (platform.checkCollision(this, deltaTime)) {
        this.velocity.y = 0
        this.y = platform.y - this.height - buffer
        this.hitbox.y = this.y + 20 // Ajusta a posição considerando o offset da hitbox
        this.isOnGround = true
        return
      }
    }
    this.isOnGround = false
  }

  die() {
    if (!this.isAlive) return
    
    this.isAlive = false
    this.isDying = true
    this.currentSprite = this.sprites.death
    this.currentFrame = 0
    this.elapsedTime = 0
    
    // Após a animação de morte terminar, removemos o boss
    setTimeout(() => {
      this.isDying = false
      if (typeof this.onDeath === 'function') {
        this.onDeath()
      }
    }, 1000) // Tempo suficiente para a animação de morte
  }

  takeDamage(amount = 1) {
    if (!this.isAlive) return false
    
    this.currentHealth -= amount
    console.log(`Boss tomou dano! Vida restante: ${this.currentHealth}/${this.maxHealth}`)
    
    if (this.currentHealth <= 0) {
      this.die()
      return true
    }
    return false
  }

  setPlayer(player) {
    this.player = player
  }
}
