var keypress = require('keypress');
const chalk = require('chalk');

var interval;
var inimigos = []
const frameRate = 30
var colunas = 40
var linhas = 30
var lives = 3
var gameOver = false
var points = 0;
var enemySpeed = 1;
var enemyStart = 0;
var enemyGoRight = true;

var time = new Date()

var enemyShots = []

const init = () => {

    if(colunas > process.stdout.columns){
        colunas = process.stdout.columns
    }
    if(linhas > process.stdout.rows){
        linhas = process.stdout.rows-4
    }
    // make `process.stdin` begin emitting "keypress" events
    keypress(process.stdin);

    // listen for the "keypress" event
    process.stdin.on('keypress', function (ch, key) {
    //console.log('got "keypress"', key);
        if(key && key.name){
            processInput(key)
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    startGame()
}

const startGame = () => {
    createEnemies(spawnEnemys());
    interval = setInterval(update, 1000/frameRate);
}

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

const proccessCollisions = () => {
    processShots()
    proccessEnemyShots()
}

const update = () => {
    time = new Date()
    
    proccessCollisions()
    proccessEnemies()

    if(lives<1){
        gameOver = true
        render(gameOverScreen())
    }else if(inimigos.length<1){
        gameOver = true
        render(winScreen())
    }else{
        render(gameScreen())
    }

}

class Enemy {
    constructor(x,y){
        this.x = x
        this.y = y
        this.sprite = chalk.magenta(`W`)
        this.chanceOfShooting=Math.random()*0.001
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
        },1000)
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

const spawnEnemys = () => {
    let spawnArray = []
    const arraySize = Math.floor(linhas*.7)
    for(let i=0; i<arraySize;i++){
        spawnArray.push(Math.floor(Math.random()*(colunas*.7)))
    }
    return spawnArray
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

const processInput = (key)=>{
    
    if(key.name=='left' || key.name == 'a' || key.name == 'A'){
        moveLeft()
    }
    if(key.name=='right' || key.name == 'd' || key.name == 'D'){
        moveRight()
    }
    if(key.name=="space"){
        shoot()
    }
    if(gameOver){       
        if(key.name=='enter' || key.name=='return'){
            restartGame()
        }
    }
    if (key.ctrl && key.name == 'c') {
      process.exit();
    }
}


const gameOverScreen = () => {
    let screen = fillLine(`GAME OVER`,`-`)+`\n`
    screen += fillLine(`SCORE`,`-`)+`\n`
    screen += fillLine(points,`.`)+`\n`
    screen += fillLine(`PRESS ENTER TO RESTART`,`-`)+`\n`
    return screen
}
const winScreen = () => {
    let screen = fillLine(`CONGRATULATIONS`,`-`)+`\n`
    screen += fillLine(`SCORE`,`-`)+`\n`
    screen += fillLine(points,`.`)+`\n`
    screen += fillLine(`PRESS ENTER TO RESTART`,`-`)+`\n`
    return screen
}

const gameScreen = () => {
    let screen = scoreDisplay()
    for(let i =0; i< linhas; i++){
        let line = `#`

        for(let c =0; c<colunas-2;c++){
            let shot = nave.shots.find((shot)=>{
                return (shot.x==c && shot.y==i)
            })
            let enemyShot = enemyShots.find((shot)=>{
                return (shot.x==c && shot.y==i)
            })
            let inimigo = inimigos.find((inimigo)=>{
                return (inimigo.x==c && inimigo.y==i)
            })
            if(inimigo && !shot){
                line+= inimigo.sprite
            }else if(shot && inimigo && inimigo.alive){
                shot.alive = false
                inimigo.die()
                line += inimigo.sprite
            }else if(shot){
                line+= chalk.green(shot.ammo.sprite)
            }else if(enemyShot){
                line+= enemyShot.ammo.sprite
            }else{
                line+=` `
            }
            
        }
        line += `#\n`
        screen += line
    }
    screen += makeNaveLine()
    screen += fillLine(``,`#`)
    return screen
}


const fillLine = (value,char) => {
    digits = value.toString().length
    let blanks = colunas - digits;
    let half = Math.floor(blanks/2)
    let part = char.repeat(half)
    let line = part+value+part
    if(line.length<colunas){
        line += char
    }
    return line
}

const render = (screen) => {
    console.clear()
    console.log(screen)
}
const scoreDisplay = () => {
    let zeros = '0'.repeat(8-points.toString().length)
    let liveString = `Lives:${lives}`
    let pointString = `${zeros}${points}\n`
    let midleSpacer = colunas-liveString.length-pointString.length
    return liveString+`-`.repeat(midleSpacer)+pointString
}
const makeNaveLine = () => {
    let line = `#`
    for(let i =0; i < nave.pos; i++){
        let enemyShot = enemyShots.find((shot)=>{
            return (shot.x==i && shot.y==linhas)
        })
        if(enemyShot){
            line +=enemyShot.ammo.sprite
        }else{
            line +=` `
        }
    }
    line += `${nave.sprite}`
    for(let f = nave.pos+nave.width; f<colunas-2; f++){
        
        let enemyShot = enemyShots.find((shot)=>{
            return (shot.x==f && shot.y==linhas)
        })
        if(enemyShot){
            line +=enemyShot.ammo.sprite
        }else{
            line +=` `
        }
    }
    line+=`#\n`
    return line
}

init()

