class AnimationController {

	mixer; // animation mixer
	clips; // all the clips for animation
	currState; // current state of character (action name)
	character; // a reference to the mesh that this controller belongs to

	constructor(character, animMixer, animClips, clock){
		this.character = character;
		this.mixer = animMixer;
		this.clips = animClips;
		this.clock = clock;
		
		// prep some actions' properties
		// i.e. some actions only need to play once, like draw gun
		this.mixer.clipAction(this.clips["drawgun"]).setLoop(THREE.LoopOnce);
		this.mixer.clipAction(this.clips["reloadgu"]).setLoop(THREE.LoopOnce);
		
		// since we can equip a weapon,
		// makes sure the draw-weapon animation gets played first and then 
		// the corresponding idle animation is played directly after it
		// what if you want to equip while walking or running though? :/
		this.mixer.addEventListener('finished', (evt) => {
			if(evt.action._clip.name.indexOf("DrawGun") > -1){
				// don't forget to correct the flow of the animation (i.e. forward or inverse).
			
				// draw gun then go to idle with gun
				// we just want to play the gun draw animation once
				if(this.mixer.timeScale === 1){
					playAnimation('idlegu', this.clock.getDelta());
				}else{
					// or put gun away and go to normal idle
					this.mixer.timeScale = 1;
					playAnimation('idle', this.clock.getDelta());
				}
			}
		});
	}


	
	_turnOffAllClips(){
		for(let action in this.clips){
			this.mixer.clipAction(this.clips[action]).stop();
		}
	}
	
	changeState(newState){
		if(newState !== this.currState){
			console.log("playing animation");
			this.playAnimation(newState, this.clock.getDelta());
		}
	}
	
	// for now, keep it specific until I figure out what I'm doing
	// https://stackoverflow.com/questions/57255000/how-to-animate-2-objects-with-2-different-animations-one-after-another-in-3-js
	// possibly relevant but a good read nonetheless:
	// https://stackoverflow.com/questions/25417547/observer-pattern-vs-mediator-pattern
	playAnimation(state, time){
		this._turnOffAllClips();
		
		if(this.currState === "idle" && state === "idlegu"){
			// draw gun then go to idle with gun
			// we just want to play the gun draw animation once
			let idleGunAction = this.mixer.clipAction(this.clips[state]);
			action.play();
			this.mixer.update(time/1.1);
		}else if(this.currState === "idlegu" && state === "idle"){
			// put gun away and go to normal idle
			this.mixer.timeScale = -1;
			let idleAction = this.mixer.clipAction(this.clips[state]);
			action.play();
			this.mixer.update(time/1.1);
		}else{
			console.log("playing: " + state);
			let action = this.mixer.clipAction(this.clips[state]);
			action.setLoop(THREE.LoopRepeat);
			action.play();
			//this.mixer.update(time/1.1);
		}
		
		this.currState = state;
	}
	
	update(){
		this.mixer.update(this.clock.getDelta()/0.85);
	}
	
	/*
	if(!state['isMoving']){
		if(state['movement'] === 'jump'){
			animationMixer.clipAction(animationClips['idle']).stop();
			animationMixer.clipAction(animationClips['walk']).stop();
			animationMixer.clipAction(animationClips['run']).stop();
			
			let jumpAction = animationMixer.clipAction(animationClips['jump']);
			jumpAction.setLoop(THREE.LoopRepeat);
			jumpAction.play();
			animationMixer.update(time/1.1);
			state['movement'] = 'idle';
		}else{
			animationMixer.timeScale = 1;
			
			let actions = Object.keys(animationClips);
			for(let i = 0; i < actions.length; i++){
				// stop all the non-idle motion clips
				if(actions[i] !== "idle"){
					animationMixer.clipAction(animationClips[actions[i]]).stop();
				}
			}

			let idleAction = animationMixer.clipAction(animationClips['idle']);
			idleAction.setLoop(THREE.LoopRepeat);
			idleAction.play();
			animationMixer.update(time/2.5);
		}
	}else{
	
		let movement = state['movement'];
		
		if(movement === 'walk'){
			// make sure idle and running is stopped 
			animationMixer.clipAction(animationClips['idle']).stop();
			animationMixer.clipAction(animationClips['run']).stop();
			animationMixer.clipAction(animationClips['jump']).stop();
			
			let walkAction = animationMixer.clipAction(animationClips['walk']);
			walkAction.setLoop(THREE.LoopRepeat);
			walkAction.play();
			animationMixer.update(time/1.5);
			
		}else if(movement === 'run'){
			// make sure idle and walking is stopped
			animationMixer.clipAction(animationClips['idle']).stop();
			animationMixer.clipAction(animationClips['walk']).stop();
			animationMixer.clipAction(animationClips['jump']).stop();
			
			let runAction = animationMixer.clipAction(animationClips['run']);
			runAction.setLoop(THREE.LoopRepeat);
			runAction.play();
			animationMixer.update(time/1.1);
		}
	}
	
	*/
	
}

export {
	AnimationController
}