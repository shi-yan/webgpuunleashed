#include <iostream>
#include <fstream>
#include <unordered_map>
#include "happly.h"
#include <cmath>

int main()
{
//cs_start: ply_preprocessor
    happly::PLYData plyIn("../../../data/food.ply");
    std::vector<float> opacity = plyIn.getElement("vertex").getProperty<float>("opacity");
    std::vector<float> scale0 = plyIn.getElement("vertex").getProperty<float>("scale_0");
    std::vector<float> scale1 = plyIn.getElement("vertex").getProperty<float>("scale_1");
    std::vector<float> scale2 = plyIn.getElement("vertex").getProperty<float>("scale_2");
    std::vector<float> rot0 = plyIn.getElement("vertex").getProperty<float>("rot_0");
    std::vector<float> rot1 = plyIn.getElement("vertex").getProperty<float>("rot_1");
    std::vector<float> rot2 = plyIn.getElement("vertex").getProperty<float>("rot_2");
    std::vector<float> rot3 = plyIn.getElement("vertex").getProperty<float>("rot_3");
    std::vector<float> x = plyIn.getElement("vertex").getProperty<float>("x");
    std::vector<float> y = plyIn.getElement("vertex").getProperty<float>("y");
    std::vector<float> z = plyIn.getElement("vertex").getProperty<float>("z");
    std::vector<float> f_dc_0 = plyIn.getElement("vertex").getProperty<float>("f_dc_0");
    std::vector<float> f_dc_1 = plyIn.getElement("vertex").getProperty<float>("f_dc_1");
    std::vector<float> f_dc_2 = plyIn.getElement("vertex").getProperty<float>("f_dc_2");
    std::ofstream outputFile;
    outputFile.open("food.json");
    outputFile << "[";
    for (int i = 0; i < opacity.size(); ++i)
    {

        const double SH_C0 = 0.28209479177387814;

        outputFile << "{\"p\":[" << x[i] << ", " << y[i] << ", " << z[i] << "]," << std::endl;
        outputFile << "\"r\":[" << rot0[i] << ", " << rot1[i] << ", " << rot2[i] << "," << rot3[i] << "]," << std::endl;
        outputFile << "\"c\":[" << (0.5 + SH_C0 * f_dc_0[i]) << ", " << (0.5 + SH_C0 * f_dc_1[i]) << ", " << (0.5 + SH_C0 * f_dc_2[i]) << "]," << std::endl;

        outputFile << "\"s\":[" << exp(scale0[i]) << ", " << exp(scale1[i]) << ", " << exp(scale2[i]) << "]," << std::endl;
        outputFile << "\"o\":" << (1.0 / (1.0 + exp(-opacity[i]))) << "}";

        if (i != opacity.size() - 1)
        {
            outputFile << "," << std::endl;
        }
    }
    outputFile << "]";
//cs_end: ply_preprocessor
    std::cout << "element size " << opacity.size() << std::endl;
    return 0;
}