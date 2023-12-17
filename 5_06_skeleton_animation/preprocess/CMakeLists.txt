cmake_minimum_required(VERSION 3.22)
include(ExternalProject)
# set the project name
project(daemodel)

#ExternalProject_Add(catch2
#    PREFIX ${CMAKE_CURRENT_BINARY_DIR}/catch2
#    URL https://github.com/catchorg/Catch2/archive/v2.13.9.tar.gz
#    INSTALL_DIR ${CMAKE_CURRENT_BINARY_DIR}/catch2
#    CMAKE_ARGS -DCMAKE_INSTALL_PREFIX=${CMAKE_CURRENT_BINARY_DIR}/${CATCH2_NAME}
#               -DCMAKE_C_COMPILER_WORKS=${CMAKE_C_COMPILER_WORKS} 
#               -DCMAKE_C_FLAGS=${CATCH2_C_FLAGS} 
#               -DCMAKE_XCODE_EFFECTIVE_PLATFORMS=${CMAKE_XCODE_EFFECTIVE_PLATFORMS} 
#               -DCMAKE_OSX_SYSROOT=${CMAKE_OSX_SYSROOT}
#               -DCMAKE_C_COMPILER=${CMAKE_C_COMPILER} 
#               -DCMAKE_CXX_COMPILER=${CMAKE_CXX_COMPILER}
#               -DMSGPACK_CXX17=ON
#)

macro(print_all_variables)
    message(STATUS "print_all_variables------------------------------------------{")
    get_cmake_property(_variableNames VARIABLES)
    foreach (_variableName ${_variableNames})
        message(STATUS "${_variableName}=${${_variableName}}")
    endforeach()
    message(STATUS "print_all_variables------------------------------------------}")
endmacro()

find_package (assimp REQUIRED PATHS /opt/homebrew/Cellar/assimp/5.3.1 NO_DEFAULT_PATH)
print_all_variables()

# add the executable
add_executable(daemodel main.cpp)
#add_dependencies(test_text catch2 harfbuzz::harfbuzz)
target_compile_features(daemodel PRIVATE cxx_std_17)
#message(STATUS "foo include dir: ${harfbuzz_DIR}/../../include")

target_include_directories(daemodel PRIVATE ${CMAKE_CURRENT_BINARY_DIR}/include ${assimp_DIR}/../../../include )
#message(${harfbuzz_INTERFACE_INCLUDE_DIRECTORIES})
target_link_directories(daemodel PRIVATE ${assimp_DIR}/../../../lib)
target_link_libraries(daemodel PRIVATE assimp)