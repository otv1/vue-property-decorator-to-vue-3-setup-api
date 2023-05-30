# Vue 2 vue-property-decorator to Vue 2/3 setup-api converter :rocket:
This Node.js-based tool is designed to automate the transformation of your Vue 2 scripts written with **vue-property-decorator** into **Vue 3's Composition API** format, also available for vue 2.7.

## Converter
This script helps developers transition from Vue 2 to Vue 3 by transforming their scripts written with the vue-property-decorator into the Composition API format, using **<script setup lang="ts">**

## Roadmap
This project is currently in active development and has encountered some issues. However, a stable release is expected later this week, which will include a command-line interface (CLI) tool. Stay tuned for updates.

## Requirements
1. Node.js installed on your machine. If not, you can download it from [Node.js Official Website](https://nodejs.org/).
2. Terminal window.


## Features
This script is capable of converting a range of Vue and **vue-property-decorator**  features, including:

* Const
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



## Disclaimer
Please note that this script is designed to work with a tab size of 2. If your editor uses a different tab size, adjust it accordingly before running the code.

The provided script is used at your own risk. It was specifically designed and tested for a certain project in a particular environment, hence may require manual adjustments when used in different contexts. In this version, "@Components" are not converted as they are often unnecessary. Auto-linting is expected.

While this project focuses on achieving up to 95% conversion for a specific project, it might not address all decorator scenarios, making it potentially incomplete for certain requirements. Your understanding is appreciated.


## Contributing
Your feedback and contributions are welcome! If you encounter any issues, have suggestions or improvements, feel free to share. I appreciate your support in making this tool more efficient and versatile.

Happy coding! :smile:
