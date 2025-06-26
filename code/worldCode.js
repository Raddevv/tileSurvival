// canvas is the background, this defines our entire world view, layout, appearance, etc.
const canvas = document.getElementById("mapCanvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");

const tileWidth = 72; // individual width of tiles
const tileHeight = 32; // individual height of tiles

const playerImage = new Image();
playerImage.src = "assets/mrguyguy.png"; // player appearance

const treeImage = new Image();
treeImage.src = "assets/trees/tree.png";

const rockImage = new Image();
rockImage.src = "assets/rocks/rock.png";

const tileImages = {
    grass: new Image(),
    dirt: new Image(),
    water: new Image(),
    tallGrass: new Image(),
    shortGrass: new Image()
};
tileImages.grass.src = "assets/tiles/grass.jpg";
tileImages.dirt.src = "assets/tiles/dirt.jpg";
tileImages.water.src = "assets/tiles/water.jpg";
tileImages.tallGrass.src = "assets/tiles/tallGrass.png";
tileImages.shortGrass.src = "assets/tiles/shortGrass.png";

const player = { x: 0, y: 0 };
let cameraX = 0, cameraY = 0;

const moveDelay = 110;
let canMove = true;

const drawRange = 30;
const randomTrees = [];

function hash(x, y) {
    return (x * 645654564) ^ (y * 5466343253);
}

function getElevation(x, y) {
const elevation = getElevation(x, y);
// optional: darken tiles slightly based on elevation
ctx.globalAlpha = 1 - Math.max(0, Math.min(elevation * 0.1, 0.2));
ctx.drawImage(tileImg, screenX - tileWidth / 2, screenY, tileWidth, tileHeight);
ctx.globalAlpha = 1;

    return Math.sin((x + 100) * 0.02) + Math.cos((y - 100) * 0.02);
}

function getTileType(x, y) {
    const value = Math.sin((x * 0.05) + Math.cos(y * 0.05))
    const waterNoise = Math.sin((x + y * 2) * 0.03);
    const dirtPatchNoise = Math.sin((x * 43) + Math.cos(y * 0.01));

    if (value < -0.5 || waterNoise > 0.8) return "water";

    // clustered dirt patches
    if (dirtPatchNoise > 0.98) return "dirt";

    return "grass";
}

function getGrassOverlay(x, y) {
    const seed = Math.abs(Math.sin(hash(x, y)) * 1000) % 1;
    if (seed < 0.1) return "tallGrass";
    if (seed < 0.25) return "shortGrass";
    return null;
}

function shouldPlaceTree(x, y) {
    const tileType = getTileType(x, y);
    if (tileType === "water" || tileType === "dirt") return false; // stricter check

    const seed = Math.abs(Math.cos(hash(x, y)) * 10000) % 1;
    return seed < 0.16;
}

function tileToScreen(x, y) {
    const worldX = (x - y) * tileWidth / 2;
    const worldY = (x + y) * tileHeight / 2;
    return {
        screenX: worldX - cameraX + canvas.width / 2,
        screenY: worldY - cameraY + canvas.height / 2
    };
}

function drawTile(x, y) {
    const type = getTileType(x, y);
    const tileImg = tileImages[type];
    if (!tileImg.complete || tileImg.naturalWidth === 0) return;
    const { screenX, screenY } = tileToScreen(x, y);
    ctx.drawImage(tileImg, screenX - tileWidth / 2, screenY, tileWidth, tileHeight);

    if (type === "grass") {
        const overlayType = getGrassOverlay(x, y);
        if (overlayType) {
            const overlayImg = tileImages[overlayType];
            if (overlayImg.complete && overlayImg.naturalWidth > 0) {
                ctx.drawImage(overlayImg, screenX - tileWidth / 2, screenY - tileHeight / 2, tileWidth, tileHeight);
            }
        }
    }
}

function drawTree(x, y) {
    if (!treeImage.complete || treeImage.naturalWidth === 0) return;
    const { screenX, screenY } = tileToScreen(x, y);
    ctx.drawImage(treeImage, screenX - tileWidth / 4, screenY - tileHeight * 9, tileWidth, tileHeight * 4);
}

