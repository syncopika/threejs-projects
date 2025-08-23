// need to use post-processing!
// https://blog.maximeheckel.com/posts/post-processing-as-a-creative-medium/

const pixelShader = {
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
        uniform vec2 resolution;
        uniform sampler2D diffuse;
        uniform sampler2D depthTexture;
        
        void main() {
          vec2 desiredPixelSize = vec2(8, 8); // 8 x 8 pixel size
          vec2 normalizedPixelSize = desiredPixelSize / resolution;
          vec2 uvPixel = normalizedPixelSize * floor(vUv / normalizedPixelSize);
          vec4 color = texture2D(diffuse, uvPixel);
          
          float luma = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);
          vec2 cellUV = fract(vUv / normalizedPixelSize);
          
          float lineWidth = 0.0;
          
          if(luma > 0.0){
            lineWidth = 1.0;
          }
          
          if(luma > 0.3){
            lineWidth = 0.7;
          }
          
          if(luma > 0.5){
            lineWidth = 0.5;
          }
          
          if(luma > 0.7){
            lineWidth = 0.3;
          }
          
          if(luma > 0.99){
            lineWidth = 0.0;
          }
          
          float yStart = 0.05;
          float yEnd = 0.95;
          
          if(cellUV.y > yStart && cellUV.y < yEnd && cellUV.x > 0.0 && cellUV.x < lineWidth){
            //color = vec4(0.0, 0.0, 0.0, 1.0);
          }else{
            color = vec4(1.0, 1.0, 1.0, 1.0); //vec4(0.7, 0.74, 0.73, 1.0);
          }

          gl_FragColor = color;
        }
    `,
};