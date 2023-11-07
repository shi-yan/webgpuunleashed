class Axis {
    constructor() {
        this.pipeline = null;
        this.positionBuffer = null;
        this.uniformBindGroupX = null;
        this.uniformBindGroupY = null;
        this.uniformBindGroupZ = null;
    }

    async setup(device, modelViewMatrixUniformBuffer, projectionMatrixUniformBuffer) {
        let shaderModule = await shaderModuleFromUrl(device, '../shader/axis_shader.wgsl');
        const sectionCount = 10;
        const radius = 0.1;

        let positions = [];

        for (let i = 0; i < sectionCount + 1; ++i) {
            let angle = 2.0 * Math.PI * i / sectionCount;

            let x = Math.cos(angle) * radius;
            let y = Math.sin(angle) * radius;

            positions.push(...[x, y, 0]);
            positions.push(...[x, y, 20]);
        }

        positions = new Float32Array(positions);

        this.positionBuffer = createGPUBuffer(device, positions, GPUBufferUsage.VERTEX);

        let uniformBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                }
            ]
        });

        let redUniformBuffer = createGPUBuffer(device, new Float32Array([1.0, 0.0, 0.0]), GPUBufferUsage.UNIFORM);
        let greenUniformBuffer = createGPUBuffer(device, new Float32Array([0.0, 1.0, 0.0]), GPUBufferUsage.UNIFORM);
        let blueUniformBuffer = createGPUBuffer(device, new Float32Array([0.0, 0.0, 1.0]), GPUBufferUsage.UNIFORM);

        const transformationForX = glMatrix.mat4.fromRotation(glMatrix.mat4.create(), Math.PI * 0.5, glMatrix.vec3.fromValues(0.0, 1.0, 0.0));

        const transformationForXUniform = createGPUBuffer(device, transformationForX, GPUBufferUsage.UNIFORM);

        const transformationForY = glMatrix.mat4.fromRotation(glMatrix.mat4.create(), -Math.PI * 0.5, glMatrix.vec3.fromValues(1.0, 0.0, 0.0));

        const transformationForYUniform = createGPUBuffer(device, transformationForY, GPUBufferUsage.UNIFORM);

        const transformationForZ = glMatrix.mat4.create();

        const transformationForZUniform = createGPUBuffer(device, transformationForZ, GPUBufferUsage.UNIFORM);

        this.uniformBindGroupX = device.createBindGroup({
            layout: uniformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: modelViewMatrixUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: projectionMatrixUniformBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: transformationForXUniform
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: greenUniformBuffer
                    }
                }
            ]
        });

        this.uniformBindGroupY = device.createBindGroup({
            layout: uniformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: modelViewMatrixUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: projectionMatrixUniformBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: transformationForYUniform
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: blueUniformBuffer
                    }
                }
            ]
        });

        this.uniformBindGroupZ = device.createBindGroup({
            layout: uniformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: modelViewMatrixUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: projectionMatrixUniformBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: transformationForZUniform
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: redUniformBuffer
                    }
                }
            ]
        });

        const positionAttribDesc = {
            shaderLocation: 0, // @location(0)
            offset: 0,
            format: 'float32x3'
        };

        const positionBufferLayoutDesc = {
            attributes: [positionAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };

        const pipelineLayoutDesc = { bindGroupLayouts: [uniformBindGroupLayout] };
        const layout = device.createPipelineLayout(pipelineLayoutDesc);

        const colorState = {
            format: 'bgra8unorm',
            blend: {
                alpha: {
                    operation: "add",
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src',
                },
                color: {
                    operation: "add",
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src',
                }
            }
        };

        const pipelineDesc = {
            layout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [positionBufferLayoutDesc]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [colorState]
            },
            primitive: {
                topology: 'triangle-strip',
                frontFace: 'ccw',
                cullMode: 'none'
            }
        };

        this.pipeline = device.createRenderPipeline(pipelineDesc);
    }

    encode(encoder) {
        encoder.setPipeline(this.pipeline);
        encoder.setVertexBuffer(0, this.positionBuffer);
        encoder.setBindGroup(0, this.uniformBindGroupX);
        encoder.draw(20, 1);
        encoder.setBindGroup(0, this.uniformBindGroupY);
        encoder.draw(20, 1);
        encoder.setBindGroup(0, this.uniformBindGroupZ);
        encoder.draw(20, 1);
    }
}


