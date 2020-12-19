# airshow    
    
For this project I wanted to make and fly some jets!    
    
## notes:    
    
1. rotating the plane
Had some issues with this. Placing the plane mesh in a THREE.Group object and rotating the mesh got me the current effect, which I think is good. 
However, I am unsure why rotating the plane mesh within a THREE.Group is different than rotating the mesh (or the group object) by itself relative to its own axis, as seen below:    
    
![bad rotation example](pictures/rotation-example.gif)    
    
2. takeoff and landing
For takeoff, the speed of the plane is increased exponentially (e^x via Math.exp()), which lookS fine to me visually. I also added a landing mode feature in which the plane descends at a constant speed while being parallel to the ground.    
    
3. jet engine exhaust/smoke
Used the partykals.js library by RonenNess (https://github.com/RonenNess/partykals)    