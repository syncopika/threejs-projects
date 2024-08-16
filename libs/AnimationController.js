// this is a good idea: https://gist.github.com/rtpHarry/2d41811d04825935039dfc075116d0ad
// should have functions just for playing clips forwards and backwards

class AnimationController {

  mixer; // animation mixer
  clips; // all the clips for animation
  currState; // the state of character i.e. weapon equip or not
  character; // a reference to the mesh that this controller belongs to
  timeDivisor; // number to divide the time by when updating (i.e. a smaller num == faster animation)
  animationMap; // for knowing which actions correspond to which states
  topAnimation;
  bottomAnimation;

  constructor(character, animMixer, animClips, clock){
    this.character = character;
    this.mixer = animMixer;
    this.clips = animClips;
    this.clock = clock;
    this.currState = "";
    this.currActionTimescale = 1;
    this.animationMap = null;
    
    // separate character model animations based on area they affect
    this.topAnimation = null;
    this.bottomAnimation = null;
        
    this.objects = []; // objects that should have visibility turned on/off at some point
        
    fetch('animation_state_map.json')
      .then(response => response.json())
      .then(data => {
        this.animationMap = data.states;
                
        // modify some clips as needed according to the animation map
        for(const state in data.states){
          for(const action in data.states[state]){
            const actionParams = data.states[state][action];
            const actionClip = this.mixer.clipAction(this.clips[actionParams.actionName]);
            if(actionParams.loop === 'once'){
              actionClip.paused = false;
              actionClip.setLoop(THREE.LoopOnce);
            }
          }
        }
      });
        
    // since we can equip a weapon,
    // makes sure the draw-weapon animation gets played first and then 
    // the corresponding idle animation is played directly after it
    // what if you want to equip while walking or running though? :/
    // TODO: how bout running a promise that'll switch back to the idle animation
    // after equip if finished?
    this.mixer.addEventListener('finished', (evt) => {
      if(evt.action._clip.name.indexOf('DrawGunArmsOnly') > -1){
        if(this.currActionTimescale === -1){
          // de-equip == this animation played backwards
          // hide the weapon when de-equipping
          this.toggleObjectVisibility();
        }
        // draw gun then go to idle with gun
        // we just want to play the gun draw animation once
        this.timeDivisor = .60;
        this.changeAction('idle-arms', 'top', 1);
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
  
  needToChangeAction(actionName, location){
    if(location === "top" && this.topAnimation){
      return actionName !== this.topAnimation.name;
    }else if(location === "bottom" && this.bottomAnimation){
      return actionName !== this.bottomAnimation.name;
    }else if(location === "top" && !this.topAnimation){
      return true;
    }else if(location === "bottom" && !this.bottomAnimation){
      return true;
    }
    return false;
  }
    
  changeAction(newAction, location, timeScale=1){
    // if a diff state or timescale is different
    if(this.needToChangeAction(newAction, location) || timeScale !== this.currActionTimescale){
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
      
      const action = this.mixer.clipAction(this.clips[this.animationMap[this.currState][actionToPlay].actionName]);
      
      if(action.time === 0 && timeScale === -1) {
        action.time = action.getClip().duration;
      }
      
      const actionParams = this.animationMap[this.currState][actionToPlay];
      
      if(actionParams.top){
        if(this.topAnimation) this.topAnimation.action.stop();
        this.topAnimation = {action, name: actionToPlay};
      }else if(actionParams.bottom){
        if(this.bottomAnimation) this.bottomAnimation.action.stop();
        this.bottomAnimation = {action, name: actionToPlay};
      }
      
      action.timeScale = timeScale;
      action.play();
    }
  }
    
  update(){
    this.mixer.update(this.clock.getDelta() / this.timeDivisor);
  }
    
}

export {
  AnimationController
};