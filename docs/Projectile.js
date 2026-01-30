
class Projectile extends Sprite {
    constructor(pngPath, x, y, target) {
        super(pngPath);
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = 5;
        this.alive = true;
        this.size = 32;
    }

    update() {
        if (!this.target || this.target.markedForDeletion) {
        this.alive = false; 
        return;
    }

    const dx = this.target.X - this.x;
    const dy = this.target.Y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If the bullet touches the enemy
    if (distance < 20) { 
        this.alive = false; // Destroy the bullet
        this.target.markedForDeletion = true; 
        console.log("Hit enemy at", this.target.X, this.target.Y);
    } else {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
    }
    }

    draw(ctx, gameFrame) {
        if (!this.loaded) return;

        // Draw the single PNG at the specified size
        ctx.drawImage(
            this.image,
            0, 0,                // Source X, Y (top left of your PNG)
            this.image.width,    // Source Width (the whole image)
            this.image.height,   // Source Height
            this.x, this.y,      // Destination X, Y on canvas
            this.size, this.size // Destination Width, Height (Visual Size)
        );
    }
}