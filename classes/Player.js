const X_VELOCITY = 140
const JUMP_POWER = 250
const GRAVIDADE = 550

class Player {
  constructor({ x, y, size, velocity = { x: 0, y: 0 } }) {
    this.x = x
    this.y = y
    this.width = size
    this.height = size
    this.velocity = velocity
    this.isOnGround = false
    this.isImageLoaded = false
    this.image = new Image()
    this.image.onload = () => {
      this.isImageLoaded = true
    }
    this.image.src = './images/player1.png'
    this.elapsedTime = 0
    this.currentFrame = 0
    this.lastDirection = "right"
    this.jumpCount = 0
    this.isInAir = false
    this.isDashing = false
    this.dashDuration = 0.2
    this.dashTimer = 0
    this.dashSpeed = 500
    this.lastShotTime = 0
    this.shootCooldown = 0.5
    this.sprites = {
      idle: {
        x: 0,
        y: 248,
        width: 32,
        height: 40,
        frames: 4,
      },
      run: {
        x: 192,
        y: 154,
        width: 32,
        height: 40,
        frames: 6,
      },
      jump: {
        x: 32 * 7,
        y: 32 * 9,
        width: 33,
        height: 40,
        frames: 1,
      },
      fall: {
        x: 32 * 8,
        y: 32 * 9,
        width: 33,
        height: 46,
        frames: 1,
      },
      shoot: {
        x: 0, 
        y: 250,
        width: 32,
        height: 38,
        frames: 4,
      }
    }
    this.currentSprite = this.sprites.idle
    this.facing = 'right'
    this.hitbox = {
      x: 0,
      y: 0,
      width: 20,
      height: 23,
    }
    this.isInvincible = false
    this.isDodging = false
    this.isInAirAfterDodging = false
  }

  setIsInvincible() {
    this.isInvincible = true
    setTimeout(() => {
      this.isInvincible = false
    }, 1500)
  }

