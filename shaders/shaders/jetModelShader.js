const jetModelShader = {
  vertexShader: `
        varying vec2 vUv;
        uniform float u_time;
    
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
        
        float rand(vec2 pos){
            return fract(sin(dot(pos, vec2(12.9898,78.233)))*43758.5453123);
        }
    
        void main() {
            vUv = uv;
            
            mat4 rotZ = getRotationMat(vec3(0, 0, 1), sin(0.5*u_time));
            
            float randVal = rand(uv);
            
            float xDelta = position.x*randVal*sin(0.8*u_time);
            float zDelta = position.z*randVal*cos(0.7*u_time);
            
            gl_Position = projectionMatrix *
                          modelViewMatrix *
                          rotZ *
                          vec4(position.x+xDelta, position.y, position.z+zDelta, 1.0);
        }
    `,
  fragShader: `
        varying vec2 vUv;
        uniform sampler2D img;
        uniform float u_time;
        uniform vec2 u_resolution; // dimensions of renderer
        
        float interpolate(float val){
            return clamp(smoothstep(0.2, 1.0, val), 0.3, 1.0); // let lowest possible val be 0.3
        }
        
        void main() {
            vec2 pt = gl_FragCoord.xy/u_resolution.xy;
            
            vec4 txColor = texture2D(img, vUv);
            
            gl_FragColor = vec4(
                interpolate(txColor.r*abs(sin(u_time))), 
                interpolate(txColor.g*abs(sin(u_time))), 
                interpolate(txColor.b*abs(sin(u_time))), 
                1.0);
        }
    `,
};