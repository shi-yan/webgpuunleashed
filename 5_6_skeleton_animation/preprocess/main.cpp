#include <iostream>
#include <assimp/Importer.hpp>
#include <assimp/scene.h>
#include <assimp/postprocess.h>
#include <fstream>
void processNode(aiNode *node, const aiScene *scene)
{
    // process all the node's meshes (if any)
    /*for(unsigned int i = 0; i < node->mNumMeshes; i++)
    {
        aiMesh *mesh = scene->mMeshes[node->mMeshes[i]];
        meshes.push_back(processMesh(mesh, scene));
    }
    // then do the same for each of its children
    for(unsigned int i = 0; i < node->mNumChildren; i++)
    {
        processNode(node->mChildren[i], scene);
    }*/
}

int main()
{
    std::cout << "test" << std::endl;
    const char *path = "../../../data/cuberun.dae";
    Assimp::Importer importer;
    const aiScene *scene = importer.ReadFile(path, aiProcess_Triangulate | aiProcess_FlipUVs);
    if (!scene || scene->mFlags & AI_SCENE_FLAGS_INCOMPLETE || !scene->mRootNode)
    {
        std::cout << "ERROR::ASSIMP::" << importer.GetErrorString() << std::endl;
        return 1;
    }

    std::cout << "mesh count " << scene->mNumMeshes << std::endl;

    const aiMesh *mesh = scene->mMeshes[0];

    std::cout << "mesh uv channel " << mesh->GetNumUVChannels() << std::endl;

    std::ofstream outputFile;
    outputFile.open("cuberun.json");
    outputFile << "{\"vert\":[\n";

    for (unsigned int i = 0; i < mesh->mNumVertices; i++)
    {
        outputFile << mesh->mVertices[i][0] << ", " << mesh->mVertices[i][1] << ", " << mesh->mVertices[i][2] << ", ";
        // std::cout << "tex " << mesh->mTextureCoords[i][0][0]  << std::endl;
        // std::cout <<  mesh->mTextureCoords[0][i][0] << ", " << mesh->mTextureCoords[0][i][1] << ", "  << mesh->mTextureCoords[0][i][2] << std::endl;

        outputFile << mesh->mNormals[i][0] << ", " << mesh->mNormals[i][1] << ", " << mesh->mNormals[i][2] << ", " << std::endl;
    }
    outputFile << "],\"indices\":[\n";


    for (unsigned int i = 0; i < mesh->mNumFaces; ++i)
    {
        aiFace face = mesh->mFaces[i];

        //std::cout << "face ";
        for (unsigned int f = 0; f < face.mNumIndices; ++f)
        {
            outputFile << face.mIndices[f] << ", ";
        }
        outputFile << std::endl;
    }
    outputFile << "]}\n";
    outputFile.close();

    std::cout << "has tex " << mesh->HasTextureCoords(0) << std::endl;

    std::cout << "has bone " << mesh->HasBones() << std::endl;

    std::cout << "bones " << mesh->mNumBones << std::endl;

    std::cout << "animation size " << scene->mNumAnimations << std::endl;

    aiAnimation *ani = scene->mAnimations[0];

    std::cout << "channel size" << ani->mNumChannels << std::endl;

    for (int i = 0; i < ani->mNumChannels; ++i)
    {
        aiNodeAnim *a = ani->mChannels[i];

        std::cout << a->mNodeName.C_Str() << std::endl;

        std::cout << a->mNumPositionKeys << std::endl;
        std::cout << a->mNumRotationKeys << std::endl;
        std::cout << a->mNumScalingKeys << std::endl;
    }

    return 0;
}