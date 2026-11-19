class Obstacle {
    constructor (gameScreen, speed, bounds = { top: 50, bottom: 550 }) {
        this.gameScreen = gameScreen;
        this.speed = speed;
        this.heightArr = [70, 140, 210, 280, 350]
        this.randomIndex = Math.floor(Math.random() * this.heightArr.length)
        this.height = this.heightArr[this.randomIndex]
        
        this.widthArr = [50, 100, 150, 200]
        this.randomIndex = Math.floor(Math.random() * this.widthArr.length)
        this.width = this.widthArr[this.randomIndex]

        this.topArr = [bounds.top, (bounds.bottom - this.height)]
        this.randomIndex = Math.floor(Math.random() * this.topArr.length)
        this.top = this.topArr[this.randomIndex]

        this.left = 900

        this.element = document.createElement('img');
        this.element.src = './img/rock.png';
        this.element.style.position = "absolute";
        this.element.style.width = `${this.width}px`;
        this.element.style.height = `${this.height}px`;
        this.element.style.left = `${this.left}px`;
        this.element.style.top = `${this.top}px`;
        this.gameScreen.appendChild(this.element);
    }
    move(speedFactor = 1){
        this.left -= this.speed * speedFactor
        this.updatePosition()
    }
    updatePosition(){
        this.element.style.left = `${this.left}px`;
    }

}
