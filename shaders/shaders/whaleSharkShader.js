const whaleSharkShader = {
  vertexShader: `
        varying vec2 vUv;
        uniform float u_time;
    
        void main() {
            vUv = uv;
            
            gl_Position = projectionMatrix *
                          modelViewMatrix *
                          vec4(position, 1.0);
        }
    `,
    
  fragShader: `
        varying vec2 vUv;
        uniform sampler2D img;
        uniform float u_time;
        uniform vec2 u_resolution; // dimensions of renderer
        
        float rand(vec2 pos){
            return fract(sin(dot(pos, vec2(12.9898,78.233)))*43758.5453123);
        }
        
        void main() {
            vec2 pt = gl_FragCoord.xy/u_resolution.xy;
            
            vec4 txColor = texture2D(img, vUv);
            
            // color only certain parts of the shark!
            if(txColor.r < 0.5 && txColor.g < 0.5 && txColor.b < 0.5){
                gl_FragColor = vec4(txColor.rgb, 1.0);
            }else{
                gl_FragColor = vec4(
                    1.-txColor.r*abs(sin(0.2*u_time))*rand(pt), // rand(pt) adds some noise
                    1.-txColor.g*abs(cos(u_time))*rand(pt),
                    1.- txColor.b*abs(sin(0.1*u_time)), 
                    1.0);
            }
        }
    `,
};