/* global performance, alert, requestAnimationFrame */

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const TANK_WIDTH = 30
const TANK_HEIGHT = 40
const TANK_SPEED = 0.55 // used to increment the Y coords of all the blocks, set at 0.3
const BALL_SPEED = 1.6  // firing ball speed
const MONSTER_SPEED = 0.6 // speed at which the monsters move along the y axis.

var playerLives = 3
var score = 0

// Arrays to hold all the ball, monster and block Objects.
var balls = []
var monsters = []
var blocks = []

var sinceLastFire = performance.now() // initializing sinceLastFire, used to stop the player from firing constantly
var tankBlockCollisionBool = true    // initializing var that indicates if the tank hit a block

var tank = {
  X: canvas.width / 2,
  Y: canvas.height - 70,
  width: TANK_WIDTH,
  height: TANK_HEIGHT
}

// This part handles the pressing of keys used to move the tank and fire
var rightKeyPressed = false
var leftKeyPressed = false
var spaceKeyPressed = false

document.addEventListener('keydown', KeyDownFunc, false)
document.addEventListener('keyup', KeyUpFunc, false)

// When a key is pressed down
function KeyDownFunc (e) {
  if (e.keyCode === 39) {
    rightKeyPressed = true
  } else if (e.keyCode === 37) {
    leftKeyPressed = true
  } else if (e.keyCode === 32) {
    spaceKeyPressed = true
  }
}

// When a key is released
function KeyUpFunc (e) {
  if (e.keyCode === 39) {
    rightKeyPressed = false
  } else if (e.keyCode === 37) {
    leftKeyPressed = false
  } else if (e.keyCode === 32) {
    spaceKeyPressed = false
  }
}

/* -------------------------------------------------------------------------------
------------------------------------------------------------------------------- */

// Drawing the Tank
function drawTank () {
  ctx.beginPath()
  ctx.rect(tank['X'], tank['Y'], TANK_WIDTH, TANK_HEIGHT)
  ctx.fillStyle = '#388e3c'

  ctx.rect(tank['X'] + TANK_WIDTH / 2 - 5, tank['Y'] - 15, 10, 15)
  ctx.fillStyle = '#388e3c'

  ctx.fill()
  ctx.closePath()
}

// Drawing the border blocks
function drawBorder () {
  ctx.beginPath()
  ctx.rect(0, 0, 80, canvas.height)
  ctx.rect(canvas.width - 80, 0, 80, canvas.height)
  ctx.fillStyle = 'grey'
  ctx.fill()
  ctx.closePath()
}

// Initializing a new ball (starting position), adding it to a list
function drawNewBall (ballXcoord, ballYcoord) {
  ctx.beginPath()
  ctx.arc(ballXcoord, ballYcoord, 5, 0, Math.PI * 2)

  var ball = {
    X: ballXcoord,
    Y: ballYcoord,
    width: 3,
    height: 3
  }

  balls.push(ball)
  sinceLastFire = performance.now()
}

// drawing all of the balls of the list
function drawBalls () {
  balls.map((ball) => {
    ctx.beginPath()
    ctx.arc(ball['X'], ball['Y'], 5, 0, Math.PI * 2)
    ctx.fillStyle = 'red'
    ctx.fill()
    ctx.closePath()
  })
}

// Generates coordinates with 80 < x < (canvas.width - 120) and -260 < y < -60. Returns the coordinates.
function generateCoords () {
  do {
    var X = Math.random() * (canvas.width - 80) + 80
  } while (X + 120 > canvas.width)

  var Y = Math.random() * (-260 - 60) - 60
  return [X, Y]
}

// Checks that the distance between TWO blocks is greater than 140 and the difference along the Y-axis is greater than 40
function distanceCheck (X1, Y1, X2, Y2) {
  var distance = Math.sqrt(Math.pow(X1 - X2, 2) + Math.pow(Y1 - Y2, 2))
  if (distance > 140 && Math.abs(Y1 - Y2) > 40) {
    return true
  } else {
    return false
  }
}

// function that returns TRUE if we need to generate new coords because the blocks are too close, FALSE otherwise
function blockDistanceChecker (X, Y) {
  if (blocks.length === 0) {
    return false
  }

  var check = false
  for (let i = 0; i < blocks.length; i++) {
    if (distanceCheck(X, Y, blocks[i]['X'], blocks[i]['Y'])) {
      check = check || false
    } else {
      check = check || true
    }
  }

  if (!check) {
    return false
  } else {
    return true
  }
}

// Creates a new block
function drawNewBlock () {
  do {
    var coords = generateCoords()
    var X = coords[0]
    var Y = coords[1]
  } while (blockDistanceChecker(X, Y))

  var width = 40
  var height = 60

  var block = {
    X: X,
    Y: Y,
    width: width,
    height: height
  }

  blocks.push(block)
}

function drawBlocks () {
  blocks.map((block) => {
    ctx.beginPath()
    ctx.rect(block['X'], block['Y'], block['width'], block['height'])
    ctx.fillStyle = '#8d6e63'
    ctx.fill()
    ctx.closePath()
  })
}

// Mover function: moves blocks elements down (y++) along the y axis
function moverFunc () {
  for (let i = 0; i < blocks.length; i++) {
    blocks[i]['Y'] = blocks[i]['Y'] + TANK_SPEED
    // Drops the block from the blocks array when they're out of view
    if (blocks[i]['Y'] > canvas.width) {
      blocks.splice(i, 1)
    }
  }
}

