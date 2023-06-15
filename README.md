# Vue 2 vue-property-decorator to Vue 2/3 setup-api converter :rocket:
This Node.js-based tool is designed to automate the transformation of your Vue 2 scripts written with **vue-property-decorator** into **Vue 3's Composition API** format, also available for vue 2.7.

## Converter
This script helps developers transition from Vue 2 to Vue 3 by transforming their scripts written with the vue-property-decorator into the Composition API format, using **<script setup lang="ts">**

## Requirements
1. Node.js installed on your machine. If not, you can download it from [Node.js Official Website](https://nodejs.org/).
2. Terminal window.

## How To Use
Following these simple steps to convert your Vue 2 scripts:
```
npm install -g vue-declassify-to-setup
vue-convert --help
```
## Usage
### Convert a directory:
```
vue-convert -p "./src/components/"
```
### Convert a file:
```
vue-convert -p "./filename.vue"
```

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
* $vuetify, $slot, $set, $delete, $forceUpdate, $router, $route, $nextTick
* And more...


### Run help for more options:
```
vue-convert --help
  
      --help         Show help                                       
      --version      Show version number                               
  -p, --path         The path to the file or directory to convert
                                                            
  -d, --destination  Specify the path to the destination directory.
                     Defaults to the current path.                       
  -v, --vue          Set the Vue target version. By default, it is set to
                     2. Use 3 to convert to Vue 3. The difference is
                     related to v-model.                                 
  -n, --no-comment   Disable the inclusion of informative comments within
                     the JavaScript code for importing the modelWrapper.
  -r, --required     Set all the properties as required  
```
### More example:
```
vue-convert --path . --destination "./exportfolder" --vue 3 -n
```

## Disclaimer
Please note that this script is designed to work with a **tab size of 2**. If your editor uses a different tab size, adjust it accordingly before running the converter.

This version **only supports double-quoted** strings. Make sure the code is set up with double-quoted strings before running the converter.

"The provided script is to be used at your own risk. It was specifically designed and tested for a specific project in a particular environment, and may require manual adjustments when applied in different contexts. In this version, the **"@Components" decorator is not converted** as it's often unnecessary. Auto-linting is anticipated."

While this project focuses on achieving up to 95% conversion for a specific project, it might not address all decorator scenarios, making it potentially incomplete for certain requirements. Your understanding is appreciated.

## Known issues
1. If you write comments just before the </script> tag, the system won't understand. It needs to see an end-bracket (}) right before the </script> tag, not a comment.

2. The script does not like comments after ; on one line.

## Contributing
Your feedback and contributions are welcome! If you encounter any issues, have suggestions or improvements, feel free to share. I appreciate your support in making this tool more efficient and versatile.

Happy coding! :smile:
