    // Vertex shader
    
    @group(0) @binding(0)
    var<uniform> modelView: mat4x4<f32>;
    @group(0) @binding(1)
    var<uniform> projection: mat4x4<f32>;
    @group(0) @binding(2)
    var<uniform> transformation: mat4x4<f32>;
    
    struct VertexOutput {
        @builtin(position) clip_position: vec4<f32>,
    };
    
    @vertex
    fn vs_main(
        @location(0) inPos: vec3<f32>
    ) -> VertexOutput {
        var out: VertexOutput;
    
        var wldLoc:vec4<f32> = modelView * transformation * vec4<f32>(inPos, 1.0);
        out.clip_position = projection * wldLoc;
       
        return out;
    }
    
    // Fragment shader
    @group(0) @binding(3)
    var<uniform> color: vec3<f32>;
    @fragment
    fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
        return vec4<f32>(color.xyz,0.5);
    }