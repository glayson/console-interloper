var keypress = require('keypress');
const chalk = require('chalk');
const { threadId } = require('worker_threads');

var interval;
var variable =``
let input = ``
var inimigos = []
const frameRate = 30
const colunas = 28;
const linhas = 9
var lives = 3
var originalEnemies = [4,6,8,6,4]
var gameOver = false
var points = 0;
var didShoot = false
var enemySpeed = 1;
var enemyStart = 0;
var enemyGoRight = true;

var time = new Date()

var enemyShots = []

class Enemy {
    constructor(x,y){
        this.x = x
        this.y = y
        this.sprite = chalk.magenta(`W`)
        this.chanceOfShooting=0.001
        this.alive = true
        this.remove = false
        this.canShoot = true
        this.ammo = {
            sprite:chalk.red(`v`),
            speed:.1,
        }
        this.nextMove = time.getTime()+((1000/enemySpeed))
        return this
    }
    die = () => {
        this.sprite = chalk.red(`*`)
        this.alive = false
        this.remove = false
        points++
        setTimeout(()=>{
            this.remove = true
        },2000)
    }
    tryShooting = () => {
        if((this.chanceOfShooting*(enemyStart/inimigos.length))>Math.random() && this.alive){
            this.shoot()
        }
    }
    shoot = () => {
        enemyShots.push({
            x:this.x,
            y:this.y+1,
            timeTilNextLine: time.getTime()+(frameRate/this.ammo.speed),
            ammo: this.ammo,
            alive:true
        })
    }
}


const createEnemies = (linhas=[3,4,5]) => {
    linhas.map((linha,index)=>{
        let espaco = Math.floor((colunas-linha)/(linha+1));
        for(let i =0; i<linha;i++){
            let enemy = new Enemy((espaco+1)*(i+1),index)
            inimigos.push(enemy)
        }
    })
    enemyStart = inimigos.length
}

const nave = {
    sprite:chalk.yellow(`_A_`),
    width:3,
    pos: 14,
    lives:3,
    maxShots:3,
    ammo:{
        speed:5, 
        dammage:1,
        sprite:'.'
    },
    shots:[]
}

const makeNaveLine = () => {
    let line = `#`
    for(let i =0; i < nave.pos; i++){
        line +=` `
    }
    line += `${nave.sprite}`
    for(let f = nave.pos+nave.width; f<colunas; f++){
        line +=` `
    }
    line+=`#`
    return line
}

const moveLeft = () => {
    if(nave.pos>0){
        nave.pos--
    }
}
const moveRight = () => {
    if(nave.pos<colunas-nave.width){
        nave.pos++
    }
}
const shoot = ()=>{
    if(nave.shots.length<nave.maxShots){
        
        nave.shots.push({
            x:nave.pos+1,
            y:linhas-1,
            timeTilNextLine: time.getTime()+(frameRate/nave.ammo.speed),
            ammo: nave.ammo,
            alive:true
        })
    }
}
const processShots = ()=>{
    
    nave.shots.forEach((shot)=>{
        if(shot.timeTilNextLine<time.getTime()){
            shot.timeTilNextLine= time.getTime()+(1000/(shot.ammo.speed*frameRate))
            shot.y--
            if(shot.y<0){
                shot.alive = false
            }
        }
    })
    nave.shots = nave.shots.filter(shoot => shoot.alive)
}

const proccessEnemies = () => {
    let canMoveRight = true;
    let canMoveLeft = true;
    inimigos = inimigos.filter(inimigo=>!inimigo.remove)
    inimigos.map((inimigo)=>{
        if(inimigo.x>colunas){
            canMoveRight = false
            enemyGoRight = false
        }
        if(inimigo.x<0){
            canMoveLeft = false
            enemyGoRight = true
        }
        inimigo.tryShooting()
    })
    if(canMoveRight && enemyGoRight){
        inimigos.forEach((inimigo)=>{
            if(inimigo.alive && inimigo.nextMove<time.getTime()){
                inimigo.x++
                inimigo.nextMove = time.getTime()+((1000/enemySpeed/(enemyStart/inimigos.length)))
            }
        })
    }else if(canMoveLeft && !enemyGoRight){
        inimigos.forEach((inimigo)=>{
            if(inimigo.alive && inimigo.nextMove<time.getTime()){
                inimigo.nextMove = time.getTime()+((1000/enemySpeed/(enemyStart/inimigos.length)))
                inimigo.x--
            }
        })
    }

    
}

