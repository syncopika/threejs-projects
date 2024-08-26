// http://rbwhitaker.wikidot.com/toon-shader

const toonShader = {
  vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        // toon shader properties
        //vec4 lineColor = vec4(0, 0, 0, 1);
        //float lineThickness = .03;
        
        // TODO: need to add outline
        // do I need to add a separate pass shader?
    
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
        uniform sampler2D img;
        
        vec3 diffuseLightDir = vec3(1, 1, 0); // change?
        vec4 diffuseColor = vec4(1, 1, 1, 1);
        float diffuseIntensity = 1.5;
        
        void main() {
            float intensity = dot(normalize(diffuseLightDir), vNormal);
            if(intensity < 0.){
                intensity = 0.;
            }
            
            vec4 txColor = vec4(0, 0, 1, 1.0) * diffuseColor * diffuseIntensity; // some shade of blue
            
            if(intensity > 0.95){
                gl_FragColor = vec4(1, 1, 1, 1.0) * vec4(txColor.rgb, 1.0);
            }else if(intensity > 0.5){
                gl_FragColor = vec4(0.7, 0.7, 0.7, 1.0) * vec4(txColor.rgb, 1.0);
            }else if(intensity > 0.05){
                gl_FragColor = vec4(0.35, 0.35, 0.35, 1.0) * vec4(txColor.rgb, 1.0);
            }else{
                gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0) * vec4(txColor.rgb, 1.0);
            }
        }
    `,
};