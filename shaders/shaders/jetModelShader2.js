// PPBS - per-pixel blinn-phong shading

const jetModelShader2 = {
  vertexShader: `
        uniform vec4 lightPosition[1];

        out vec4 direction[1];
        out vec4 halfVectors[1];
        out vec4 norm;
        out vec2 vUv;
        
        void main() {
            vUv = uv;
            
            vec4 vertexPos = modelViewMatrix * vec4(position, 1.0);
            vec4 viewPos = normalize(-vertexPos);
            
            vec4 dir = normalize(lightPosition[0] - vertexPos);
            direction[0] = dir;
        
            // calculate halfway vector 
            vec4 halfVector = normalize(dir + viewPos);
            halfVectors[0] = halfVector;
            
            norm = vec4((normalMatrix * normal), 0); // normalMatrix comes for free
            
            gl_Position = projectionMatrix *
                          modelViewMatrix *
                          vec4(position, 1.0);
        }
    `,
    
  fragShader: `
        uniform sampler2D img;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform float shininess;
        uniform vec3 diffuseLight[1];
        uniform vec3 specularLight[1];
        uniform vec4 lightIntensity[1];

        // variables passed in from the vertex shader
        in vec4 direction[1]; // light direction
        in vec4 halfVectors[1];
        in vec4 norm;        
        in vec2 vUv;
        
        void main() {
            vec4 color = texture2D(img, vUv);
            
            // calculate ndotl (normal dot light direction) here 
            float ndotl = max(dot(norm, direction[0]), 0.);
            
            // calculate specular contribution via (halfVector*normal)^shininess
            float specular = pow(max(dot(halfVectors[0], norm), 0.), shininess);
            
            vec4 diff = ndotl * vec4(diffuseLight[0], 0);
            vec4 spec =  specular * vec4(specularLight[0], 0);
            color = (lightIntensity[0] * (diff + spec + color));
            
            gl_FragColor = color;
        }
    `,
    
};