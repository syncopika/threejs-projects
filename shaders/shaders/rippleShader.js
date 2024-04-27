// https://github.com/twostraws/ShaderKit/blob/main/Shaders/SHKCircleWaveBlended.fsh
// https://github.com/syncopika/music-visualizer/commit/e19ef49c5397e2a37332ca93cbff27ea2796d33f#diff-335967cf3a911f85b6f20eaedc439032b6722b9a81b0938d60d0cf6a18f94c7c

const rippleShader = {
  vertexShader: `
        out vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
  fragShader: `
        uniform float u_time;
        uniform vec2 u_resolution;
        
        in vec2 vUv;
        
        // ripple parameters
        uniform vec2 center;
        uniform vec4 color;
        uniform float speed;
        uniform float density;
        uniform float strength;
        uniform float brightness;
        
        void main() {
            vec2 pt = vUv.xy; //gl_FragCoord.xy/u_resolution.xy; -> this gets a fragment's position relative to viewport and not relative to mesh
            vec4 col = color;

            float waveSpeed = -(u_time * speed * 10.0);
            
            vec3 brightness = vec3(brightness);
            float pixelDist = distance(pt, center);
            
            if(pixelDist > 0.5){
                gl_FragColor = vec4(1.0, 1.0, 1.0, 0.0);
                return;
            }
            
            if(color.r == 1.0 && color.g == 1.0 && color.b == 1.0 && color.a == 0.0){
                gl_FragColor = vec4(1.0, 1.0, 1.0, 0.0);
                return;
            }
            
            vec3 gradientColor = vec3(color.r, color.g, color.b) * brightness;
            
            // we can tune the ripple to audio data! e.g.
            // set gradient color to be a function of the freq bin delta
            // if (freqBinDelta > 0) gradientColor *= freqBinDelta * 2.0;
            
            float colorStrength = pow(1.0 - pixelDist, 3.0);
            colorStrength *= strength;
            
            float waveDensity = density * pixelDist;
            float cosine = cos(waveSpeed + waveDensity);
            float cosAdjust = (0.5 * cosine) + 0.5;

            float lumi = colorStrength * (strength + cosAdjust);
            lumi *= 1.0 - (pixelDist * 2.0);
            lumi = max(0.0, lumi);

            vec3 newColor = gradientColor * lumi;
            vec4 final = vec4(newColor.r, newColor.g, newColor.b, lumi);
            vec4 finalColor = mix(col, final, lumi) * col.w;

            // make alpha be a function of distance from center
            finalColor.a = pixelDist / 4.0;
            
            gl_FragColor = finalColor;
            
        }
    `,
    
};