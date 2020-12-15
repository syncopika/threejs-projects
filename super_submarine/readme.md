# super submarine    
    
you are a submarine tasked with some important objectives! you must disarm a dangerous capsule and recover some things from a sunken ship.   
       
## notes:    
    
1. rotating an object in a circle    
Did you notice how the whale shark swims in a circle and adjusts the direction its facing (it's not perfect but I think close enough).    
To do this, during each update call I place the whale shark at the center, rotate it, and place it at the next point of the circle it's swimming in.     
However, in terms of matrix multiplication, these steps need to be done backwards.    
    
2. shaders (TBD)    
the water