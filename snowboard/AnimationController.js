// animation controller for snowboard demo. this one is a bit different from the animation controller
// used for the character and fps demos since the snowboarder model utilizes full-body animations
// instead of half-body animations.

class AnimationController {

  mixer; // animation mixer
  clips; // all the clips for animation
  currAction; // current animation of character (action name) - rename to currAction
  currState; // the state of character e.g. object equip or not
  character; // a reference to the mesh that this controller belongs to
  timeDivisor; // number to divide the time by when updating (i.e. a smaller num == faster animation)
  animationMap; // for knowing which actions correspond to which states

  constructor(character, animMixer, animClips, clock){
    this.character = character;
    this.mixer = animMixer;
    this.clips = animClips;
    this.clock = clock;
    this.currAction = "";
    this.currState = "";
    this.currActionTimescale = 1;
    this.animationMap = null;
        
    fetch('animation_state_map.json')
      .then(response => response.json())
      .then(data => {
        this.animationMap = data.states;
        // modify some clips as needed according to the animation map
        for(const state in data.states){
          for(const action in data.states[state]){
            const actionParams = data.states[state][action];
            if(actionParams.loop === "once"){
              const actionClip = this.mixer.clipAction(this.clips[actionParams.actionName]);
              actionClip.paused = false;
              actionClip.setLoop(THREE.LoopOnce);
              actionClip.clampWhenFinished = true;
            }
          }
        }
      });
  }
    
  toggleObjectVisibility(){
    for(const obj of this.objects){
      obj.visible = !obj.visible;
    }
  }
    
  addObject(obj){
    this.objects.push(obj);
  }

  setUpdateTimeDivisor(num){
    this.timeDivisor = num;
  }
    
  changeState(newState){
    this.currState = newState;
  }
    
  changeAction(newAction, timeScale=1){
    // if a diff state or timescale is different
    if(newAction !== this.currAction || timeScale !== this.currActionTimescale){
      this.playAnimation(newAction, this.clock.getDelta(), timeScale);
    }
  }
    
  // for now, keep it specific until I figure out what I'm doing
  // https://stackoverflow.com/questions/57255000/how-to-animate-2-objects-with-2-different-animations-one-after-another-in-3-js
  // possibly irrelevant but a good read nonetheless:
  // https://stackoverflow.com/questions/25417547/observer-pattern-vs-mediator-pattern
  //
  // note that actionToPlay should be a generic action name like walk or run. 
  // the real animation clip name is derived below using this.animationMap and 
  // the current character state (i.e. normal (no weapon), weapon-equipped, etc.)
  playAnimation(actionToPlay, time, timeScale){
    if(this.animationMap){
      if(this.animationMap[this.currState][actionToPlay] === undefined){
        return;
      }
            
      this.currActionTimescale = timeScale;
      this.mixer.stopAllAction();
            
      this.currAction = actionToPlay;
      actionToPlay = this.animationMap[this.currState][actionToPlay]['actionName'];
            
      const action = this.mixer.clipAction(this.clips[actionToPlay]);
            
      // https://stackoverflow.com/questions/31274674/reverse-keyframe-animation-in-three-js
      if(action.time === 0 && timeScale === -1) {
        action.time = action.getClip().duration;
      }
            
      action.timeScale = timeScale;
      action.play();
    }
  }
 
  // https://discourse.threejs.org/t/animations-looks-different-and-wrong-when-i-play-them-on-three-js/55410/2
  update(clockDelta){
    this.mixer.update((clockDelta ? clockDelta : this.clock.getDelta()) / this.timeDivisor);
  }
    
}

export {
  AnimationController
};