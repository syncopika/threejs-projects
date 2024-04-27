const springyShardShader = {
  vertexShader: `
        uniform float u_time;
        
        attribute vec4 color;
        varying vec4 vColor;
        
        // https://thebookofshaders.com/10/
        float rand(vec2 pos){
            return fract(sin(dot(pos, vec2(12.9898,78.233)))*43758.5453123);
        }
        
        // http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/
        mat4 getRotationMat(vec3 axis, float angle){
            float s = sin(angle);
            float c = cos(angle);
            float oc = 1.0 - c;
            
            return mat4(
                oc*axis.x*axis.x + c,        oc*axis.x*axis.y - axis.z*s, oc*axis.z*axis.x + axis.y*s, 0.0,
                oc*axis.x*axis.y + axis.z*s, oc*axis.y*axis.y + c,        oc*axis.y*axis.z + axis.x*s, 0.0, 
                oc*axis.x*axis.z - axis.y*s, oc*axis.y*axis.z + axis.x*s, oc*axis.z*axis.z + c,         0.0,
                0.0,                         0.0,                         0.0,                         1.0
            );
        }
    
        void main() {
            vColor = color;
            
            float randVal = rand(vec2(position.xy));
            
            mat4 rotZ = getRotationMat(vec3(0,0,1), randVal*cos(u_time)); // rotate about the z axis
            
            // rotate and move the squares along the z axis
            gl_Position = projectionMatrix * modelViewMatrix * rotZ * vec4(position.x, position.y, (1.+randVal)*position.z*abs(cos(0.3*u_time)), 1.0);
        }
    `,
    
  fragShader: `
        uniform sampler2D img;
        uniform float u_time;
        uniform vec2 u_resolution; // dimensions of renderer canvas
        varying vec4 vColor;
        
        void main() {
            gl_FragColor = vec4(
            vColor.r*abs(cos(u_time))*1.3, 
            vColor.g*abs(sin(u_time))*1.6, 
            vColor.b*abs(cos(u_time))*1.2,
            1.0);
        }
    `,
};