class Arrow {
    constructor() {
        this.pipeline = null;
        this.pipeline2 = null;
        this.positionBuffer1 = null;
        this.positionBuffer2 = null;
        this.uniformBindGroupLayout = null;
        this.arrows = new Map();
        this.currentId = 0;
        this.uniformBindGroup = null;
        this.transformationUniformBuffer = null;
        this.instanceDataBuffer = null;
    }

    removeArrow(id) {
        if (id !== null && id !== undefined && this.arrows.has(id)) {
            this.arrows.delete(id);
        }
    }

    upsertArrow(id, pos, dir, color) {
        let assignedId = this.currentId;
        if (id !== null && id !== undefined && this.arrows.has(id)) {
            assignedId = id;
        }
        else {
            this.currentId++;
        }

        this.arrows.set(assignedId, { pos, dir, color });
        return assignedId;
    }

    refreshBuffer(device) {
        if (this.instanceDataBuffer) {
            this.instanceDataBuffer.destroy();
        }
        let instanceData = [];

        for (let value of this.arrows.values()) {
            instanceData.push(value.pos[0]);
            instanceData.push(value.pos[1]);
            instanceData.push(value.pos[2]);

            instanceData.push(value.dir[0]);
            instanceData.push(value.dir[1]);
            instanceData.push(value.dir[2]);

            instanceData.push(value.color[0]);
            instanceData.push(value.color[1]);
            instanceData.push(value.color[2]);
        }

        this.instanceDataBuffer = createGPUBuffer(device, new Float32Array(instanceData), GPUBufferUsage.VERTEX);
    }

