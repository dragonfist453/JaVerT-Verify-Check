# JaVerT - Verify Check (VS Code Extension)

## Introduction

This is an extension to verify javascript functions with specifications mentioned in JSIL using JaVerT (https://dl.acm.org/doi/abs/10.1145/3158138) syntax. The @id tag in the JSDoc of a javascript function with the name of the function helps the extension to work appropriately.

## Prerequisites

- Docker

## Installation

There are a few steps for this extension to work except just install the extension:

### Docker installation

1. Build the docker image for the Dockerfile at https://github.com/GillianPlatform/Gillian by running the commands:

```
git clone https://github.com/GillianPlatform/Gillian
cd Gillian
docker build . -t gillian
```

2. From this docker image, build the another from the Dockerfile from https://github.com/dragonfist453/JaVerT-Verify-Check by running the following commands:

```
git clone https://github.com/dragonfist453/JaVerT-Verify-Check
cd JaVerT-Verify-Check
docker build . -t gillian-verify
```

### Install the extension normally

1. Install vsce by following the docs [here](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce) and running in the directory of the extension:

```
vsce package
```

There will be a javert-verify-check-1.0.0.vsix file in the directory generated after this.

2. Go to the "Extensions" tab in Visual Studio Code

3. Click on the 3 dots on top right to view the extended menu

4. Select "Install from VSIX..."

5. Navigate to the generated file in Step 1 and select the file to install

6. Restart VS Code as prompted by it

## Using the extension

Example files for trying this extension are available at https://github.com/GillianPlatform/Gillian/tree/master/Gillian-JS/Examples/JaVerT. You can perform the actions mentioned here with the files.

### Verifying JaVerT Specifications

1. Do Ctrl + Shift + P for the extended options to show up
2. Open a file with JaVert Specifications with the proper JSDoc
3. Select "JaVerT: Verify JaVerT specifications" in the menu by searching for the same
4. The file's gutter should show the specifications verified/failed
