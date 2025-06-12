class Projectile {
  constructor(x, y, direction) {
    this.x = x
    this.y = y
    this.radius = 5
    this.speed = 400
    this.direction = direction
  }

  update(deltaTime) {
    this.x += this.speed * this.direction * deltaTime
  }

  draw(c) {
    c.fillStyle = 'blue'
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    c.fill()
    c.closePath()
  }
}