    async setup(device, modelViewMatrixUniformBuffer, projectionMatrixUniformBuffer, normalMatrixUniformBuffer, viewDirectionUniformBuffer) {
        let shaderModule = await shaderModuleFromUrl(device, '../shader/arrow_shader.wgsl');

        let positionBuffer1 = [];
        const radius = 0.1;

        for (let i = 0; i < 10 + 1; ++i) {
            const angle = i * 2.0 * Math.PI / 10;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            positionBuffer1.push(...[x, y, 1.0]);
            positionBuffer1.push(...[x, y, 0.0]);

            positionBuffer1.push(...[x, y, 0.0]);
            positionBuffer1.push(...[x, y, 0.0]);

        }

        positionBuffer1 = new Float32Array(positionBuffer1);

        let positionBuffer2 = [];

        for (let i = 0; i < 10; ++i) {
            const angle = i * 2.0 * Math.PI / 10;
            const angleNext = (i + 1) * 2.0 * Math.PI / 10;
            const angleMiddle = (i + 0.5) * 2.0 * Math.PI / 10;

            const xS = Math.cos(angle) * radius;
            const yS = Math.sin(angle) * radius;

            const xSN = Math.cos(angleNext) * radius;
            const ySN = Math.sin(angleNext) * radius;

            const xL = xS * 2.0;
            const yL = yS * 2.0;

            const xLM = Math.cos(angleMiddle) * radius * 2.0;
            const yLM = Math.sin(angleMiddle) * radius * 2.0;

            const xLN = xSN * 2.0;
            const yLN = ySN * 2.0;

            positionBuffer2.push(...[0.0, 0.0, 2.0, xLM, yLM, radius * 4.0 * radius]);
            positionBuffer2.push(...[xL, yL, 1.0, xLM, yLM, radius * 4.0 * radius]);
            positionBuffer2.push(...[xLN, yLN, 1.0, xLM, yLM, radius * 4.0 * radius]);

            positionBuffer2.push(...[0.0, 0.0, 1.0, 0.0, 0.0, -1.0]);
            positionBuffer2.push(...[xLN, yLN, 1.0, 0.0, 0.0, -1.0]);
            positionBuffer2.push(...[xL, yL, 1.0, 0.0, 0.0, -1.0]);

            positionBuffer2.push(...[0.0, 0.0, 0.0, 0.0, 0.0, -1.0]);
            positionBuffer2.push(...[xSN, ySN, 0.0, 0.0, 0.0, -1.0]);
            positionBuffer2.push(...[xS, yS, 0.0, 0.0, 0.0, -1.0]);
        }

        positionBuffer2 = new Float32Array(positionBuffer2);


        this.positionBuffer1 = createGPUBuffer(device, positionBuffer1, GPUBufferUsage.VERTEX);
        this.positionBuffer2 = createGPUBuffer(device, positionBuffer2, GPUBufferUsage.VERTEX);

        this.uniformBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ]
        });

        const positionAttribDesc = {
            shaderLocation: 0, // @location(0)
            offset: 0,
            format: 'float32x3'
        };

        const positionBufferLayoutDesc = {
            attributes: [positionAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'vertex'
        };

        const normalAttribDesc = {
            shaderLocation: 1, // @location(1)
            offset: 4 * 3,
            format: 'float32x3'
        };

        const normalBufferLayoutDesc = {
            attributes: [normalAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'vertex'
        };

        const offsetAttribDesc = {
            shaderLocation: 2, // @location(1)
            offset: 0,
            format: 'float32x3'
        };

        const offsetBufferLayoutDesc = {
            attributes: [offsetAttribDesc],
            arrayStride: 4 * 9, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const dirAttribDesc = {
            shaderLocation: 3, // @location(1)
            offset: 3 * 4,
            format: 'float32x3'
        };

        const dirBufferLayoutDesc = {
            attributes: [dirAttribDesc],
            arrayStride: 4 * 9, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const colorAttribDesc = {
            shaderLocation: 4, // @location(1)
            offset: 6 * 4,
            format: 'float32x3'
        };

        const colorBufferLayoutDesc = {
            attributes: [colorAttribDesc],
            arrayStride: 4 * 9, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const pipelineLayoutDesc = { bindGroupLayouts: [this.uniformBindGroupLayout] };
        const layout = device.createPipelineLayout(pipelineLayoutDesc);

        const colorState = {
            format: 'bgra8unorm'
        };

        const pipelineDesc = {
            layout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [positionBufferLayoutDesc, normalBufferLayoutDesc, offsetBufferLayoutDesc, dirBufferLayoutDesc, colorBufferLayoutDesc]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [colorState]
            },
            primitive: {
                topology: 'triangle-strip',
                frontFace: 'ccw',
                cullMode: 'none'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float'
            }
        };

        this.pipeline = device.createRenderPipeline(pipelineDesc);

        const pipelineDesc2 = {
            layout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [positionBufferLayoutDesc, normalBufferLayoutDesc, offsetBufferLayoutDesc, dirBufferLayoutDesc, colorBufferLayoutDesc]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [colorState]
            },
            primitive: {
                topology: 'triangle-list',
                frontFace: 'ccw',
                cullMode: 'none'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float'
            }
        };
        this.pipeline2 = device.createRenderPipeline(pipelineDesc2);

        this.uniformBindGroup = device.createBindGroup({
            layout: this.uniformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: modelViewMatrixUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: projectionMatrixUniformBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: normalMatrixUniformBuffer
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: viewDirectionUniformBuffer
                    }
                }
            ]
        });
    }

    encode(encoder) {
        if (this.arrows.size > 0 && this.instanceDataBuffer !== null) {
            encoder.setPipeline(this.pipeline);
            encoder.setBindGroup(0, this.uniformBindGroup);
            encoder.setVertexBuffer(0, this.positionBuffer1);
            encoder.setVertexBuffer(1, this.positionBuffer1);
            encoder.setVertexBuffer(2, this.instanceDataBuffer);
            encoder.setVertexBuffer(3, this.instanceDataBuffer);
            encoder.setVertexBuffer(4, this.instanceDataBuffer);
            encoder.draw(22, this.arrows.size);
            encoder.setPipeline(this.pipeline2);
            encoder.setBindGroup(0, this.uniformBindGroup);
            encoder.setVertexBuffer(0, this.positionBuffer2);
            encoder.setVertexBuffer(1, this.positionBuffer2);
            encoder.setVertexBuffer(2, this.instanceDataBuffer);
            encoder.setVertexBuffer(3, this.instanceDataBuffer);
            encoder.setVertexBuffer(4, this.instanceDataBuffer);
            encoder.draw(90, this.arrows.size);
        }
    }
}

