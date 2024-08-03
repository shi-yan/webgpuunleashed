importScripts("../utils/gl-matrix.js");
importScripts("../utils/OBJFile.js");
importScripts("../utils/utils.js");

self.addEventListener('message', (ev) => {
    switch (ev.data.type) {
        case 'run': {
            try {
                run(ev.data.offscreenCanvas, ev.data.code);
            } catch (err) {
                self.postMessage({
                    type: 'log',
                    message: `Error while initializing WebGPU in worker process: ${err.message}`,
                });
            }
            break;
        }
    }
});
class Teapot {
    constructor() {
        this.pipeline = null;
        this.positionBuffer = null;
        this.normalBuffer = null;
        this.indexBuffer = null;
        this.uniformBindGroup = null;
        this.indexSize = null;
    }

    async setup(device,code, modelViewMatrixUniformBuffer, projectionMatrixUniformBuffer, normalMatrixUniformBuffer) {
        const shaderDesc = { code: code };
        let shaderModule = device.createShaderModule(shaderDesc);

        let { positionBuffer, normalBuffer, indexBuffer, indexSize } = await loadObj(device, '../data/teapot.obj');
        this.positionBuffer = positionBuffer;
        this.normalBuffer = normalBuffer;
        this.indexBuffer = indexBuffer;
        this.indexSize = indexSize;

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
                }
            ]
        });

        this.uniformBindGroup = device.createBindGroup({
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
                        buffer: normalMatrixUniformBuffer
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

        const normalAttribDesc = {
            shaderLocation: 1, // @location(1)
            offset: 0,
            format: 'float32x3'
        };

        const normalBufferLayoutDesc = {
            attributes: [normalAttribDesc],
            arrayStride: 4 * 3, // sizeof(float) * 3
            stepMode: 'vertex'
        };

        const pipelineLayoutDesc = { bindGroupLayouts: [uniformBindGroupLayout] };
        const layout = device.createPipelineLayout(pipelineLayoutDesc);

        const colorState = {
            format: 'bgra8unorm'
        };

        const pipelineDesc = {
            layout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [positionBufferLayoutDesc, normalBufferLayoutDesc]
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
                format: 'depth24plus-stencil8'
            }
        };

        this.pipeline = device.createRenderPipeline(pipelineDesc);
    }

    encode(encoder) {
        encoder.setPipeline(this.pipeline);
        encoder.setBindGroup(0, this.uniformBindGroup);
        encoder.setVertexBuffer(0, this.positionBuffer);
        encoder.setVertexBuffer(1, this.normalBuffer);
        encoder.setIndexBuffer(this.indexBuffer, 'uint16');
        encoder.drawIndexed(this.indexSize);
    }
}
async function run(canvas, code) {
    let angle = 0.0;

    const adapter = await navigator.gpu.requestAdapter();

    let device = await adapter.requestDevice();

    let context = configContext(device, canvas);
    let modelViewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(),
        glMatrix.vec3.fromValues(Math.cos(angle) * 5.0, Math.sin(angle) * 5.0, 5), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0.0, 0.0, 1.0));

    let modelViewMatrixUniformBuffer = createGPUBuffer(device, modelViewMatrix, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

    let modelViewMatrixInverse = glMatrix.mat4.invert(glMatrix.mat4.create(), modelViewMatrix);

    let normalMatrix = glMatrix.mat4.transpose(glMatrix.mat4.create(), modelViewMatrixInverse);

    let normalMatrixUniformBuffer = createGPUBuffer(device, normalMatrix, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

    let projectionMatrix = glMatrix.mat4.perspective(glMatrix.mat4.create(),
        1.4, 640.0 / 480.0, 0.1, 1000.0);

    let projectionMatrixUniformBuffer = createGPUBuffer(device, projectionMatrix, GPUBufferUsage.UNIFORM);

    let teapot = new Teapot();
    await teapot.setup(device, code,modelViewMatrixUniformBuffer, projectionMatrixUniformBuffer, normalMatrixUniformBuffer);

    const depthTextureDesc = {
        size: [canvas.width, canvas.height, 1],
        dimension: '2d',
        format: 'depth24plus-stencil8',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    };

    let depthTexture = device.createTexture(depthTextureDesc);
    let depthTextureView = depthTexture.createView();

    const depthAttachment = {
        view: depthTextureView,
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        stencilClearValue: 0,
        stencilLoadOp: 'clear',
        stencilStoreOp: 'store'
    };
    async function render() {
        angle += 0.1;
        let modelViewMatrix = glMatrix.mat4.lookAt(glMatrix.mat4.create(),
            glMatrix.vec3.fromValues(Math.cos(angle) * 5.0, Math.sin(angle) * 5.0, 5), glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0.0, 0.0, 1.0));

        let modelViewMatrixUniformBufferUpdate = createGPUBuffer(device, modelViewMatrix, GPUBufferUsage.COPY_SRC);

        let modelViewMatrixInverse = glMatrix.mat4.invert(glMatrix.mat4.create(), modelViewMatrix);

        let normalMatrix = glMatrix.mat4.transpose(glMatrix.mat4.create(), modelViewMatrixInverse);

        let normalMatrixUniformBufferUpdate = createGPUBuffer(device, normalMatrix, GPUBufferUsage.COPY_SRC);

        let colorTexture = context.getCurrentTexture();
        let colorTextureView = colorTexture.createView();

        let colorAttachment = {
            view: colorTextureView,
            clearValue: { r: 1, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store'
        };

        const renderPassDesc = {
            colorAttachments: [colorAttachment],
            depthStencilAttachment: depthAttachment
        };

        commandEncoder = device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(modelViewMatrixUniformBufferUpdate, 0,
            modelViewMatrixUniformBuffer, 0, modelViewMatrix.byteLength);
        commandEncoder.copyBufferToBuffer(normalMatrixUniformBufferUpdate, 0,
            normalMatrixUniformBuffer, 0, normalMatrix.byteLength);
        passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        teapot.encode(passEncoder);
        passEncoder.end();
        device.queue.submit([commandEncoder.finish()]);

        await device.queue.onSubmittedWorkDone();

        modelViewMatrixUniformBufferUpdate.destroy();
        normalMatrixUniformBufferUpdate.destroy();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}
