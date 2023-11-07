    // Vertex shader
    
    @group(0) @binding(0)
    var<uniform> modelView: mat4x4<f32>;
    @group(0) @binding(1)
    var<uniform> projection: mat4x4<f32>;
    
    struct VertexOutput {
        @builtin(position) clip_position: vec4<f32>,
    };

    fn fromRotation(axis:vec3<f32>, rad:f32) -> mat4x4<f32> {
    var x:f32 = axis[0];
    var y:f32 = axis[1];
    var z:f32 = axis[2];

    var len:f32 = sqrt(x * x + y * y + z * z);
    var s:f32 = 0.0;
    var c:f32 = 0.0;
    var t:f32 = 0.0;

    if (len < 0.0001) {
        return mat4x4<f32>(1.0, 0.0,0.0,0.0, 0.0,1.0,0.0,0.0, 0.0, 0.0,1.0,0.0, 0.0,0.0,0.0,1.0);
    }

    len = 1.0 / len;
    x *= len;
    y *= len;
    z *= len;

    s = sin(rad);
    c = cos(rad);
    t = 1 - c;
    return mat4x4<f32>(
        x * x * t + c,
        y * x * t + z * s,
        z * x * t - y * s,
        0.0,
        x * y * t - z * s,
        y * y * t + c,
        z * y * t + x * s,
        0.0,
        x * z * t + y * s,
        y * z * t - x * s,
        z * z * t + c,
        0.0,
        0.0,
        0.0,
        0.0,
        1.0
    );
}

    
    @vertex
    fn vs_main(
        @location(0) inPos: vec3<f32>,
        @location(1) offset: vec3<f32>,
        @location(2) dir: vec3<f32>,
        @location(3) scale: f32
    ) -> VertexOutput {
        var out: VertexOutput;
    let axis:vec3<f32> = normalize( cross(vec3<f32>(0.0, 0.0, 1.0), dir));
    let dot = dot(vec3<f32>(0.0, 0.0, 1.0), normalize(dir));
    let tr:mat4x4<f32> = fromRotation(axis, acos(dot));
    
        var wldLoc:vec4<f32> = modelView * (tr* vec4<f32>(inPos * scale, 1.0) + vec4(offset, 0.0));
        out.clip_position = projection * wldLoc;
       
        return out;
    }
    
    // Fragment shader
    @fragment
    fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
        return vec4<f32>(1.0,1.0,0.0,1.0);
    }