class Dot {
    constructor() {
        this.pipeline = null;
        this.positionBuffer = null;
        this.uniformBindGroupLayout = null;
        this.instanceDataBuffer = null;
        this.dots = new Map();
        this.uniformBindGroup = null;
        this.transformationUniformBuffer = null;
        this.currentId = 0;
    }

    removeDot() {
        if (id !== null && id !== undefined && this.dots.has(id)) {
            this.dots.delete(id);
        }
    }

    upsertDot(id, pos, color) {
        let assignedId = this.currentId;
        if (id !== null && id !== undefined && this.dots.has(id)) {
            assignedId = id;
        }
        else {
            this.currentId++;
        }

        this.dots.set(assignedId, { pos, color });
        return assignedId;
    }

    refreshBuffer(device) {
        if (this.instanceDataBuffer) {
            this.instanceDataBuffer.destroy();
        }
        let instanceData = [];

        for (let value of this.dots.values()) {
            instanceData.push(value.pos[0]);
            instanceData.push(value.pos[1]);
            instanceData.push(value.pos[2]);

            instanceData.push(value.color[0]);
            instanceData.push(value.color[1]);
            instanceData.push(value.color[2]);

        }

        this.instanceDataBuffer = createGPUBuffer(device, new Float32Array(instanceData), GPUBufferUsage.VERTEX);
    }

