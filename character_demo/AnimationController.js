// this is a good idea: https://gist.github.com/rtpHarry/2d41811d04825935039dfc075116d0ad
// should have functions just for playing clips forwards and backwards

class AnimationController {

	mixer; // animation mixer
	clips; // all the clips for animation
	currState; // current state of character (action name)
	character; // a reference to the mesh that this controller belongs to
	timeDivisor; // number to divide the time by when updating (i.e. a smaller num == faster animation)

	constructor(character, animMixer, animClips, clock){
		this.character = character;
		this.mixer = animMixer;
		this.clips = animClips;
		this.clock = clock;
		this.currState = "";
		this.currActionTimescale = 1;
		
		// prep some actions' properties
		// i.e. some actions only need to play once, like draw/reload gun
		for(let action in this.clips){
			if(action !== "drawgun" && action !== "reloadgu"){
				this.mixer.clipAction(this.clips[action]).setLoop(THREE.LoopRepeat);
			}else{
				this.mixer.clipAction(this.clips[action]).paused = false;
				this.mixer.clipAction(this.clips[action]).setLoop(THREE.LoopOnce);
				this.mixer.clipAction(this.clips[action]).clampWhenFinished = true;
			}
		}
		
		// since we can equip a weapon,
		// makes sure the draw-weapon animation gets played first and then 
		// the corresponding idle animation is played directly after it
		// what if you want to equip while walking or running though? :/
		this.mixer.addEventListener('finished', (evt) => {
			if(evt.action._clip.name.indexOf("DrawGun") > -1){
				// draw gun then go to idle with gun
				// we just want to play the gun draw animation once
				this.timeDivisor = .60;
				if(this.currActionTimescale === 1){
					this.changeState('idlegu', 1);
				}else{
					// or put gun away and go to normal idle
					this.changeState('idle', 1);
				}
			}
		});
	}


	setUpdateTimeDivisor(num){
		this.timeDivisor = num;
	}
	
	changeState(newState, timeScale=1){
		// if a diff state or timescale is different
		if(newState !== this.currState || timeScale !== this.currActionTimescale){
			this.playAnimation(newState, this.clock.getDelta(), timeScale);
		}
	}
	
	// for now, keep it specific until I figure out what I'm doing
	// https://stackoverflow.com/questions/57255000/how-to-animate-2-objects-with-2-different-animations-one-after-another-in-3-js
	// possibly irrelevant but a good read nonetheless:
	// https://stackoverflow.com/questions/25417547/observer-pattern-vs-mediator-pattern
	playAnimation(state, time, timeScale){
		this.currActionTimescale = timeScale;
		this.mixer.stopAllAction();		
		
		let action = this.mixer.clipAction(this.clips[state]);
		
		// https://stackoverflow.com/questions/31274674/reverse-keyframe-animation-in-three-js
		if(action.time === 0 && timeScale === -1) {
			action.time = action.getClip().duration;
		}
		
		action.timeScale = timeScale;
		action.play();
		
		this.currState = state;
	}
	
	update(){
		this.mixer.update(this.clock.getDelta()/this.timeDivisor);
	}
	
}

export {
	AnimationController
}