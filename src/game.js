const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scaleX = 1600
const scaleY = 900

canvas.width = 1600;
canvas.height = 900;

// ----------------------
// KEY INPUT
// ----------------------
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// ----------------------
// SPRITE INSTANCE
// ----------------------
const sprite = new Sprite("assets/Main_Character.png");

// center sprite on screen
sprite.x = canvas.width / 2 - sprite.frameWidth / 2;
sprite.y = canvas.height / 2 - sprite.frameHeight / 2;
// Add health 
sprite.health = 100; 
sprite.maxHealth = 100;

// ----------------------
// ANIMATION TIMING
// ----------------------
const FPS = 4;
const FRAME_TIME = 1000 / FPS;
const SpawnTime = 10 * FPS;

let lastTime = 0;
let gameFrame = 0;

let Entities = [new Entity("assets/Chicken_Enemy.png")];

let tileOffsetX = 0;
let tileOffsetY = 0;
const tileSize = 64;

let projectiles = [];
const fireRate = 10; 

const grassImage = new Image(tileSize,tileSize); 
grassImage.src = "assets/Grass.png";
// ----------------------
// UPDATE MOVEMENT + DIRECTION
// ----------------------
function updateDirectionAndMovement() {
    let moving = false;

    Entities.sort((a, b) => a.compare(b));

    if (keys["w"] || keys["ArrowUp"]) {
        sprite.setDirection(3); // backward
        moving = true;
        tileOffsetY += 2;
    }
    if (keys["s"] || keys["ArrowDown"]) {
        sprite.setDirection(0); // forward
        moving = true;
        tileOffsetY += -2;
    }
    if (keys["a"] || keys["ArrowLeft"]) {
        sprite.setDirection(2); // left
        moving = true;
        tileOffsetX += 2;
    }
    if (keys["d"] || keys["ArrowRight"]) {
        sprite.setDirection(1); // right
        moving = true;
        tileOffsetX += -2;
    }
    tileOffsetX %=tileSize
    tileOffsetY %=tileSize

    if (moving) sprite.startMoving();
    else sprite.stopMoving()

    let tempEntities = [...Entities];

    Entities.forEach(entity => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const dx = centerX - entity.X;
        const dy = centerY - entity.Y;

        let angle = Math.atan2(dy, dx);
        if(gameFrame%FPS===0){
            if (angle > -Math.PI/4 && angle <= Math.PI/4) {
                entity.setDirection(1); // right
            } else if (angle > Math.PI/4 && angle <= 3*Math.PI/4) {
                entity.setDirection(0); // forward
            } else if (angle <= -Math.PI/4 && angle > -3*Math.PI/4) {
                entity.setDirection(3); // backward
            } else {
                entity.setDirection(2); // left
            }
            }
        entity.startMoving();

        if(moving){
            entity.moveInDirection(2,(3-sprite.direction) % 4)
        }
        if((entity.X >= sprite.x - sprite.frameWidth/2 && entity.X <= sprite.x +sprite.frameWidth/2)
        && (entity.Y >= sprite.y - sprite.frameHeight/2 && entity.Y <= sprite.y +sprite.frameHeight/2)){

            // angle from player to enemy (in degrees)
            const dx = entity.X - sprite.x;
            const dy = entity.Y - sprite.y;

            let enemyAngleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

// player facing angle (in degrees)
            const facingAnglesDeg = [90, 0, 180, -90];
            let playerFacingDeg = facingAnglesDeg[sprite.direction];

// angle difference
            let diffDeg = enemyAngleDeg - playerFacingDeg;

// normalize to [-180, 180]
            diffDeg = ((diffDeg + 180) % 360) - 180;

// adjustable attack angle
            const attackAngleDeg = 100; // change this to whatever you want

// angle-based attack
            if (Math.abs(diffDeg) <= attackAngleDeg / 2) {
                tempEntities = tempEntities.filter(temp => temp !== entity);
                entity.markedForDeletion = true;
            } else if(gameFrame%FPS===0){
                sprite.health -= 5;
            }
        }
        entity.move(1)
    });
   
    Entities = Entities.filter(entity => !entity.markedForDeletion);
    
}

// ----------------------
// MAIN LOOP
// ----------------------
function animate(timestamp) {
    const delta = timestamp - lastTime;

    // advance animation at 4 FPS
    if (delta >= FRAME_TIME) {
        lastTime = timestamp;
        gameFrame++;
        if (gameFrame % fireRate === 0) {
            const target = getNearestEnemy();
            if (target) {
                projectiles.push(new Projectile("assets/Bolt.png", sprite.x, sprite.y, target));
                console.log("Fired projectile at", target);
            }
        }
    }

    if(gameFrame % SpawnTime === 0 && Entities.length < 30) {
        Entities.push(new Entity("assets/Chicken_Enemy.png"))
    }

    updateDirectionAndMovement();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawTiles();
   
    

    // Update and Draw Projectiles
    projectiles = projectiles.filter(p => p.alive); 
    projectiles.forEach(p => {
        p.update();
        p.draw(ctx, gameFrame);
    });

    // ----------------------
// ----------------------
// PLAYER HEALTH BAR (TOP LEFT)
// ----------------------
    const barWidth = 200;
    const barHeight = 20;
    const barX = 20;
    const barY = 20;

// background (dark red or gray)
    ctx.fillStyle = "#550000";
    ctx.fillRect(barX, barY, barWidth, barHeight);

// current health (bright red)
    const healthPercent = sprite.health / sprite.maxHealth;
    ctx.fillStyle = "red";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

// border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);


    // IMPORTANT: pass screenX and screenY
    const screenX = sprite.x;
    const screenY = sprite.y;

    drawn = false;

    // sprite.draw(ctx, gameFrame, screenX, screenY);
    Entities.forEach(entity => {
        if(!drawn) {
            if (entity.Y > sprite.y) {
                sprite.draw(ctx, gameFrame, screenX, screenY);
                drawn = true;
            } else if (entity.X < sprite.y && entity.Y === sprite.y) {
                sprite.draw(ctx, gameFrame, screenX, screenY);
                drawn = true;
            }
        }
        entity.draw(ctx, gameFrame);})
    if(!drawn){
        sprite.draw(ctx, gameFrame, screenX, screenY);
    }
    requestAnimationFrame(animate);
}

function drawTiles() {

    let grass = new Image(tileSize,tileSize)
    grass.src = "assets/Grass.png";
    for (let x = -tileSize; x < canvas.width + tileSize; x += tileSize) {
        for (let y = -tileSize; y < canvas.height + tileSize; y += tileSize) {
            ctx.drawImage(
                grassImage,
                x + tileOffsetX,
                y + tileOffsetY,
                tileSize,
                tileSize
            );
        }
    }
}

function getNearestEnemy() {
    if (Entities.length === 0) return null;
    
    return Entities.reduce((nearest, current) => {
        const distNext = Math.hypot(current.X - sprite.x, current.Y - sprite.y);
        const distNearest = Math.hypot(nearest.X - sprite.x, nearest.Y - sprite.y);
        return distNext < distNearest ? current : nearest;
    });
}
requestAnimationFrame(animate);