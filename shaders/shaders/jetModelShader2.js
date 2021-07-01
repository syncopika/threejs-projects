// PPBS - per-pixel blinn-phong shading
// currently not working correctly

const jetModelShader2 = {
	vertexShader: `
		uniform vec4 lightPosition[1]; // 1 light source
		uniform vec3 diffuseLight[1];  // the diffuse light color for each source 
		uniform vec3 specularLight[1];
		
		out vec3 radianceDiffuse[1];
		out vec3 radianceSpecular[1];
		out vec4 direction[1];
		out vec4 halfVectors[1];
		out vec4 norm;
		varying vec2 vUv;
		
		void main() {
			vUv = uv;
			
			vec4 vertexPos = modelViewMatrix * vec4(position, 1.0);
			vec4 viewPos = normalize(-modelViewMatrix * vec4(position, 1.0));
			
			vec4 dir = normalize(lightPosition[0] - vertexPos);
			direction[0] = dir;
		
			// calculate halfway vector 
			vec4 halfVector = normalize(dir + viewPos);
			halfVectors[0] = halfVector;
			
			// calculate radiance contribution from each light source
			float distance = length(lightPosition[0] - vertexPos);
			float scalar = 8.0 / (distance * distance);
			
			radianceDiffuse[0] = scalar * diffuseLight[0];
			radianceSpecular[0] = scalar * specularLight[0];
			
			norm = vec4(normal, 0);
			
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
		uniform mat4 modelview;
		uniform vec3 specularLight[1];

		// variables passed in from the vertex shader
		in vec3 radianceDiffuse[1];
		in vec3 radianceSpecular[1];
		in vec4 direction[1]; // light direction
		in vec4 halfVectors[1];
		in vec4 norm;
		varying vec2 vUv;
		
		void main() {
			vec4 color = texture2D(img, vUv);
			
			// calculate ndotl here 
			float ndotl = max(dot(modelview * norm, direction[0]), 0.);
			
			// calculate specular contribution via (halfVector*normal)^shininess
			float specular = pow(max(dot(halfVectors[0], modelview * norm), 0.), shininess);
			
			vec4 diff = ndotl * vec4(radianceDiffuse[0],0) * vec4(.3,.3,.3,0);
			vec4 spec =  specular * vec4(radianceSpecular[0],0) * vec4(.3,.3,.3,0);
			color = color + diff + spec;
			
			gl_FragColor = vec4(
				color.x,
				color.y,
				color.z,
				1.0
			);
		}
	`,
};