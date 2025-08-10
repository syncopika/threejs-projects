// https://tympanus.net/codrops/2022/11/29/sketchy-pencil-effect-with-three-js-post-processing/ - super helpful!
// https://discourse.threejs.org/t/how-to-render-full-outlines-as-a-post-process-tutorial/22674
// need to use post-processing!

// https://roystan.net/articles/outline-shader/ -> this one uses Unity and I had trouble trying to translate it to GLSL :(
// https://discussions.unity.com/t/_maintex_texelsize-whats-the-meaning/459729/2

// https://blog.maximeheckel.com/posts/beautiful-and-mind-bending-effects-with-webgl-render-targets/ - also cool!

const outlineShader = {
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

        float getDiffuseValueAtPoint(int x, int y) {
			vec2 point = vec2(x, y);
			vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);
			vec4 color = texture2D(diffuse, vUv + texel * point); // TODO: explain vUv + texel * point. I think part of it is texel * point would get us the actual texel coordinates that we want to analyze? maybe?
			return color.r; // TODO: explain why we only need/care about one color channel. maybe since we're doing an edge detection filter, all channels should probably be the same value? but also, there's no grayscaling or binarization going on?
        }

        float combinedSobelValue() {
            // kernel definition (in glsl matrices are filled in column-major order)
            const mat3 Gx = mat3(-1, -2, -1, 0, 0, 0, 1, 2, 1);// x direction kernel
            const mat3 Gy = mat3(-1, 0, 1, -2, 0, 2, -1, 0, 1);// y direction kernel

            // fetch the 3x3 neighborhood of the fragment
            // first column
            float tx0y0 = getDiffuseValueAtPoint(-1, -1);
            float tx0y1 = getDiffuseValueAtPoint(-1, 0);
            float tx0y2 = getDiffuseValueAtPoint(-1, 1);

            // second column
            float tx1y0 = getDiffuseValueAtPoint(0, -1);
            float tx1y1 = getDiffuseValueAtPoint(0, 0);
            float tx1y2 = getDiffuseValueAtPoint(0, 1);

            // third column
            float tx2y0 = getDiffuseValueAtPoint(1, -1);
            float tx2y1 = getDiffuseValueAtPoint(1, 0);
            float tx2y2 = getDiffuseValueAtPoint(1, 1);

            // gradient value in x direction
            float valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
            Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
            Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;

            // gradient value in y direction
            float valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
            Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
            Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;

            // magnitude of the total gradient
            float G = (valueGx * valueGx) + (valueGy * valueGy);
            return clamp(G, 0.0, 1.0);
        }
        
        void main() {
          float sobelValue = combinedSobelValue();
          sobelValue = smoothstep(0.01, 0.03, sobelValue);

          vec4 lineColor = vec4(0.3, 0.3, 0.3, 1.0);

          if (sobelValue > 0.1) {
              gl_FragColor = lineColor;
          } else {
              gl_FragColor = vec4(1.0);
          }
        }
    `,
};