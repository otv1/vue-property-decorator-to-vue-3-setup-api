# Vue 2 vue-property-decorator to Vue 2/3 setup-api converter :rocket:
This Node.js-based tool is designed to automate the transformation of your Vue 2 scripts written with **vue-property-decorator** into **Vue 3's Composition API** format, also available for vue 2.7.

## Converter
This script helps developers transition from Vue 2 to Vue 3 by transforming their scripts written with the vue-property-decorator into the Composition API format, using **<script setup lang="ts">**

## Requirements
1. Node.js installed on your machine. If not, you can download it from [Node.js Official Website](https://nodejs.org/).
2. Terminal window.

## How To Use
Following these simple steps to convert your Vue 2 scripts:

1. Place all the files you want to convert into the **importfolder**.
2. Run the script by executing **node index.js** in the terminal.
3. The converted files will then be found in the **exportfolder**.

## Features
This script is capable of converting a range of Vue and **vue-property-decorator**  features, including:

* Variables
* Objects
* Arrays
* Methods
* Computed / Get
* $refs
* @Watch
* @Emit
* @Vmodel
* @Prop
* @PropSync
* Interfaces
* Imports
* $vuetify
* And more...

Please be aware that this script may not be flawless, and some manual adjustments may be required after the conversion. The primary aim of this project was to concentrate on converting a particular project up to 95%, rather than addressing every conceivable decorator scenario, making it an incomplete solution for some.

## Disclaimer
The provided script is used at your own risk. It was created and tested in a specific environment for a particular project. You are free to modify it according to your project's needs.

Don't forget to replace the number 2 in "[ ]{2}" with your preferred tab size (2 is the default in VS Code).

## Contributing
Your feedback and contributions are welcome! If you encounter any issues, have suggestions or improvements, feel free to share. We appreciate your support in making this tool more efficient and versatile.

Happy coding! :smile:
