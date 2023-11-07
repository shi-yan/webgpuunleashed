// Vertex shader
    
@group(0) @binding(0)
var<uniform> modelView: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> projection: mat4x4<f32>;
@group(0) @binding(2)
var<uniform> normalMatrix: mat4x4<f32>;
@group(0) @binding(3) 
var<uniform> lightDirection: vec3<f32>;

const ambientColor:vec4<f32> = vec4<f32>(0.15, 0.10, 0.10, 1.0);
//const diffuseColor:vec4<f32> = vec4<f32>(0.55, 0.55, 0.55, 1.0);
const specularColor:vec4<f32> = vec4<f32>(1.0, 1.0, 1.0, 1.0);
const shininess:f32 = 20.0;        
const diffuseReflectionConstant:f32 = 1.0;
const specularReflectionConstant:f32 = 1.0;
const ambientReflectionConstant: f32 = 1.0;


fn specular(lightDir:vec3<f32>, viewDir:vec3<f32>, normal:vec3<f32>,  specularColor:vec3<f32>, 
     shininess:f32) -> vec3<f32> {
    let reflectDir:vec3<f32> = reflect(-lightDir, normal);
    let specDot:f32 = max(dot(reflectDir, viewDir), 0.0);
    return pow(specDot, shininess) * specularColor;
}

fn diffuse(lightDir:vec3<f32>, normal:vec3<f32>,  diffuseColor:vec3<f32>) -> vec3<f32>{
    return max(dot(lightDir, normal), 0.0) * diffuseColor;
}

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) viewDir: vec3<f32>,
    @location(1) normal: vec3<f32>,
    @location(2) lightDir: vec3<f32>,
    @location(3) color: vec3<f32>
};

@vertex
fn vs_main(
    @location(0) inPos: vec3<f32>,
    @location(1) inNormal: vec3<f32>,
    @location(2) offset: vec3<f32>,
    @location(3) color: vec3<f32>
) -> VertexOutput {
    var out: VertexOutput;

    out.viewDir = normalize((normalMatrix * vec4<f32>(-lightDirection, 0.0)).xyz);
    out.lightDir = out.viewDir;
    out.normal = normalize(normalMatrix * vec4<f32>(inNormal, 0.0)).xyz;  
    out.color = color;
    out.clip_position = projection * modelView * vec4<f32>(inPos + offset, 1.0);
    return out;
}

// Fragment shader

@fragment
fn fs_main(in: VertexOutput,   @builtin(front_facing) face: bool) -> @location(0) vec4<f32> {
    if (face) {
        var lightDir:vec3<f32> = in.lightDir;
        var n:vec3<f32> = normalize(in.normal);
        var viewDir: vec3<f32> = in.viewDir;

        var radiance:vec3<f32>  = ambientColor.rgb * ambientReflectionConstant + 
            diffuse(lightDir, n, in.color.rgb)* diffuseReflectionConstant +
            specular(lightDir, viewDir, n, specularColor.rgb, shininess) * specularReflectionConstant;
      
        return vec4<f32>(radiance ,1.0);
    } else {
        return vec4<f32>(0.0,1.0,0.0 ,1.0);
    }
}
