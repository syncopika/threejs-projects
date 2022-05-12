# threejs-projects
small projects using three.js with stuff I made in Blender!    
see them here: https://syncopika.github.io/threejs-projects/    
    
## how to run:
If you have Python installed, `cd` into this repo after downloading and run `python -m http.server`. Then navigate to `http://localhost:8000/` and you should see a list of the projects!     
    
Otherwise, if you have Node.js and npm, you can use an Express server. `cd` into this repo after you have downloaded it and run `npm install`. Then run `node server.js` and open up a broswer and navigate to `http://localhost:3000/`.    
    
For convenience, I opted just to pull three.js from a CDN, which requires an internet connection anytime you want to open this project. Please keep that in mind when running locally.    
    
## acknowledgements:    
many thanks to 
- mr.doob for three.js and its associated libraries (e.g. TrackballControls, GLTFLoader) and all the people who have contributed to them
- Stefan Hedman for cannon.js
- Ronen Ness for partykals.js
- Jerome Etienne for threex.keyboardstate.js
- jbouny et al. for the water shader
- all the people who posted questions of StackOverflow + elsewhere and the authors of various blog posts that I referred to to make these things
    
## notes:
Each project directory also has a readme with some additional info.      
    
Thanks for visiting and checking this project out! Feel free to use any of my .gltf assets in your own projects as well if you want - no attribution necessary. If you spot any bugs, please feel free to create a new issue (would prefer no PRs at this time though, please and sorry!).    
    