const proccessEnemyShots = () => {
    enemyShots.forEach((shot)=>{
        if(shot.timeTilNextLine<time.getTime()){
            shot.timeTilNextLine= time.getTime()+(1000/(shot.ammo.speed*frameRate))
            shot.y++
            if(shot.y==linhas+1 && shot.x==nave.pos+1){
                lives--
                shot.alive = false
            }else if(shot.y>linhas+2){
                shot.alive = false
            }
        }
    })
    enemyShots = enemyShots.filter(shot => shot.alive)
}

const processInput = ()=>{
    
    if(variable=='left'){
        moveLeft()
    }
    if(variable=='right'){
        moveRight()
    }
    if(didShoot){
        shoot()
        didShoot = false
    }
    
    variable = false
}
// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
  //console.log('got "keypress"', key);
  variable = key.name
  if(gameOver){       
        if(variable=='enter' || variable=='return'){
            restartGame()
        }
    }
  if(key && key.name=='space'){
      didShoot = true;
  }
  if (key && key.ctrl && key.name == 'c') {
    process.exit();
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();




const restartGame = () => {
    enemyShots = []
    lives = 3
    nave.shots = []
    points = 0
    inimigos = []
    enemyGoRight = true
    gameOver = false
    nave.pos = colunas/2
    startGame()
}

const startGame = () => {
    createEnemies(originalEnemies);
    interval = setInterval(update, 1000/frameRate);
}


const update = () => {
    time = new Date()
    processInput()
    processShots()
    proccessEnemies()
    proccessEnemyShots()
    console.clear()

    if(lives<1){
        gameOver = true
        console.log(`-------GAME OVER--------`)
        console.log(`---------SCORE----------`)
            let digits = points.toString().length
            let blanks = 24 - digits;
            let left = Math.floor(blanks/2)
            let zeros = '.'.repeat(left)
            let line = zeros+points+zeros
            if(line.length<24){
                line += `.`.repeat(24-line.length)
            }
            console.log(line)
            console.log(`-PRESS ENTER TO RESTART-`)
    }else if(inimigos.length<1){
        gameOver = true
        console.log(`----CONGRATULATIONS-----`)  
        console.log(`---------SCORE----------`)
            let digits = points.toString().length
            let blanks = 24 - digits;
            let left = Math.floor(blanks/2)
            let zeros = '.'.repeat(left)
            let line = zeros+points+zeros
            if(line.length<24){
                line += `.`.repeat(24-line.length)
            }
            console.log(line) 
            console.log(`-PRESS ENTER TO RESTART-`)
    }else{
        let zeros = '0'.repeat(8-points.toString().length)
    console.log(`Lives:${lives}----#######----${zeros}${points}`)
    for(let i =0; i< linhas; i++){
        let line = `#`

        for(let c =0; c<colunas;c++){
            let shot = nave.shots.find((shot)=>{
                return (shot.x==c && shot.y==i)
            })
            let enemyShot = enemyShots.find((shot)=>{
                return (shot.x==c && shot.y==i)
            })
            let inimigo = inimigos.find((inimigo)=>{
                return (inimigo.x==c && inimigo.y==i)
            })
            if(shot && inimigo && inimigo.alive){
                shot.alive = false
                inimigo.die()
                line += inimigo.sprite
            }else if(shot){
                line+= chalk.green(shot.ammo.sprite)
            }else if(inimigo){
                line+= inimigo.sprite
            }else if(enemyShot){
                line+= enemyShot.ammo.sprite
            }else{
                line+=` `
            }
            
        }
        line += `#`
        console.log(line)
    }
console.log(makeNaveLine())
console.log(`#########-#########-#########`)
    }

}



startGame()

