// this is a good idea: https://gist.github.com/rtpHarry/2d41811d04825935039dfc075116d0ad
// should have functions just for playing clips forwards and backwards

class AnimationController {

  mixer; // animation mixer
  clips; // all the clips for animation
  currAction; // current animation of character (action name) - rename to currAction
  currState; // the state of character i.e. weapon equip or not
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
        
    this.objects = []; // objects that should have visibility turned on/off at some point
        
    fetch('animation_state_map.json')
      .then(response => response.json())
      .then(data => {
        this.animationMap = data.states;
                
        // modify some clips as needed according to the animation map
        for(const state in data.states){
          for(const action in data.states[state]){
            if(
              data.states[state][action].top &&
              data.states[state][action].bottom
            ){
              for(let prop in data.states[state][action]){
                const actionParams = data.states[state][action][prop];
                if(actionParams.loop === "once"){
                  const actionClip = this.mixer.clipAction(this.clips[actionParams.actionName]);
                  actionClip.paused = false;
                  actionClip.setLoop(THREE.LoopOnce);
                }
              }
            }else{
              const actionParams = data.states[state][action];
              if(actionParams.loop === "once"){
                const actionClip = this.mixer.clipAction(this.clips[actionParams.actionName]);
                actionClip.paused = false;
                actionClip.setLoop(THREE.LoopOnce);
              }
            }
          }
        }
      });
        
    // since we can equip a weapon,
    // makes sure the draw-weapon animation gets played first and then 
    // the corresponding idle animation is played directly after it
    // what if you want to equip while walking or running though? :/
    this.mixer.addEventListener('finished', (evt) => {
      if(evt.action._clip.name.indexOf("DrawGun") > -1){
        if(this.currActionTimescale === -1){
          // de-equip == this animation played backwards
          // hide the weapon when de-equipping
          this.toggleObjectVisibility();
        }
                
        // draw gun then go to idle with gun
        // we just want to play the gun draw animation once
        this.timeDivisor = .60;
        this.changeAction('idle', 1);
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
      
      if(
        this.animationMap[this.currState][actionToPlay].top &&
        this.animationMap[this.currState][actionToPlay].bottom
      ){
        // we want to play 2 animations simultaneously (e.g. 2 separate animations
        // that control the upper and lower body of the player)
        const topAnim = this.animationMap[this.currState][actionToPlay].top.actionName;
        const bottomAnim = this.animationMap[this.currState][actionToPlay].bottom.actionName;
        
        [topAnim, bottomAnim].forEach(anim => {
          // clipAction returns an AnimationAction
          const action = this.mixer.clipAction(this.clips[anim]);
                
          // https://stackoverflow.com/questions/31274674/reverse-keyframe-animation-in-three-js
          if(action.time === 0 && timeScale === -1) {
            action.time = action.getClip().duration;
          }
                
          action.timeScale = timeScale;
          action.play();
        });
      }else{
        actionToPlay = this.animationMap[this.currState][actionToPlay]['actionName'];
        
        const action = this.mixer.clipAction(this.clips[actionToPlay]);
        
        if(action.time === 0 && timeScale === -1) {
          action.time = action.getClip().duration;
        }
              
        action.timeScale = timeScale;
        action.play();
      }
    }
  }
    
  update(){
    this.mixer.update(this.clock.getDelta()/this.timeDivisor);
  }
    
}

export {
  AnimationController
};