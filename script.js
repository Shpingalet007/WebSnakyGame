class WormGame {
	constructor() {
		/* Zone settings */
		this.defZoneSize = 10;
		this.blockSize = 20;
		this.timeFlow = 200;
		
		/* Bonus settings */
		this.bonusTime = 5000;
		this.bonusChance = 1/10;
		
		this.points = 0;
		
		this.stack = [];
	}
	
	initZone(width = this.defZoneSize, height = this.defZoneSize) {
		this.blocksX = width;
		this.blocksY = height;
		
		let sizeStyles = {
			width: this.zoneSize(width),
			height: this.zoneSize(height)
		};
		
		$('#zone, #grids .h, #grids .v').css(sizeStyles);
		
		let worm = new Worm();
		worm.keyboardEvents();
		
		food.spawn();
		
		this.timerStart();
	}
	
	addPoints(points) {
		this.points += points;
		this.updatePointsTable();
	}
	
	updatePointsTable() {
		$('#points').text(this.points);
	}
	
	zoneSize(blocks) { return blocks * this.blockSize -1 }
	
	blockCoord(block) { return block * this.blockSize }
	
	isInZoneX(pos) {
		if(pos == this.blocksX) return 0;
		else if(pos == -1) return this.blocksX-1;
		
		return pos;
	}
	isInZoneY(pos) {
		if(pos == this.blocksY) return 0;
		else if(pos == -1) return this.blocksY-1;
		
		return pos;
	}
	
	randBlockX() { return Math.floor(1+Math.random() * (this.blocksX-2)) }
	randBlockY() { return Math.floor(1+Math.random() * (this.blocksY-2)) }
	
	cssCoords(xpos, ypos) {
		return {
			left: this.blockCoord(this.isInZoneX(xpos)),
			top: this.blockCoord(this.isInZoneY(ypos))
		};
	}
	
	placeToTimerStack(cb, waitIterations) {
		let stackObj = null;
		
		if(waitIterations) stackObj = [cb, waitIterations, 0];
		else stackObj = cb;
		
		this.stack.push(stackObj);
	}
	
	timer() {
		if(!this.active) return false;
		
		setTimeout(function() {
			_.map(wormgame.stack, (stackObj, i) => {
				if(_.isArray(stackObj)) {
					let func = stackObj[0];
					let waitIt = stackObj[1];
					let currentIt = stackObj[2];
					
					if(currentIt >= waitIt) {
						func();
						wormgame.stack.splice(i,1);
					}
					stackObj[2]++;
				} else {
					stackObj();
				}
			});
			wormgame.timer();
		}, this.timeFlow);
	}
	
	timerStart() {
		this.active = true;
		this.timer();
	}
	
	timerStop() {
		this.active = false;
	}
}
wormgame = new WormGame();

class Worm {
	constructor(x, y) {
		if(wormgame.wormSpawned)
			return alert('Worm is already spawned!');
		
		let xpos = x || wormgame.randBlockX();
		let ypos = y || wormgame.randBlockY();
		
		this.active = false;
		this.sections = [];
		this.sections[0] = [xpos, ypos];
		
		this.spawn(this.sections[0]);
		
		wormgame.worm = this;
		wormgame.placeToTimerStack(wormgame.worm.move);
	}
	
