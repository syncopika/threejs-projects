// "glass" shader derived from my toon shader
// not that great atm but a starting point at least?
// needs refraction
//
// ideas and things to read:
// https://godotshaders.com/shader-tag/glass/
// https://kylehalladay.com/blog/tutorial/2014/02/18/Fresnel-Shaders-From-The-Ground-Up.html
// https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
// https://community.khronos.org/t/refraction-shader/60635

const glassShader = {
  vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float fresnel; // Fresnel factor
    
        void main() { 
            vUv = uv;
            vNormal = normal;
            gl_Position = projectionMatrix *
                          modelViewMatrix *
                          vec4(position, 1.0);
                          
            // calculate Fresnel factor
            vec3 I = normalize(gl_Position.xyz - cameraPosition); // we get cameraPosition for free! (https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram)
            fresnel = pow(1.0 + dot(I, normal), 3.5);
        }
    `,
    
  fragShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float fresnel;
        uniform sampler2D img;
        
        vec3 diffuseLightDir = vec3(1, 1, 0); // change?
        vec4 diffuseColor = vec4(1, 1, 1, 0.3);
        float diffuseIntensity = 1.5;
        
        void main() {
            float intensity = dot(normalize(diffuseLightDir), vNormal);
            if(intensity < 0.){
                intensity = 0.;
            }
            
            float alpha = 0.82; // for transparency
            
            vec4 txColor = vec4(1, 1, 1, 1) * diffuseColor * diffuseIntensity; // change color here
            
            if(intensity > 0.95){
                gl_FragColor = vec4(1, 1, 1, alpha) * vec4(txColor.rgba);
            }else if(intensity > 0.5){
                gl_FragColor = vec4(0.7, 0.7, 0.7, alpha) * vec4(txColor.rgba);
            }else if(intensity > 0.05){
                gl_FragColor = vec4(0.35, 0.35, 0.35, alpha) * vec4(txColor.rgba);
            }else{
                gl_FragColor = vec4(0.1, 0.1, 0.1, alpha) * vec4(txColor.rgba);
            }
            
            gl_FragColor = mix(txColor, gl_FragColor, fresnel);
        }
    `,
};