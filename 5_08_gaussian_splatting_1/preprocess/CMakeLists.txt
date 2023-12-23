cmake_minimum_required(VERSION 3.22)
#include(ExternalProject)
# set the project name
project(plymodel)

include(FetchContent)
FetchContent_Populate(happly
    URL https://github.com/nmwsharp/happly/archive/refs/heads/master.zip
)

macro(print_all_variables)
    message(STATUS "print_all_variables------------------------------------------{")
    get_cmake_property(_variableNames VARIABLES)
    foreach (_variableName ${_variableNames})
        message(STATUS "${_variableName}=${${_variableName}}")
    endforeach()
    message(STATUS "print_all_variables------------------------------------------}")
endmacro()

#find_package (assimp REQUIRED PATHS /opt/homebrew/Cellar/assimp/5.3.1 NO_DEFAULT_PATH)
print_all_variables()

# add the executable
add_executable(plymodel main.cpp)
#add_dependencies(test_text catch2 harfbuzz::harfbuzz)
target_compile_features(plymodel PRIVATE cxx_std_17)
#message(STATUS "foo include dir: ${harfbuzz_DIR}/../../include")

target_include_directories(plymodel PRIVATE ${CMAKE_CURRENT_BINARY_DIR}/include ${happly_SOURCE_DIR} )
#message(${harfbuzz_INTERFACE_INCLUDE_DIRECTORIES})
#target_link_directories(daemodel PRIVATE ${assimp_DIR}/../../../lib)
#target_link_libraries(daemodel PRIVATE assimp)