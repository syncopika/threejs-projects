// https://stackoverflow.com/questions/50363915/curve-rotation-in-glsl-fragment-shader
// https://riccardoscalco.it/blog/volume-ray-casting/
// https://stackoverflow.com/questions/9066836/opengl-point-sprites-rotation-in-fragment-shader
// https://math.stackexchange.com/questions/3360969/scale-rotate-skew-a-2d-shape-to-look-like-3d
// this one is pretty useful and minimal so it's easy to understand - https://www.shadertoy.com/view/fdB3Rh
// https://adrianb.io/2016/10/01/raymarching.html#fun-with-distance-fields - useful and helps explain stuff like opU()
// and of course Inigo Quilez's sdf primitives demo (but pretty complicated and hard to break down into easy-to-understand parts): https://www.shadertoy.com/view/Xds3zN

const raymarchShader = {
  vertexShader: `
        out vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    
  fragShader: `
        #define pi 3.141592653
        
        uniform float u_time;
        uniform vec2 u_resolution;
        
        in vec2 vUv;
        
        float sdfSphere(vec3 p, float s){
          return length(p)-s;
        }
        
        float sdfPlane(vec3 p){
            return p.y;
        }
        
        // union function to return the closest position - necessary when raymarching
        vec2 opU(vec2 d1, vec2 d2){
            return (d1.x < d2.x) ? d1 : d2;
        }
        
        // add all the objects in the scene
        vec2 assembleScene(vec3 p){
            // put shapes into position
            
            // sphere 1
            vec3 pos1 = p - vec3(-2., 0.3, 8.);
            pos1.x += 0.3*cos(u_time);
            pos1.z += 0.3*cos(u_time);
            pos1.y += sin(u_time);
            
            vec2 s1 = vec2(sdfSphere(pos1, 0.7), 0.);
            
            // sphere 2
            vec3 pos2 = p - vec3(2.5, 1.2, 20.);
            pos2.x += cos(u_time);
            pos2.y -= 0.8*sin(u_time);
            vec2 s2 = vec2(sdfSphere(pos2, 1.5), 0.);
            
            // add sphere 1 and 2
            vec2 ret = opU(s1, s2);
            
            // add some more spheres
            int numSpheres = 8;
            float radSlice = (360. / float(numSpheres)) * (3.14159 / 180.);
            for(float i = 0.; i < float(numSpheres); i++){
                vec3 pos = p - vec3(cos(i*radSlice), 0.5, 5.+sin(i*radSlice));
                
                pos.x += cos(i*radSlice+u_time);
                pos.z += cos(i*radSlice+u_time);
                pos.y += sin(radSlice+u_time);
                
                vec2 s = vec2(sdfSphere(pos, 0.2), 0.);
                
                ret = opU(s, ret);
            }
            
            //ret = opU(vec2(sdfPlane(p)), ret);
            
            return ret;
        }
        
        // https://www.shadertoy.com/view/Xds3zN
        vec3 generateNormal(vec3 p){
            vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
            return normalize( e.xyy*assembleScene( p + e.xyy ).x + 
                              e.yyx*assembleScene( p + e.yyx ).x + 
                              e.yxy*assembleScene( p + e.yxy ).x + 
                              e.xxx*assembleScene( p + e.xxx ).x );
        }
        
        // https://adrianb.io/2016/10/01/raymarching.html#fun-with-distance-fields
        // ro = ray origin
        // rd = ray direction
        vec3 raymarch(vec3 ro, vec3 rd){
            vec3 ret = vec3(1.);
            
            int maxSteps = 60;
            float currRayDist = 0.;
        
            for(int i = 0; i < maxSteps; i++){
                vec3 p = ro+rd*currRayDist;
                vec2 d = assembleScene(p);
                
                if(d.x < 0.0001){
                    vec3 n = generateNormal(p);
                    
                    // calculate color here (https://www.shadertoy.com/view/fdB3Rh)
                    vec3 lightPos = vec3(0.0, 0.0, 1.0);
                    //lightPos.xy += vec2(sin(u_time), cos(u_time)) * 2.;
                    vec3 l = normalize(lightPos - p);
                    float diff = clamp(dot(n, l), 0.0, 1.0);
                    
                    return vec3(0.9*abs(cos(u_time)), 0.9*abs(sin(u_time)), 0.9*abs(cos(u_time))) * diff;
                }
                
                currRayDist += d.x;
            }
            
            return ret;
        }
        
        
        void main() {
            vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y; // TODO: how to get frag coord relative to plane mesh and not canvas?
            
            vec3 ro = vec3(0, 1, 0);
            vec3 rd = normalize(vec3(st.x, st.y, 1));
            vec3 d = raymarch(ro, rd);

            gl_FragColor = vec4(d, 1.0);
        }
    `,
    
};