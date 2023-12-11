#include <iostream>
#include <assimp/Importer.hpp>
#include <assimp/scene.h>
#include <assimp/postprocess.h>
#include <fstream>
#include <unordered_map>

struct Bone
{
    aiBone *bone;
    aiNodeAnim *ani;
};

void printHierarchy(std::ofstream &outputFile, aiNode *node, int indentation, bool shouldDump,
                    std::unordered_map<std::string, Bone> &bones, int &boneId)
{
    std::cout << std::string(indentation, '-') << node->mName.C_Str() << std::endl;
    if (strcmp("Armature", node->mName.C_Str()) == 0)
    {
        shouldDump = true;
    }
    const std::string boneName = std::string(node->mName.C_Str());

    if (shouldDump && bones.find(boneName) != bones.end())
    {
        std::cout << "bone = = " << boneName << std::endl;
        outputFile << "{\"id\":"<<(boneId++)<<",\"name\":\"" << node->mName.C_Str() << "\",\"children\":[" << std::endl;

        for (int i = 0; i < node->mNumChildren; ++i)
        {
            printHierarchy(outputFile, node->mChildren[i], indentation + 1, shouldDump, bones, boneId);

            if (i < node->mNumChildren - 1)
            {
                outputFile << "," << std::endl;
            }
        }

        outputFile << "]" << std::endl;

        aiBone *b = bones[boneName].bone;
        outputFile << ", \"offsetMatrix\":[";
        for (int i = 0; i < 4; ++i)
        {
            auto w = b->mOffsetMatrix[i];
            outputFile << w[0] << "," << w[1] << "," << w[2] << "," << w[3];
            if (i < 3)
            {
                outputFile << ",";
            }
        }
        outputFile << "],\n \"weights\":[" << std::endl;

         for (int i = 0; i < b->mNumWeights; ++i)
         {
             outputFile << "{\"id\":" << b->mWeights[i].mVertexId << ",\"w\":" << b->mWeights[i].mWeight << "}";
             if (i < b->mNumWeights - 1)
             {
                 outputFile << "," << std::endl;
             }
         }
        outputFile << "]";

        aiNodeAnim *ani = bones[boneName].ani;

        if (ani)
        {

            outputFile << ",\"ani\":{" << std::endl;

            if (ani->mNumPositionKeys > 0)
            {
                outputFile << "\"pos\":[";

                for (int e = 0; e < ani->mNumPositionKeys; ++e)
                {
                    auto pk = ani->mPositionKeys[e];
                    outputFile << "{\"time\":" << pk.mTime << ",\"pos\":[" << pk.mValue[0] << "," << pk.mValue[1] << "," << pk.mValue[2] << "]}" << std::endl;
                    if (e < ani->mNumPositionKeys - 1)
                    {
                        outputFile << ",";
                    }
                }

                outputFile << "]" << std::endl;
            }

            if (ani->mNumRotationKeys > 0)
            {
                outputFile << ",\"rot\":[";

                for (int e = 0; e < ani->mNumRotationKeys; ++e)
                {
                    auto rk = ani->mRotationKeys[e];
                    outputFile << "{\"time\":" << rk.mTime << ",\"q\":[" << rk.mValue.w << "," << rk.mValue.x << "," << rk.mValue.y << "," << rk.mValue.z << "]}" << std::endl;
                    if (e < ani->mNumRotationKeys - 1)
                    {
                        outputFile << ",";
                    }
                }

                outputFile << "]" << std::endl;
            }

            if (ani->mNumScalingKeys > 0)
            {
                outputFile << ",\"scal\":[";

                for (int e = 0; e < ani->mNumScalingKeys; ++e)
                {
                    auto sk = ani->mScalingKeys[e];
                    outputFile << "{\"time\":" << sk.mTime << ",\"pos\":[" << sk.mValue[0] << "," << sk.mValue[1] << "," << sk.mValue[2] << "]}" << std::endl;
                    if (e < ani->mNumScalingKeys - 1)
                    {
                        outputFile << ",";
                    }
                }

                outputFile << "]" << std::endl;
            }

            outputFile << "}" << std::endl;
        }
        outputFile << "}";
    }
    else 
    {
        for (int i = 0; i < node->mNumChildren; ++i)
        {
            printHierarchy(outputFile, node->mChildren[i], indentation + 1, shouldDump, bones, boneId);

            if (i < node->mNumChildren - 1)
            {
                outputFile << "," << std::endl;
            }
        }
    }
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

    // std::cout << "children count " << scene->mRootNode->mChildren[0]->mNumChildren << std::endl;

    std::ofstream outputFile;
    outputFile.open("cuberun.json");
    outputFile << "{\"vert\":[";

    for (unsigned int i = 0; i < mesh->mNumVertices; i++)
    {
        outputFile << mesh->mVertices[i][0] << ", " << mesh->mVertices[i][1] << ", " << mesh->mVertices[i][2] << ", ";
        outputFile << mesh->mNormals[i][0] << ", " << mesh->mNormals[i][1] << ", " << mesh->mNormals[i][2];
        if (i != mesh->mNumVertices - 1)
        {
            outputFile << ", " << std::endl;
        }
    }
    outputFile << "],\"indices\":[\n";

    for (unsigned int i = 0; i < mesh->mNumFaces; ++i)
    {
        aiFace face = mesh->mFaces[i];

        // std::cout << "face ";
        for (unsigned int f = 0; f < face.mNumIndices; ++f)
        {
            outputFile << face.mIndices[f];
            if (i != mesh->mNumFaces - 1 || f != face.mNumIndices - 1)
            {
                outputFile << ", ";
            }
        }
        outputFile << std::endl;
    }
    outputFile << "],\"skeleton\":[\n";

    std::unordered_map<std::string, Bone> bones;

    if (mesh->HasBones())
    {
        for (int i = 0; i < mesh->mNumBones; ++i)
        {
            bones[std::string(mesh->mBones[i]->mName.C_Str())] = {mesh->mBones[i], nullptr};
            // std::cout << "insert bone " << mesh->mBones[i]->mName.C_Str() << std::endl;
        }
        std::cout << "animation size " << scene->mNumAnimations << std::endl;

        aiAnimation *ani = scene->mAnimations[0];

        std::cout << "channel size" << ani->mNumChannels << std::endl;

        for (int i = 0; i < ani->mNumChannels; ++i)
        {
            aiNodeAnim *a = ani->mChannels[i];
            std::string boneName = std::string(a->mNodeName.C_Str());
            if (bones.find(boneName) != bones.end())
            {
                bones[boneName].ani = a;
            }
        }
    }
    int boneId = 0;
    printHierarchy(outputFile, scene->mRootNode, 0, false, bones, boneId );

    outputFile << "]}";

    outputFile.close();

    /*
        std::cout << "has tex " << mesh->HasTextureCoords(0) << std::endl;

        std::cout << "has bone " << mesh->HasBones() << std::endl;

        std::cout << "bones " << mesh->mNumBones << std::endl;
*/

    return 0;
}