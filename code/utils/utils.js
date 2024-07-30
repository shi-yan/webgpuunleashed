//cs_start: utils_create_gpu_buffer
function createGPUBuffer(device, buffer, usage) {
    const bufferDesc = {
        size: buffer.byteLength,
        usage: usage,
        mappedAtCreation: true
    };
    //console.log('buffer size', buffer.byteLength);
    let gpuBuffer = device.createBuffer(bufferDesc);
    if (buffer instanceof Float32Array) {
        const writeArrayNormal = new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else if (buffer instanceof Uint16Array) {
        const writeArrayNormal = new Uint16Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else if (buffer instanceof Uint8Array) {
        const writeArrayNormal = new Uint8Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else if (buffer instanceof Uint32Array) {
        const writeArrayNormal = new Uint32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    }
    else {
        const writeArrayNormal = new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
        console.error("Unhandled buffer format ", typeof gpuBuffer);
    }
    gpuBuffer.unmap();
    return gpuBuffer;
}
//cs_end: utils_create_gpu_buffer

async function img2texture(device, url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const imgBitmap = await createImageBitmap(blob);

    const textureDescriptor = {
        size: { width: imgBitmap.width, height: imgBitmap.height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };

    const texture = device.createTexture(textureDescriptor);

    device.queue.copyExternalImageToTexture({ source: imgBitmap }, { texture }, textureDescriptor.size);

    return texture;
}

async function loadObj(device, url) {
    const objResponse = await fetch(url);
    const objBody = await objResponse.text();

    let obj = await (async () => {
        return new Promise((resolve, reject) => {
            let obj = new OBJFile(objBody);
            obj.parse();
            resolve(obj);
        })
    })();

    let positions = [];
    let normals = [];

    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;

    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;

    let minZ = Number.MAX_VALUE;
    let maxZ = Number.MIN_VALUE;
    for (let v of obj.result.models[0].vertices) {
        positions.push(v.x);
        positions.push(v.y);
        positions.push(v.z);
        normals.push(0.0);
        normals.push(0.0);
        normals.push(0.0);
    }

    positions = new Float32Array(positions);
    normals = new Float32Array(normals);

    let positionBuffer = createGPUBuffer(device, positions, GPUBufferUsage.VERTEX);
    let indices = [];
    
//cs_start: normal_loading
    for (let f of obj.result.models[0].faces) {
        let points = [];
        let facet_indices = [];
        for (let v of f.vertices) {
            const index = v.vertexIndex - 1;
            indices.push(index);

            const vertex = glMatrix.vec3.fromValues(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);

            minX = Math.min(positions[index * 3], minX);
            maxX = Math.max(positions[index * 3], maxX);

            minY = Math.min(positions[index * 3 + 1], minY);
            maxY = Math.max(positions[index * 3 + 1], maxY);

            minZ = Math.min(positions[index * 3 + 2], minZ);
            maxZ = Math.max(positions[index * 3 + 2], maxZ);
            points.push(vertex);
            facet_indices.push(index);
        }

        const v1 = glMatrix.vec3.subtract(glMatrix.vec3.create(), points[1], points[0]);
        const v2 = glMatrix.vec3.subtract(glMatrix.vec3.create(), points[2], points[0]);
        const cross = glMatrix.vec3.cross(glMatrix.vec3.create(), v1, v2);
        const normal = glMatrix.vec3.normalize(glMatrix.vec3.create(), cross);

        for (let i of facet_indices) {
            normals[i * 3] += normal[0];
            normals[i * 3 + 1] += normal[1];
            normals[i * 3 + 2] += normal[2];
        }
    }
    let normalBuffer = createGPUBuffer(device, normals, GPUBufferUsage.VERTEX);
//cs_end: normal_loading

    const indexSize = indices.length;

    indices = new Uint16Array(indices);

    indexBuffer = createGPUBuffer(device, indices, GPUBufferUsage.INDEX);
    return {
        positionBuffer, normalBuffer, indexBuffer, indexSize, center: [(minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5],
        radius: Math.max(Math.max(maxX - minX, maxY - minY), maxZ - minZ) * 0.5
    }
}

function shaderModuleFromCode(device, codeTagId) {
    let code = document.getElementById(codeTagId).innerText;
    const shaderDesc = { code: code };
    let shaderModule = device.createShaderModule(shaderDesc);
    return shaderModule;
}

async function shaderModuleFromUrl(device, url) {
    const codeResponse = await fetch(url);
    const codeBody = await codeResponse.text();

    const shaderDesc = { code: codeBody };
    let shaderModule = device.createShaderModule(shaderDesc);
    return shaderModule;
}

function configContext(device, canvas) {
    let context = canvas.getContext('webgpu');

    const canvasConfig = {
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        usage:
            GPUTextureUsage.RENDER_ATTACHMENT,
        alphaMode: 'opaque'
    };

    context.configure(canvasConfig);
    return context;
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function imagedataToImage(imagedata, filename = "image.png") {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = imagedata.width;
    canvas.height = imagedata.height;
    ctx.putImageData(imagedata, 0, 0);


    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
}

async function downloadTexture(device, texture, filename = "image.png") {
    const bufferWidth = Math.ceil(texture.width / 256) * 256; //alignment requirement
    const copiedBuffer = createGPUBuffer(device, new Uint8Array(bufferWidth * texture.height * 4), GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer({ texture: texture, origin: { x: 0, y: 0 } }, { buffer: copiedBuffer, bytesPerRow: bufferWidth * 4 }, { width: texture.width, height: texture.height });
    device.queue.submit([commandEncoder.finish()]);

    await device.queue.onSubmittedWorkDone();

    await copiedBuffer.mapAsync(GPUMapMode.READ, 0, bufferWidth * texture.height * 4);

    const x = new Uint8ClampedArray(copiedBuffer.getMappedRange());
    const imageData = new ImageData(x, bufferWidth, texture.height);
    imagedataToImage(imageData, filename);

    copiedBuffer.unmap();

    copiedBuffer.destroy();
}

async function downloadStencilTexture(device, texture, filename = "image.png") {
    const bufferWidth = Math.ceil(texture.width / 256) * 256; //alignment requirement
    const copiedBuffer = createGPUBuffer(device, new Uint8Array(bufferWidth * texture.height), GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer({ texture: texture, origin: { x: 0, y: 0 }, aspect: "stencil-only" }, { buffer: copiedBuffer, bytesPerRow: bufferWidth }, { width: texture.width, height: texture.height });
    device.queue.submit([commandEncoder.finish()]);

    await device.queue.onSubmittedWorkDone();

    await copiedBuffer.mapAsync(GPUMapMode.READ, 0, bufferWidth * texture.height);

    let xExpand2RGBA = new Uint8ClampedArray(bufferWidth * texture.height * 4);
    const x = new Uint8ClampedArray(copiedBuffer.getMappedRange());

    for (let i = 0; i < x.length; ++i) {
        xExpand2RGBA.set([x[i], x[i], x[i], x[i]], i * 4);
    }

    const imageData = new ImageData(xExpand2RGBA, bufferWidth, texture.height);
    imagedataToImage(imageData, filename);

    copiedBuffer.unmap();

    copiedBuffer.destroy();
}

async function dumpTextureF32(device, texture) {
    const bufferWidth = Math.ceil(texture.width / 256) * 256; //alignment requirement
    //console.log("texture width", bufferWidth)
    const copiedBuffer = createGPUBuffer(device, new Float32Array(bufferWidth * texture.height), GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer({ texture: texture, origin: { x: 0, y: 0 } }, { buffer: copiedBuffer, bytesPerRow: bufferWidth * 4 }, { width: texture.width, height: texture.height });
    device.queue.submit([commandEncoder.finish()]);

    await device.queue.onSubmittedWorkDone();

    await copiedBuffer.mapAsync(GPUMapMode.READ, 0, bufferWidth * texture.height * 4);

    const x = new Float32Array(copiedBuffer.getMappedRange()).slice();

    copiedBuffer.unmap();

    copiedBuffer.destroy();
    return x;
}

async function dumpTextureF32AsImage(device, texture) {
    const bufferWidth = Math.ceil(texture.width / 256) * 256; //alignment requirement
    console.log("texture width", bufferWidth, texture.width, texture.height)
    const copiedBuffer = createGPUBuffer(device, new Float32Array(bufferWidth * texture.height), GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ);

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToBuffer({ texture: texture, origin: { x: 0, y: 0 } }, { buffer: copiedBuffer, bytesPerRow: bufferWidth * 4 }, { width: texture.width, height: texture.height });
    device.queue.submit([commandEncoder.finish()]);

    await device.queue.onSubmittedWorkDone();

    await copiedBuffer.mapAsync(GPUMapMode.READ, 0, bufferWidth * texture.height * 4);

    const d = new Float32Array(copiedBuffer.getMappedRange()).slice();
    const y = new Uint8ClampedArray(bufferWidth * texture.height * 4);

    for (let i = 0; i < bufferWidth * texture.height; ++i) {
        const v = d[i];

        y[i * 4] = v * 255.0;
        y[i * 4 + 1] = v * 255.0;
        y[i * 4 + 2] = v * 255.0;
        y[i * 4 + 3] = v * 255.0;
    }
    copiedBuffer.unmap();
    const imageData = new ImageData(y, bufferWidth, texture.height);
    imagedataToImage(imageData);

    copiedBuffer.destroy();
}

function showWarning(message) {

    let elm = document.createElement('h3');
    elm.innerText = message;
    elm.style.backgroundColor = "maroon";
    elm.style.color = "#ffd690";
    elm.style.margin = "20px";
    elm.style.padding = "20px";
    elm.style.fontSize = "24px";
    elm.style.position = "absolute";
    elm.style.top = "0";
    document.body.appendChild(elm);
}