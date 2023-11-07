class OBJFile {
  constructor(fileContents, defaultModelName) {
    this._reset();
    this.fileContents = fileContents;
    this.defaultModelName = (defaultModelName || 'untitled');
  }

  _reset() {
    this.result = {
      models: [],
      materialLibraries: []
    };
    this.currentMaterial = '';
    this.currentGroup = '';
    this.smoothingGroup = 0;
  }

  parse() {
    this._reset();

    const _stripComments = (lineString) => {
      const commentIndex = lineString.indexOf('#');
      if (commentIndex > -1) { return lineString.substring(0, commentIndex); }
      return lineString;
    };

    const lines = this.fileContents.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = _stripComments(lines[i]);

      const lineItems = line.replace(/\s\s+/g, ' ').trim().split(' ');

      switch (lineItems[0].toLowerCase()) {
        case 'o': // Start A New Model
          this._parseObject(lineItems);
          break;
        case 'g': // Start a new polygon group
          this._parseGroup(lineItems);
          break;
        case 'v': // Define a vertex for the current model
          this._parseVertexCoords(lineItems);
          break;
        case 'vt': // Texture Coords
          this._parseTextureCoords(lineItems);
          break;
        case 'vn': // Define a vertex normal for the current model
          this._parseVertexNormal(lineItems);
          break;
        case 's': // Smooth shading statement
          this._parseSmoothShadingStatement(lineItems);
          break;
        case 'f': // Define a Face/Polygon
          this._parsePolygon(lineItems);
          break;
        case 'mtllib': // Reference to a material library file (.mtl)
          this._parseMtlLib(lineItems);
          break;
        case 'usemtl': // Sets the current material to be applied to polygons defined from this point forward
          this._parseUseMtl(lineItems);
          break;
      }
    }

    return this.result;
  }

  _currentModel() {
    if (this.result.models.length == 0) {
      this.result.models.push({
        name: this.defaultModelName,
        vertices: [],
        textureCoords: [],
        vertexNormals: [],
        faces: []
      });
      this.currentGroup = '';
      this.smoothingGroup = 0;
    }

    return this.result.models[this.result.models.length - 1];
  }

  _parseObject(lineItems) {
    const modelName = lineItems.length >= 2 ? lineItems[1] : this.defaultModelName;
    this.result.models.push({
      name: modelName,
      vertices: [],
      textureCoords: [],
      vertexNormals: [],
      faces: []
    });
    this.currentGroup = '';
    this.smoothingGroup = 0;
  }

  _parseGroup(lineItems) {
    if (lineItems.length != 2) { throw 'Group statements must have exactly 1 argument (eg. g group_1)'; }

    this.currentGroup = lineItems[1];
  }

  _parseVertexCoords(lineItems) {
    const x = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
    const y = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
    const z = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;

    this._currentModel().vertices.push({ x, y, z });
  }

  _parseTextureCoords(lineItems) {
    const u = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
    const v = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
    const w = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;

    this._currentModel().textureCoords.push({ u, v, w });
  }

  _parseVertexNormal(lineItems) {
    const x = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
    const y = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
    const z = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;

    this._currentModel().vertexNormals.push({ x, y, z });
  }

  _parsePolygon(lineItems) {
    const totalVertices = (lineItems.length - 1);
    if (totalVertices < 3) { throw (`Face statement has less than 3 vertices${this.filePath}${this.lineNumber}`); }

    const face = {
      material: this.currentMaterial,
      group: this.currentGroup,
      smoothingGroup: this.smoothingGroup,
      vertices: []
    };

    for (let i = 0; i < totalVertices; i += 1) {
      const vertexString = lineItems[i + 1];
      const vertexValues = vertexString.split('/');

      if (vertexValues.length < 1 || vertexValues.length > 3) { throw (`Too many values (separated by /) for a single vertex${this.filePath}${this.lineNumber}`); }

      let vertexIndex = 0;
      let textureCoordsIndex = 0;
      let vertexNormalIndex = 0;
      vertexIndex = parseInt(vertexValues[0]);
      if (vertexValues.length > 1 && (vertexValues[1] != '')) { textureCoordsIndex = parseInt(vertexValues[1]); }
      if (vertexValues.length > 2) { vertexNormalIndex = parseInt(vertexValues[2]); }

      if (vertexIndex == 0) { throw 'Faces uses invalid vertex index of 0'; }

      // Negative vertex indices refer to the nth last defined vertex
      // convert these to postive indices for simplicity
      if (vertexIndex < 0) { vertexIndex = this._currentModel().vertices.length + 1 + vertexIndex; }

      face.vertices.push({
        vertexIndex,
        textureCoordsIndex,
        vertexNormalIndex
      });
    }
    this._currentModel().faces.push(face);
  }

  _parseMtlLib(lineItems) {
    if (lineItems.length >= 2) { this.result.materialLibraries.push(lineItems[1]); }
  }

  _parseUseMtl(lineItems) {
    if (lineItems.length >= 2) { this.currentMaterial = lineItems[1]; }
  }

  _parseSmoothShadingStatement(lineItems) {
    if (lineItems.length != 2) { throw 'Smoothing group statements must have exactly 1 argument (eg. s <number|off>)'; }

    const groupNumber = (lineItems[1].toLowerCase() == 'off') ? 0 : parseInt(lineItems[1]);
    this.smoothingGroup = groupNumber;
  }
}