    async setup(device, modelViewMatrixUniformBuffer, projectionMatrixUniformBuffer, normalMatrixUniformBuffer, viewDirectionUniformBuffer) {
        let shaderModule = await shaderModuleFromUrl(device, '../shader/dot_shader.wgsl');

        const radius = 1.0;

        let positionBuffer = [];

        for (let i = 0; i < 4; ++i) {
            const angle = i * 2.0 * Math.PI / 4;
            const angleNext = (i + 1) * 2.0 * Math.PI / 4;
            const angleMiddle = (i + 0.5) * 2.0 * Math.PI / 4;

            const xS = Math.cos(angle) * radius;
            const yS = Math.sin(angle) * radius;

            const xSN = Math.cos(angleNext) * radius;
            const ySN = Math.sin(angleNext) * radius;

            const xLM = Math.cos(angleMiddle) * radius;
            const yLM = Math.sin(angleMiddle) * radius;

            positionBuffer.push(...[0.0, 0.0, radius, xLM, yLM, radius * 4.0 * radius]);
            positionBuffer.push(...[xS, yS, 0.0, xLM, yLM, radius * 4.0 * radius]);
            positionBuffer.push(...[xSN, ySN, 0.0, xLM, yLM, radius * 4.0 * radius]);

            positionBuffer.push(...[0.0, 0.0, -radius, xLM, yLM, -radius * 4.0 * radius]);
            positionBuffer.push(...[xSN, ySN, 0.0, xLM, yLM, -radius * 4.0 * radius]);
            positionBuffer.push(...[xS, yS, 0.0, xLM, yLM, -radius * 4.0 * radius]);
        }

        positionBuffer = new Float32Array(positionBuffer);

        this.positionBuffer = createGPUBuffer(device, positionBuffer, GPUBufferUsage.VERTEX);

        this.uniformBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ]
        });

        const positionAttribDesc = {
            shaderLocation: 0, // @location(0)
            offset: 0,
            format: 'float32x3'
        };

        const positionBufferLayoutDesc = {
            attributes: [positionAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'vertex'
        };

        const normalAttribDesc = {
            shaderLocation: 1, // @location(1)
            offset: 4 * 3,
            format: 'float32x3'
        };

        const normalBufferLayoutDesc = {
            attributes: [normalAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'vertex'
        };

        const offsetAttribDesc = {
            shaderLocation: 2, // @location(2)
            offset: 0,
            format: 'float32x3'
        }

        const offsetBufferLayoutDesc = {
            attributes: [offsetAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const colorAttribDesc = {
            shaderLocation: 3, // @location(2)
            offset: 4 * 3,
            format: 'float32x3'
        }

        const colorBufferLayoutDesc = {
            attributes: [colorAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const pipelineLayoutDesc = { bindGroupLayouts: [this.uniformBindGroupLayout] };
        const layout = device.createPipelineLayout(pipelineLayoutDesc);

        const colorState = {
            format: 'bgra8unorm'
        };

        const pipelineDesc = {
            layout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [positionBufferLayoutDesc, normalBufferLayoutDesc, offsetBufferLayoutDesc, colorBufferLayoutDesc]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [colorState]
            },
            primitive: {
                topology: 'triangle-list',
                frontFace: 'ccw',
                cullMode: 'none'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float'
            }
        };
        this.pipeline = device.createRenderPipeline(pipelineDesc);

        this.uniformBindGroup = device.createBindGroup({
            layout: this.uniformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: modelViewMatrixUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: projectionMatrixUniformBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: normalMatrixUniformBuffer
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: viewDirectionUniformBuffer
                    }
                }
            ]
        });
    }

    encode(encoder) {
        if (this.dots.size > 0 && this.instanceDataBuffer !== null) {
            encoder.setPipeline(this.pipeline);
            encoder.setBindGroup(0, this.uniformBindGroup);
            encoder.setVertexBuffer(0, this.positionBuffer);
            encoder.setVertexBuffer(1, this.positionBuffer);
            encoder.setVertexBuffer(2, this.instanceDataBuffer);
            encoder.setVertexBuffer(3, this.instanceDataBuffer);
            encoder.draw(24, this.dots.size);
        }
    }
}

class SpotLight {
    constructor() {
        this.pipeline = null;
        this.pipeline2 = null;
        this.positionBuffer1 = null;
        this.positionBuffer2 = null;
        this.uniformBindGroupLayout = null;
        this.lights = new Map();
        this.currentId = 0;
        this.uniformBindGroup = null;
        this.transformationUniformBuffer = null;
        this.instanceDataBuffer = null;
        this.instanceDataBuffer2 = null;
    }

    removeSpotLight(id) {
        if (id !== null && id !== undefined && this.lights.has(id)) {
            this.lights.delete(id);
        }
    }

    upsertSpotLight(id, pos, dir, color) {
        let assignedId = this.currentId;
        if (id !== null && id !== undefined && this.lights.has(id)) {
            assignedId = id;
        }
        else {
            this.currentId++;
        }

        this.lights.set(assignedId, { pos, dir, color });
        return assignedId;
    }

    refreshBuffer(device) {
        if (this.instanceDataBuffer) {
            this.instanceDataBuffer.destroy();
        }

        if (this.instanceDataBuffer2) {
            this.instanceDataBuffer2.destroy();
        }

        let instanceData = [];
        let instanceData2 = [];

        for (let value of this.lights.values()) {
            instanceData.push(value.pos[0]);
            instanceData.push(value.pos[1]);
            instanceData.push(value.pos[2]);

            instanceData.push(value.dir[0]);
            instanceData.push(value.dir[1]);
            instanceData.push(value.dir[2]);

            instanceData.push(value.color[0]);
            instanceData.push(value.color[1]);
            instanceData.push(value.color[2]);

            instanceData2.push(value.pos[0]);
            instanceData2.push(value.pos[1]);
            instanceData2.push(value.pos[2]);

            instanceData2.push(value.dir[0]);
            instanceData2.push(value.dir[1]);
            instanceData2.push(value.dir[2]);

            instanceData2.push(glMatrix.vec3.length(value.pos));
        }

        this.instanceDataBuffer = createGPUBuffer(device, new Float32Array(instanceData), GPUBufferUsage.VERTEX);
        this.instanceDataBuffer2 = createGPUBuffer(device, new Float32Array(instanceData2), GPUBufferUsage.VERTEX);
    }

