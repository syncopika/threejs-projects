// non-post-processing water shader
// from https://github.com/0xhckr/ghostty-shaders/blob/main/water.glsl
//
// found this paper that might help give some insight into this algorithm:
// https://www.cs.umd.edu/~mount/Indep/Aharon_Turpie/final-rept.pdf

const waterShader = {
  vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
    
        void main() { 
            vUv = uv;
            vNormal = normal;
            gl_Position = projectionMatrix *
                          modelViewMatrix *
                          vec4(position, 1.0);
        }
    `,
    
  fragShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        uniform sampler2D diffuse;
        uniform float u_time;
        
        void main() {
          float tau = 6.28318530718; // where'd this value come from?
          int max_iter = 6;
          
          vec3 water_color = vec3(1.0, 1.0, 1.0) * 0.5;
          float time = u_time * 0.5 + 23.0; // ???
          
          vec2 p = mod(vUv * tau, tau) - 250.0; // wut
          vec2 i = vec2(p);
          float c = 1.0;
          float inten = 0.005;
          
          for(int n = 0; n < max_iter; n++){
            float t = time * (1.0 - (3.5 / float(n + 1)));
            i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
            c += 1.0 / length(vec2(p.x / (sin(i.x + t) / inten), p.y / (cos(i.y + t) / inten)));
          }
          
          c /= float(max_iter);
          c = 1.17 - pow(c, 1.4);
          
          vec3 color = vec3(pow(abs(c), 15.0)); // why 15?
          color = clamp((color + water_color) * 1.2, 0.0, 1.0);
          
          // perturb the uv based on value of c from caustic calc above
          vec2 tc = vec2(cos(c) - 0.75, sin(c) - 0.75) * 0.04;
          vec2 uv = clamp(vUv + tc, 0.0, 1.0);

          vec4 currColor = texture2D(diffuse, uv);

          /*
          if(currColor.a == 0.0){
            currColor = vec4(1.0, 1.0, 1.0, 1.0);
          }*/
          
          gl_FragColor = currColor * vec4(color, 1.0);
        }
    `,
};