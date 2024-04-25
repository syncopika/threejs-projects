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
    keyboard.style.backgroundColor = '#fff';
    keyboard.style.justifyContent = 'center';
    
    const keys = {
      'W': 87,
      'S': 83,
      'A': 65,
      'D': 68,
      'Q': 81,
      'E': 69,
      'G': 71,
      'J': 74,
      'X': 88,
      '↑': 38,
      '↓': 40,
      '1': 49,
      '2': 50,
      'CapsLock': 20,
      'Space': 32,
    };
    
    Object.keys(keys).forEach(key => {
      const newKey = document.createElement('button');
      newKey.className = 'keyboard-key';
      newKey.style.border = '1px solid #000';
      newKey.style.borderRadius = '10px';
      newKey.style.padding = '10px';
      newKey.style.backgroundColor = '#ccc';
      newKey.style.margin = '3px';
      newKey.style.userSelect = 'none';
      newKey.textContent = key;
      
      newKey.oncontextmenu = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        return false;
      }
      
      newKey.addEventListener('pointerdown', (evt) => {
        newKey.style.backgroundColor = '#fff';
        evt.preventDefault();
        document.dispatchEvent(new KeyboardEvent('keydown', {
          'key': key.toLowerCase(), 
          'code': `Key${key}`,
          'keyCode': keys[key],
          'cancelable': true,
          'bubbles': true,
        }));
      });
      
      newKey.addEventListener('pointerup', (evt) => {
        newKey.style.backgroundColor = '#ccc';
        evt.preventDefault();
        document.dispatchEvent(new KeyboardEvent('keyup', {
          'key': key.toLowerCase(), 
          'code': `Key${key}`,
          'keyCode': keys[key],
          'cancelable': true,
          'bubbles': true,
        }));
      });
      
      keyboard.appendChild(newKey);
    });
    
    const hideKeyboard = document.createElement('button');
    hideKeyboard.className = 'keyboard-key';
    hideKeyboard.textContent = 'hide';
    hideKeyboard.style.margin = '3px';
    hideKeyboard.style.userSelect = 'none';
    hideKeyboard.style.border = '1px solid #000';
    hideKeyboard.style.borderRadius = '10px';
    hideKeyboard.addEventListener('click', () => {
      keyboard.parentNode.removeChild(keyboard);
    });
    keyboard.appendChild(hideKeyboard);
    
    containerElement.appendChild(keyboard);
  }
}