  draw(c) {
    // Red square debug code
    // c.fillStyle = 'rgba(255, 0, 0, 0.5)'
    // c.fillRect(this.x, this.y, this.width, this.height)

    // Hitbox
    // c.fillStyle = 'rgba(0, 0, 255, 0.5)'
    // c.fillRect(
    //   this.hitbox.x,
    //   this.hitbox.y,
    //   this.hitbox.width,
    //   this.hitbox.height,
    // )

    if (this.isImageLoaded === true) {
      let xScale = 1
      let x = this.x

      if (this.facing === 'left') {
        xScale = -1
        x = -this.x - this.width
      }

      c.save()
      if (this.isInvincible) {
        c.globalAlpha = 0.5
      } else {
        c.globalAlpha = 1
      }
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
        this.height
      )
      c.restore()
    }
  }

  update(deltaTime, collisionBlocks) {
    if (!deltaTime) return

    // Atualiza o timer do dash
    if (this.isDashing) {
      this.dashTimer += deltaTime
      if (this.dashTimer >= this.dashDuration) {
        this.isDashing = false
        this.isInvincible = false
        this.velocity.x = 0
      }
    }

    // Updating animation frames
    this.elapsedTime += deltaTime
    const secondsInterval = 0.4
    if (this.elapsedTime > secondsInterval) {
      this.currentFrame = (this.currentFrame + 1) % this.currentSprite.frames
      this.elapsedTime -= secondsInterval
    }

    if (this.isDodging && this.currentFrame === 3) {
      this.isDodging = false
      this.isInvincible = false
    }

    // Update hitbox position
    this.hitbox.x = this.x + 4
    this.hitbox.y = this.y + 9

    this.applyGravity(deltaTime)

    // Update horizontal position and check collisions
    this.updateHorizontalPosition(deltaTime)
    this.checkForHorizontalCollisions(collisionBlocks)

    // Check for any platform collisions
    this.checkPlatformCollisions(platforms, deltaTime)

    // Update vertical position and check collisions
    this.updateVerticalPosition(deltaTime)
    this.checkForVerticalCollisions(collisionBlocks)

    this.determineDirection()
    this.switchSprites()
  }

  dodge() {
    if (!this.isDashing) {
      this.isDashing = true
      this.dashTimer = 0
      this.isInvincible = true
      this.velocity.x = this.facing === 'right' ? this.dashSpeed : -this.dashSpeed
    }
  }

  determineDirection() {
    if (this.velocity.x > 0) {
      this.facing = 'right'
      this.lastDirection = 'right'
    } else if (this.velocity.x < 0) {
      this.facing = 'left'
      this.lastDirection = 'left'
    }
  }

  switchSprites() {
    if (this.isRolling) return

    if (
      this.isOnGround &&
      this.velocity.x === 0 &&
      this.currentSprite !== this.sprites.idle
    ) {
      // Idle
      this.currentFrame = 0
      this.currentSprite = this.sprites.idle
    } else if (
      this.isOnGround &&
      this.velocity.x !== 0 &&
      this.currentSprite !== this.sprites.run
    ) {
      // Run
      this.currentFrame = 0
      this.currentSprite = this.sprites.run
    } else if (
      !this.isOnGround &&
      this.velocity.y < 0 &&
      this.currentSprite !== this.sprites.jump
    ) {
      // Jump
      this.currentFrame = 0
      this.currentSprite = this.sprites.jump
    } else if (
      !this.isOnGround &&
      this.velocity.y > 0 &&
      this.currentSprite !== this.sprites.fall
    ) {
      // Fall
      this.currentFrame = 0
      this.currentSprite = this.sprites.fall
    }
  }

  jump() {
    if (this.jumpCount < 2) {
      this.velocity.y = -JUMP_POWER
      this.isOnGround = false
      this.jumpCount++
      this.isInAir = true
    }
  }

  shoot() {
    const currentTime = performance.now() / 1000;
    if (currentTime - this.lastShotTime >= this.shootCooldown) {
      const projectile = new Projectile({
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        velocity: this.lastDirection === 'right' ? { x: 300, y: 0 } : { x: -300, y: 0 },
        width: 10,
        height: 5,
      }); 
      projectiles.push(projectile);
      this.lastShotTime = currentTime;
    }
  }

  updateHorizontalPosition(deltaTime) {
    this.x += this.velocity.x * deltaTime
    this.hitbox.x += this.velocity.x * deltaTime
  }

  updateVerticalPosition(deltaTime) {
    this.y += this.velocity.y * deltaTime
    this.hitbox.y += this.velocity.y * deltaTime
  }

  applyGravity(deltaTime) {
    this.velocity.y += GRAVIDADE * deltaTime
  }

  handleInput(keys) {
    if (this.isDashing) return

    this.velocity.x = 0

    if (keys.d.pressed || keys.arrowRight.pressed ) {
      this.velocity.x = X_VELOCITY
    } else if (keys.a.pressed || keys.arrowLeft.pressed) {
      this.velocity.x = -X_VELOCITY
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
          this.x = this.hitbox.x - 4
          break
        }

        // Check collision while player is going right
        if (this.velocity.x > 0) {
          this.hitbox.x = collisionBlock.x - this.hitbox.width - buffer
          this.x = this.hitbox.x - 4
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
          this.y = this.hitbox.y - 9
          break
        }

        // Check collision while player is going down
        if (this.velocity.y > 0) {
          this.velocity.y = 0
          this.y = collisionBlock.y - this.height - buffer
          this.hitbox.y = collisionBlock.y - this.hitbox.height - buffer
          this.isOnGround = true
          this.jumpCount = 0
          this.isInAir = false

          if (!this.isDodging) this.isInAirAfterDodging = false
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
        this.isOnGround = true
        this.jumpCount = 0
        this.isInAir = false
        return
      }
    }
    this.isOnGround = false
  }
}