function drawPlayer() {
    if (!playerImage.complete || playerImage.naturalWidth === 0) return;
    const { screenX, screenY } = tileToScreen(player.x, player.y);
    ctx.drawImage(playerImage, screenX - tileWidth / 2, screenY - tileHeight * 1.75, tileWidth, tileHeight * 2.5);
}

function drawDebugMarker(x, y) {
    const { screenX, screenY } = tileToScreen(x, y);
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(screenX, screenY, 5, 0, Math.PI * 2);
    ctx.fill();
}

function shouldPlaceRock(x, y) {
    const tileType = getTileType(x, y);
    if (tileType !== "grass" && tileType !== "dirt") return false;
    const seed = Math.abs(Math.sin(hash(x, y) * 1.3)) % 1;
    return seed < 0.025;
}

function drawRock(x, y) {
    if (!rockImage.complete || rockImage.naturalWidth === 0) return;
    const { screenX, screenY } = tileToScreen(x, y);
    ctx.drawImage(rockImage, screenX - tileWidth / 2, screenY - tileHeight * 1.5, tileWidth, tileHeight * 1.5);
}

function drawVisionFadeout() {
    const grd = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height / 4,
        canvas.width / 2, canvas.height / 2, canvas.height / 2
    );
    grd.addColorStop(0, "rgba(0, 0, 0, 0)");
    grd.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}



function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawables = [];
    for (let y = player.y - drawRange; y <= player.y + drawRange; y++) {
        for (let x = player.x - drawRange; x <= player.x + drawRange; x++) {
            drawTile(x, y);
            if (shouldPlaceTree(x, y)) drawables.push({ x, y, type: "tree" });
            if (shouldPlaceRock(x, y)) drawables.push({ x, y, type: "rock" });
        }
    }

    drawables.push({ x: player.x, y: player.y, type: "player" });
    drawables.sort((a, b) => (a.x + a.y) - (b.x + b.y));

    for (const item of drawables) {
        if (item.type === "tree") drawTree(item.x, item.y);
        if (item.type === "rock") drawRock(item.x, item.y);
        if (item.type === "player") {
            drawPlayer();
            drawDebugMarker(player.x, player.y);
        }
    }
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function updateCamera() {
    const targetX = (player.x - player.y) * tileWidth / 2;
    const targetY = (player.x + player.y) * tileHeight / 2;
    cameraX = lerp(cameraX, targetX, 0.1);
    cameraY = lerp(cameraY, targetY, 0.1);
}

let lastFrameTime = performance.now();
let ping = 0, fps = 0;

function gameLoop() {
    const now = performance.now();
    const delta = now - lastFrameTime;
    fps = Math.round(1000 / delta);
    ping = Math.round(Math.random() * 20 + 30); // fake ping
    lastFrameTime = now;

    updateCamera();
    drawGrid();

    overlay.innerText = `X: ${player.x}, Y: ${player.y}\nPing: ${ping}ms\nFPS: ${fps}`;

    requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (e) => {
    if (!canMove) return;


    //player movement
    /*
    //thinking of making this directional tbh
    */
    let moved = false;
    switch (e.key) {
        case "ArrowUp": case "w": player.y += 1; moved = true; break;
        case "ArrowDown": case "s": player.y -= 1; moved = true; break;
        case "ArrowLeft": case "a": player.x -= 1; moved = true; break;
        case "ArrowRight": case "d": player.x += 1; moved = true; break;
    }

    if (moved) {
        canMove = false;
        setTimeout(() => canMove = true, moveDelay);
    }
});

function loadImages(callback) {
    let loaded = 0;
    const total = Object.keys(tileImages).length + 3;
    //const total = Object.keys(tileImages).length + [amt];

    function check() {
        loaded++;
        if (loaded >= total) callback();
    }

    for (let key in tileImages) {
        tileImages[key].onload = check;
        tileImages[key].onerror = () => {
            console.error(`Failed to load tile image: ${key}`);
            check();
        };
    }

    playerImage.onload = check;
    playerImage.onerror = () => {
        console.error("player is GONE.");
        check();
    };

    treeImage.onload = check;
    treeImage.onerror = () => {
        console.error("no trees here.");
        check();
    };

    rockImage.onload = check;
    rockImage.onerror = () => {
        console.error("no rocks here.");
        check();
    };

}

loadImages(() => {
    gameLoop();
});