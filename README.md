# MMI2020 Chrome Browser Extension

This repository contains the code for the mini project developed during the course [Multimodal User Interfaces](https://mcs.unibnf.ch/courses/multimodal-user-interfaces) 2020.

## Available commands

### Example action

With the command `example`, you can download the first image on the currently opened browser tab.

### Download an image 

With the commands `download` or `save`, you can download the image at the current mouse position.

## Enable the extension

To enable the extension managed in this repository in your browser, follow the three steps in the [Getting Started Tutorial](https://developer.chrome.com/extensions/getstarted#manifest). Open the folder `src` as root of the extension.

## Development

### Install dependencies

Run `npm install` to install the dependencies for this project.

### Watcher task

Start the default gulp task before changing the code by running `gulp`. It will watch the source files and process them.

### Build

To create a new build of the extension, run `gulp build`.

### Code completion

When using WebStorm or PhpStorm to work on this project, enable the library `chrome` to get code completion.

1. Open the `Settings` dialog (`File` > `Settings`)
2. Click `Languages & Frameworks` > `Javascript` > `Libraries`
3. Click `Download`
4. Select `chrome` from the list (you can find it quickly by just typing `chrome`)
5. Click `Download and Install`

## Contributors

* [Christian Fries](https://github.com/christian-fries)
* [Christian Zürcher](https://github.com/jacktraror)
* [Loïc Rosset](https://github.com/LoRosset)
