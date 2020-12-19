# character demo    
    
For this project I wanted to explore character movement!    
    
## notes:    
    
1. terrain adjustment    
Based on the character's current elevation relative to "ground" level, the character's y-position will change so it's always on the terrain properly. To do this I assumed an initial height as a baseline value for being leveled with
the ground. I placed a 'dummy' object (a small green cube) placed in the middle of the character at a height around where the head is. In each update call, a raycast is made downwards from the 'dummy' object to the ground mesh and the distance is compared with the initial baseline distance.
If the current distance is lower than the initial distance, then the character is on higher elevation and its y-position needs to be increased and vice-versa if the current distance is greater.        
This link is extremely helpful: https://docs.panda3d.org/1.10/python/programming/pandai/pathfinding/uneven-terrain    
    
2. weapon attachment
Attaching a weapon is fairly straight-forward. I just attached the weapon mesh to one of the hand bones in my character mesh as a child. It was a bit difficult to position the weapon though in the hand since it seemed
the coordinate system of the weapon was different.     
    
3. added an animation controller
Animating with several actions and managing them became a bit difficult quickly without having an additional object to help.    