// Mover function: moves the balls the balls up (y--) along the y axis //ADDED: Moving the monsters
function moveBalls () {
  // Moving the Balls
  for (let i = 0; i < balls.length; i++) {
    balls[i]['Y'] = balls[i]['Y'] - BALL_SPEED
    // Drops the ball from the balls array when they're out of view
    if (balls[i]['Y'] < 0) {
      balls.splice(i, 1)
    }
  }

  // Moving the Monsters
  for (let j = 0; j < monsters.length; j++) {
    monsters[j]['Y'] = monsters[j]['Y'] + MONSTER_SPEED
    // Drops the monsters from the list when they're out of view
    if (monsters[j]['Y'] > canvas.width) {
      monsters.splice(j, 1)
    }
  }
}

// Block Collision detection function
function tankAndBlockCollision () {
  for (let i = 0; i < blocks.length; i++) {
    var conflictX = false
    var conflictY = false

    if (tank['X'] + TANK_WIDTH > blocks[i]['X'] && tank['X'] < blocks[i]['X'] + 40) {
      conflictX = conflictX || true
    }
    if (tank['Y'] < blocks[i]['Y'] + 60 && tank['Y'] > blocks[i]['Y']) {
      conflictY = conflictY || true
    }
    if (conflictX && conflictY) {
      tankBlockCollisionBool = false
      playerLives -= 1
      resetGame()
      return
    }
  }
  tankBlockCollisionBool = true
}

// Resets Game, returning tank to initial positions and deleting current monsters and blocks
function resetGame () {
  tank['X'] = canvas.width / 2
  tank['Y'] = canvas.height - 70
  
  balls = []
  monsters = []
  blocks = []
}


// Generates X and Y coordinates for a new monster
function createMonster () {
  var coords = generateCoords()
  var X = coords[0]
  var Y = coords[1]

  var monster = {
    X: X,
    Y: Y,
    width: 25,
    height: 29
  }

  monsters.push(monster)
}

// Draws a monster
function drawMonster (X, Y) {
  var scale = 0.8
  var h = 9 // height
  var a = 5

  ctx.beginPath()
  // First trapezoid
  ctx.moveTo(X, Y)
  ctx.lineTo(X - a * scale, Y + h * scale)
  ctx.lineTo(X + (a * 4) * scale, Y + h * scale)
  ctx.lineTo(X + (a * 3) * scale, Y)
  // Second trapezoid
  ctx.moveTo(X - (a + 5) * scale, Y + h * scale)
  ctx.lineTo(X - (a) * scale, Y + (h + 20) * scale)
  ctx.lineTo(X + (a + 15) * scale, Y + (h + 20) * scale)
  ctx.lineTo(X + (a + 20) * scale, Y + (h) * scale)

  ctx.fillStyle = 'purple'
  ctx.fill()
  ctx.closePath()
}

// Draws all monsters in the monsters list
function drawMonsters () {
  for (let i = 0; i < monsters.length; i++) {
    var X = monsters[i]['X']
    var Y = monsters[i]['Y']
    drawMonster(X, Y)
  }
}

// Collision detector: detects a collision along the Y-axis between two objects (Maps) with the following template: ["X", "Y", "width", "height"]
function collisionDetector (first, second) {
  var x1 = first['X']
  var y1 = first['Y']
  var width1 = first['width']
  var height1 = first['height']
  var x2 = second['X']
  var y2 = second['Y']
  var width2 = second['width']
  var height2 = second['height']

  if ((x2 > x1 && x2 < x1 + width1) || (x1 > x2 && x1 < x2 + width2)) {
    if ((y2 > y1 && y2 < y1 + height1) || (y1 > y2 && y1 < y2 + height2)) {
      return true
    }
  } else {
    return false
  }
}

// detects a collion betweenn balls and monsters
function ballMonsterCollision () {
  for (let i = 0; i < monsters.length; i++) {
    var monster = monsters[i]
    for (let j = 0; j < balls.length; j++) {
      var ball = balls[j]
      if (collisionDetector(monster, ball)) {
        balls.splice(j, 1)
        monsters.splice(i, 1)
        score += 2
      }
    }
  }
}

function ballCollidesWith (blocks) {
  blocks.forEach((block) => {
    balls.forEach((ball, index) => {
      if (collisionDetector(block, ball)) {
        balls.splice(index, 1)
      }
    })
  })
}

// Used to display the number of lives remaining and game score
function drawInfo () {
  ctx.font = 'bold 15px Gill Sans MT'
  ctx.fillStyle = 'blue'
  ctx.fillText('Lives: ' + playerLives, 635, 22)
  ctx.fillText('Score: ' + score, 13, 22)
}

// Main function, will be used to run the game
function draw () {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawBorder()
  drawInfo()
  drawTank()
  drawBalls()
  drawBlocks()
  drawMonsters()
  moveBalls()
  tankAndBlockCollision()
  ballMonsterCollision()
  ballCollidesWith(blocks)
  moverFunc()

  // This part handles firing balls and moving the tank
  if (spaceKeyPressed && balls.length < 10 && performance.now() - sinceLastFire > 500) {
    drawNewBall(tank['X'] + 15, tank['Y'] - 30)
  }
  if (rightKeyPressed && tank['X'] + TANK_WIDTH < canvas.width) {
    tank['X'] = tank['X'] + 1
  }
  if (leftKeyPressed && tank['X'] > 0) {
    tank['X'] = tank['X'] - 1
  }

  // This part creates new blocks and monsters if there isn't enough of them
  if (blocks.length < 3) {
    drawNewBlock()
  }
  if (monsters.length < 1) {
    createMonster()
  }
  
  // This part handles Game Over, when the player has lost all their lives
  if (playerLives < 0) {
    alert('You lost')
    document.location.reload()
  }

  requestAnimationFrame(draw)
}

draw()
