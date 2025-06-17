class Projectile {
  constructor({ x, y, velocity, width, height }) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.width = width;
    this.height = height;
    this.hitbox = {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
  update(deltaTime) {
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    this.hitbox.x = this.x;
    this.hitbox.y = this.y;
  }
  draw(c) {
    c.fillStyle = 'blue'; // Mudando para amarelo como sugerido no comentário
    c.fillRect(this.x, this.y, this.width, this.height);
  }
  checkCollision(collisionBlock) {
    return (
      this.hitbox.x <= collisionBlock.x + collisionBlock.width &&
      this.hitbox.x + this.hitbox.width >= collisionBlock.x &&
      this.hitbox.y + this.hitbox.height >= collisionBlock.y &&
      this.hitbox.y <= collisionBlock.y + collisionBlock.height
    );
  }
}