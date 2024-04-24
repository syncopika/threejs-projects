// javascript keyboard
// for mobile use

class JSKeyboard {
  constructor(container){
    // if keyboard already exists, do nothing
    if(document.getElementById('keyboard')) return;
    
    this.createKeyboard(container);
  }
  
  createKeyboard(containerElement){
    const keyboard = document.createElement('div');
    keyboard.id = 'keyboard';
    keyboard.style.display = 'flex';
    keyboard.style.flexDirection = 'row';
    keyboard.style.flexWrap = 'wrap';
    keyboard.style.position = 'absolute';
    keyboard.style.height = '5vh';
    keyboard.style.bottom = '0';
    keyboard.style.left = '0';
    keyboard.style.right = '0';
    keyboard.style.borderTop = '1px solid #000';
    keyboard.style.backgroundColor = '#fff';
    
    const keys = {
      'W': 87,
      'A': 65,
      'S': 83,
      'D': 68,
      'Q': 81,
      'E': 69,
      'G': 71,
      'J': 74,
    };
    
    Object.keys(keys).forEach(key => {
      const newKey = document.createElement('button');
      newKey.className = 'keyboard-key';
      newKey.style.border = '1px solid #000';
      newKey.style.borderRadius = '10px';
      newKey.style.padding = '10px';
      newKey.style.backgroundColor = '#ccc';
      newKey.style.margin = '2px';
      newKey.textContent = key;
      
      newKey.addEventListener('pointerdown', () => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
          'key': key.toLowerCase(), 
          'code': `Key${key}`,
          'keyCode': keys[key],
          'cancelable': true,
          'bubbles': true,
        }));
      });
      
      newKey.addEventListener('pointerup', () => {
        document.dispatchEvent(new KeyboardEvent('keyup', {
          'key': key.toLowerCase(), 
          'code': `Key${key}`,
          'keyCode': keys[key],
          'cancelable': true,
          'bubbles': true,
        }));
      });
      
      newKey.addEventListener('mouseover', () => {
        newKey.style.backgroundColor = '#fff';
      });
      
      newKey.addEventListener('mouseout', () => {
        newKey.style.backgroundColor = '#ccc';
      });
      
      keyboard.appendChild(newKey);
    });
    
    const hideKeyboard = document.createElement('button');
    hideKeyboard.className = 'keyboard-key';
    hideKeyboard.textContent = 'hide';
    hideKeyboard.addEventListener('click', () => {
      keyboard.parentNode.removeChild(keyboard);
    });
    keyboard.appendChild(hideKeyboard);
    
    containerElement.appendChild(keyboard);
  }
}