    async setup(device, modelViewMatrixUniformBuffer, projectionMatrixUniformBuffer, normalMatrixUniformBuffer, viewDirectionUniformBuffer) {
        let shaderModule = await shaderModuleFromUrl(device, '../shader/arrow_shader.wgsl');
        let shaderModule2 = await shaderModuleFromUrl(device, '../shader/spotlight_cone_shader.wgsl');


        const radius = 1.0;

        let positionBuffer2 = [];
        let positionBuffer1 = [];

        for (let i = 0; i < 10; ++i) {
            const angle = i * 2.0 * Math.PI / 10;
            const angleNext = (i + 1) * 2.0 * Math.PI / 10;
            const angleMiddle = (i + 0.5) * 2.0 * Math.PI / 10;

            const xS = Math.cos(angle) * radius;
            const yS = Math.sin(angle) * radius;

            const xSN = Math.cos(angleNext) * radius;
            const ySN = Math.sin(angleNext) * radius;

            const xSM = Math.cos(angleMiddle) * radius;
            const ySM = Math.sin(angleMiddle) * radius;
            const coneCos = 0.9;
            const s = Math.sqrt(1.0 - (coneCos * coneCos)) / coneCos;

            positionBuffer2.push(...[0.0, 0.0, 0.0, xSM * s, ySM * s, 1.0 - radius * s * s * 4.0 * radius]);
            positionBuffer2.push(...[xSN * s, ySN * s, 1.0, xSM * s, ySM * s, 1.0 - radius * s * s * 4.0 * radius]);
            positionBuffer2.push(...[xS * s, yS * s, 1.0, xSM * s, ySM * s, 1.0 - radius * s * s * 4.0 * radius]);

            positionBuffer1.push(...[xSN * s, ySN * s, 1.0]);
            positionBuffer1.push(...[xS * s, yS * s, 1.0]);
            positionBuffer1.push(...[xS * s, yS * s, 1.0]);
            positionBuffer1.push(...[0.0, 0.0, 0.0]);
        }

        positionBuffer2 = new Float32Array(positionBuffer2);

        positionBuffer1 = new Float32Array(positionBuffer1);

        this.positionBuffer2 = createGPUBuffer(device, positionBuffer2, GPUBufferUsage.VERTEX);
        this.positionBuffer1 = createGPUBuffer(device, positionBuffer1, GPUBufferUsage.VERTEX);

        this.uniformBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ]
        });

        const positionAttribDesc = {
            shaderLocation: 0, // @location(0)
            offset: 0,
            format: 'float32x3'
        };

        const positionBufferLayoutDesc = {
            attributes: [positionAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'vertex'
        };

        const normalAttribDesc = {
            shaderLocation: 1, // @location(1)
            offset: 4 * 3,
            format: 'float32x3'
        };

        const normalBufferLayoutDesc = {
            attributes: [normalAttribDesc],
            arrayStride: 4 * 6, // sizeof(float) * 6
            stepMode: 'vertex'
        };

        const offsetAttribDesc = {
            shaderLocation: 2, // @location(1)
            offset: 0,
            format: 'float32x3'
        };

        const offsetBufferLayoutDesc = {
            attributes: [offsetAttribDesc],
            arrayStride: 4 * 9, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const dirAttribDesc = {
            shaderLocation: 3, // @location(1)
            offset: 3 * 4,
            format: 'float32x3'
        };

        const dirBufferLayoutDesc = {
            attributes: [dirAttribDesc],
            arrayStride: 4 * 9, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const colorAttribDesc = {
            shaderLocation: 4, // @location(1)
            offset: 6 * 4,
            format: 'float32x3'
        };

        const colorBufferLayoutDesc = {
            attributes: [colorAttribDesc],
            arrayStride: 4 * 9, // sizeof(float) * 6
            stepMode: 'instance'
        };


        const offsetAttribDesc2 = {
            shaderLocation: 1, // @location(1)
            offset: 0,
            format: 'float32x3'
        };

        const offsetBufferLayoutDesc2 = {
            attributes: [offsetAttribDesc2],
            arrayStride: 4 * 7, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const dirAttribDesc2 = {
            shaderLocation: 2, // @location(1)
            offset: 3 * 4,
            format: 'float32x3'
        };

        const dirBufferLayoutDesc2 = {
            attributes: [dirAttribDesc2],
            arrayStride: 4 * 7, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const scaleAttribDesc = {
            shaderLocation: 3, // @location(1)
            offset: 6 * 4,
            format: 'float32'
        };

        const scaleBufferLayoutDesc = {
            attributes: [scaleAttribDesc],
            arrayStride: 4 * 7, // sizeof(float) * 6
            stepMode: 'instance'
        };

        const positionAttribDesc2 = {
            shaderLocation: 0, // @location(0)
            offset: 0,
            format: 'float32x3'
        };

        const positionBufferLayoutDesc2 = {
            attributes: [positionAttribDesc2],
            arrayStride: 4 * 3, // sizeof(float) * 6
            stepMode: 'vertex'
        };


        const pipelineLayoutDesc = { bindGroupLayouts: [this.uniformBindGroupLayout] };
        const layout = device.createPipelineLayout(pipelineLayoutDesc);

        const colorState = {
            format: 'bgra8unorm'
        };

        const pipelineDesc = {
            layout,
            vertex: {
                module: shaderModule2,
                entryPoint: 'vs_main',
                buffers: [positionBufferLayoutDesc2, offsetBufferLayoutDesc2, dirBufferLayoutDesc2, scaleBufferLayoutDesc]
            },
            fragment: {
                module: shaderModule2,
                entryPoint: 'fs_main',
                targets: [colorState]
            },
            primitive: {
                topology: 'line-list'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float'
            }
        };

        this.pipeline = device.createRenderPipeline(pipelineDesc);

        const pipelineDesc2 = {
            layout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [positionBufferLayoutDesc, normalBufferLayoutDesc, offsetBufferLayoutDesc, dirBufferLayoutDesc, colorBufferLayoutDesc]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [colorState]
            },
            primitive: {
                topology: 'triangle-list',
                frontFace: 'ccw',
                cullMode: 'none'
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth32float'
            }
        };
        this.pipeline2 = device.createRenderPipeline(pipelineDesc2);

        this.uniformBindGroup = device.createBindGroup({
            layout: this.uniformBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: modelViewMatrixUniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: projectionMatrixUniformBuffer
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: normalMatrixUniformBuffer
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: viewDirectionUniformBuffer
                    }
                }
            ]
        });
    }

    encode(encoder) {
        if (this.lights.size > 0 && this.instanceDataBuffer !== null && this.instanceDataBuffer2 !== null) {
            encoder.setPipeline(this.pipeline);
            encoder.setBindGroup(0, this.uniformBindGroup);
            encoder.setVertexBuffer(0, this.positionBuffer1);
            encoder.setVertexBuffer(1, this.instanceDataBuffer2);
            encoder.setVertexBuffer(2, this.instanceDataBuffer2);
            encoder.setVertexBuffer(3, this.instanceDataBuffer2);
            encoder.draw(40, this.lights.size);
            encoder.setPipeline(this.pipeline2);
            encoder.setBindGroup(0, this.uniformBindGroup);
            encoder.setVertexBuffer(0, this.positionBuffer2);
            encoder.setVertexBuffer(1, this.positionBuffer2);
            encoder.setVertexBuffer(2, this.instanceDataBuffer);
            encoder.setVertexBuffer(3, this.instanceDataBuffer);
            encoder.setVertexBuffer(4, this.instanceDataBuffer);
            encoder.draw(30, this.lights.size);
        }
    }
}