	keyboardEvents() {
		$(document).on('keydown', function(e) {
			console.log(e);
			
		});
			if(e.which == 38 || e.which == 87) {
				e.preventDefault();
				
				wormgame.worm.changeDirection(0);
				return true;
			}
			
			if(e.which == 39 || e.which == 68) {
				e.preventDefault();
				
				wormgame.worm.changeDirection(1);
				return true;
			}
			
			if(e.which == 40 || e.which == 83) {
				e.preventDefault();
				
				wormgame.worm.changeDirection(2);
				return true;
			}
			
			if(e.which == 37 || e.which == 65) {
				e.preventDefault();
				
				wormgame.worm.changeDirection(3);
				return true;
			}
		});
	}
	
	spawn(coords, direction) {
		this.spawnHead(coords);
		this.spawnTail(direction);
		
		wormgame.wormSpawned = true;
	}
	
	spawnHead(coords) {
		let cssCoords = wormgame.cssCoords(coords[0], coords[1]);
		
		$('<div/>', {
			class: 'head section',
			css: cssCoords
		}).appendTo('#worm');
	}
	
	spawnSection(coords) {
		let cssCoords = wormgame.cssCoords(coords[0], coords[1]);
		
		$('<div/>', {
			class: 'section',
			css: cssCoords
		}).appendTo('#worm');
	}
	
	growTail() {
		let i = this.sections.length - 1;
		
		let tail1 = this.sections[i];
		let tail2 = this.sections[i-1];
		
		let coords = _.clone(tail1);
		
		if(tail1[0] != tail2[0]) {
			console.log('Placing on X');
			
			if(tail1[0] < tail2[0]) console.log('Negative');
			else console.log('Positive');
			
			if(tail1[0] < tail2[0]) coords[0]--;
			else coords[0]++;
		}
		
		if(tail1[1] != tail2[1]) {
			console.log('Placing on Y');
			
			if(tail1[1] < tail2[1]) console.log('Negative');
			else console.log('Positive');
			
			if(tail1[1] < tail2[1]) coords[1]--;
			else coords[1]++;
		}
		
		this.sections.push(coords);
		this.spawnSection(coords);
	}
	
	applySecCoords(i, coords) {
		$($('.section')[i]).css(
			wormgame.cssCoords(coords[0],coords[1])
		);
	}
	
	// 0 - up; 1 - right; 2 - down; 3 - left;
	spawnTail(direction) {
		let dir = direction || this.randDirection();
		
		let pos = this.tailCoords(dir);
		
		this.spawnSection(pos);
	}
	
	changeDirection(dir) {
		if(Math.abs(this.moveDirection - dir) == 2)
			return false;
		
		this.moveDirection = dir;
	}
	
	checkForFood() {
		let isAppleFound = wormgame.food.apple.coords[0] == this.sections[0][0] &&
			wormgame.food.apple.coords[1] == this.sections[0][1];
			
		let isOrangeFound = wormgame.food.orange.coords[0] == this.sections[0][0] &&
			wormgame.food.orange.coords[1] == this.sections[0][1];
		
		if(isAppleFound) {
			wormgame.food.removeApple();
			wormgame.food.spawn();
			this.growTail();
		} else if(isOrangeFound) {
			wormgame.food.removeOrange(true);
			this.growTail();
		}
	}
	
	checkForCollision() {
		let head = this.sections[0];
		
		for(var i=1; i<this.sections.length; i++) {
			let tail = this.sections[i];
			
			if(_.isEqual(head, tail)) return true;
		}
		
		return false;
	}
	
	move() {
		wormgame.worm.trailTail();
		wormgame.worm.moveHead();
		wormgame.worm.checkForFood();
	}
	
	moveHead() {
		let headCoords = _.clone(this.sections[0]);
		
		switch(this.moveDirection) {
			case 0: headCoords[1] = wormgame.isInZoneY(headCoords[1]-1); break;
			case 1: headCoords[0] = wormgame.isInZoneX(headCoords[0]+1); break;
			case 2: headCoords[1] = wormgame.isInZoneY(headCoords[1]+1); break;
			case 3: headCoords[0] = wormgame.isInZoneX(headCoords[0]-1);
		}
		
		console.log('Moving to', headCoords);
		this.applySecCoords(0, headCoords);
		
		this.sections[0] = headCoords;
		
		if(this.checkForCollision()) {
			wormgame.timerStop();
			alert('Столкновение! Игра провалена!');
		}
	}
	
	trailTail() {
		for(var i=this.sections.length-1; i>0; i--) {
			console.log('Moving', i);
			
			let newCoords = _.clone(this.sections[i-1]);
			this.sections[i] = newCoords;
			
			this.applySecCoords(i, newCoords);
		}
	}
	
	randDirection() {
		let dir = Math.floor(Math.random() * 3);
		this.moveDirection = dir;
		
		return dir;
	}
	
	tailCoords(direction) {
		let tailCoords = _.clone(this.sections[0]);
		
		switch(direction) {
			case 0: tailCoords[1]++; break;
			case 1: tailCoords[0]--; break;
			case 2: tailCoords[1]--; break;
			case 3: tailCoords[0]++;
		}
		
		this.sections[1] = tailCoords;
		
		return tailCoords;
	}
}

class Food {
	constructor() {
		this.apple = {};
		this.orange = {};
		
		this.orange.coords = [-1,-1];
	}
	
	spawn() {
		wormgame.food = this;
		
		if(this.isOrange()) {
			let coords = [
				wormgame.randBlockX(), wormgame.randBlockY()
			];
			
			this.spawnOrange(coords);
			
			this.orange.coords = coords;
		}
		
		let coords = [
			wormgame.randBlockX(), wormgame.randBlockY()
		];
		
		this.spawnApple(coords);
		
		this.apple.coords = coords;
	}
	
	removeApple() {
		$('.apple').remove();
		
		wormgame.addPoints(50);
	}
	
	removeOrange(eaten) {
		$('.orange').remove();
		
		wormgame.food.orange.coords = [];
		if(eaten) wormgame.addPoints(200);
	}
	
	spawnApple(coords) {
		let cssCoords = wormgame.cssCoords(coords[0], coords[1]);
		
		$('<div/>', {
			class: 'apple',
			css: cssCoords
		}).appendTo('#zone');
	}
	
	spawnOrange(coords) {
		let cssCoords = wormgame.cssCoords(coords[0], coords[1]);
		
		$('<div/>', {
			class: 'orange',
			css: cssCoords
		}).appendTo('#zone');
		
		this.orange.time = wormgame.bonusTime;
		
		wormgame.placeToTimerStack(
			wormgame.food.removeOrange,
			wormgame.bonusTime / wormgame.timeFlow
		);
	}
	
	isOrange() { return Math.random() <= wormgame.bonusChance }
}
var food = new Food();
