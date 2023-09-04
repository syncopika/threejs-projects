# fps   
### a small demo to explore some fps game mechanics    
     
![fps gif](03-09-2023_221142.gif)   
    
This demo is a bit of an extension/combo of `character_demo` and `basketball`. It uses cannon.js to help with projectile collisions (although for the player character I instead chose to handle collisions manually since I couldn't figure out how to get a rigidbody properly set up for it). It doesn't really do much atm but you can launch cows :).    
    
TODO:    
- improve player model (specifically figure out how to set up model for first-person vs third-person mode)
- be able to look around with mouse in first-person mode + be able to launch projectile in various directions (this might be restricted currently though by the humanoid model I'm using)
- be able to import any gltf model to use as projectile?
- get lighting/shadows better