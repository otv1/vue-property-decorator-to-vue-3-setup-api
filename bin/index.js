#!/usr/bin/env node

// This Node.js script transforms Vue 2 vue-property-decorator code to Vue 3 <script setup lang="ts">.

let TARGET_VUE_VERSION = 2; // 2 or 3 !! IMPORTANT !!

const yargs = require("yargs");
const node_path = require("path");
const fs = require("fs");

// Define the command-line options

const argv = yargs
  .option("path", {
    alias: "p",
    describe: "The path to the file or directory to convert",
    demandOption: true, // Makes the option required
    type: "string",
  })
  .option("destination", {
    alias: "d",
    describe:
      "Specify the path to the destination directory. Defaults to the current path.",
    type: "string",
  })
  .option("vue", {
    alias: "v",
    describe:
      "Set the Vue target version. By default, it is set to 2. Use 3 to convert to Vue 3. The difference is related to v-model.",
    type: "number",
  })
  .option("grouping", {
    alias: "g",
    describe: "Activate the grouping of declarations for refs/reactive.",
    type: "boolean",
  })
  .option("no-comment", {
    alias: "n",
    describe:
      "Disable the inclusion of informative comments within the JavaScript code for importing the modelWrapper.",
    type: "boolean",
    "boolean-negation": true,
  })
  .option("replaceglobals", {
    describe: "For internal usage, in a particular project.",
    type: "boolean",
    hidden: true,
  }).argv;

if (argv.path && !isFileOrDirectory(getFullPath(argv.path))) {
  console.log("Path must be a file or directory");
  return;
}
if (argv.destination && !isDirectory(getFullPath(argv.destination))) {
  console.log("Destination must be a directory");
  return;
}
if (argv.vue && argv.vue !== 2 && argv.vue !== 3) {
  console.log("Vue version must be 2 or 3");
  return;
}

function isDirectory(arg) {
  try {
    const stats = fs.statSync(arg);

    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}
function isFile(arg) {
  try {
    const stats = fs.statSync(arg);

    return stats.isFile();
  } catch (error) {
    return false;
  }
}
function isFileOrDirectory(arg) {
  return isDirectory(arg) || isFile(arg);
}
function getFullPath(arg) {
  var currentPath = process.cwd();
  arg = node_path.join(currentPath, arg);

  return arg;
}
function getFilename(arg) {
  if (isDirectory(arg)) return "";
  return node_path.basename(arg);
}
function getDirname(arg) {
  if (isDirectory(arg)) return arg;
  return node_path.dirname(arg);
}

// Set the path
const p = getFullPath(argv.path);
const file_name = getFilename(p);
const import_path = getDirname(p);
const destination_path = argv.destination
  ? getFullPath(argv.destination)
  : import_path;

if (argv.vue) {
  TARGET_VUE_VERSION = argv.vue;
}

// regular expressions (regex)

const regex_imports = /import (.*?) from (.*?);\n/gs;
const regex_interfaces_multiline = /export interface (.*?) {\n(.*?)\n}/gs;
const regex_find_this = /this.(\w*)/g;
// This regex is used to find const variables with type, for objects and arays after the convertion, so we can put them in a list and sort them, and move them to the top of the script:
const regex_find_ref_reactive_for_grouping =
  /^[ ]{2}const (\w+) = (ref|reactive)(\<([A-z0-9\[\]\{\} :;\|\n]*)\>)?\([\n ]*?(\[|\{)?(.|\n)*?(\]|\})?[\n ]*\);$/gm; // Se also: "Regex: Find const variable with type"
const regex_const_computed =
  /^[ \t]{2}(?:readonly|public|private)? ?get (.*)\((.*)?\)(:)? ?(.*)? \{$/gm;
const regex_var_equals_var = /[ ]{2}(\w+) = (\w+);/g;
const regex_watch = /[ ]{2}@Watch\("(.*)"\)$/;
const regex_emits = /\$emit\(["'](\w*)["'].*?\)/g;
const regex_vmodel =
  /[ ]{2}@VModel\(\{(.*? ?.*?)\}\) ?\n?\s* ?(?:readonly|public|private)? ?(.*)!:([\s\S]*?);/gm;
const regex_refs = /\$refs.[\["]?(\w+)["\]]*[ as ]*(\w*)/gm;

const regex_props = [
  {
    // @Prop({ type: Boolean, default: true }) readonly myProp6!: boolean;
    regex:
      /(@Prop|@PropSync)\("?(.*?)"?,? ?{(.*)}\) ?\n?\s*(readonly|public|private)? ?(.*)!: (.*);/g,
    to: "", // Remove
  },
  {
    // ex @Prop(Number) public myprop!: number;
    regex:
      /(@Prop|@PropSync)\(()(\w*)\) (readonly|public|private)? ?(.*)!: (.*);/g,
    to: "", // Remove
  },
];

const regex_other = [
  { regex: /@Component\([\s\S]+?\)/m, to: "", disabled: false },
  {
    regex:
      /(export default class .\w+ extends Vue )\{(\n[\s\S]+)\}\n+\<\/script>/,
    to: "$2</script>",
    disabled: false,
  },
  {
    // Computed
    regex: regex_const_computed,
    to: "  const $1 = computed(($2)$3 $4 => {",
    disabled: false,
  },
  {
    // Remove existing refs and "as unknown as, on root, convert to class component variable. it will be converted to const / ref later.
    regex:
      /^[ ]*(\w+) = ref\<([A-z0-9\[\] \|]*)\>\([\n ]*(.*)[\n ]*\) as unknown as ([A-z0-9\[\] \|]*);$/gm,
    to: "  $1: $2 = $3;",
    disabled: false,
  },
  {
    // Convert this.xxxx = ref<>(null) to xxxx.value = null;
    regex:
      /^[ ]*this.(\w+) = ref\<([A-z0-9\[\] \|]*)\>\([\n ]*(.*)[\n ]*\) as unknown as ([A-z0-9\[\] \|]*);$/gm,
    to: "    $1.value = $3;",
    disabled: false,
  },
  {
    // name = "value" > const name = ref("value")
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(\w+)(: )?(.*)? = "(.*)"(;)$/gm,
    to: '  const $1 = ref<$3>("$4")$5',
    disabled: false,
  },
  ,
  {
    // name = 123 > const name = ref(123)
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(\w+)(: )?(.*)? = ([0-9]+)(;)$/gm,
    to: "  const $1 = ref<$3>($4)$5",
    disabled: false,
  },
  ,
  {
    // name = true > const name = ref(true) // boolean
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(\w+)(: )?(.*)? = (true|false)+(;)$/gm,
    to: "  const $1 = ref<$3>($4)$5",
    disabled: false,
  },
  {
    // name = true > const name = ref(true) // boolean
    regex: /^[ ]{2}(?:readonly|public|private)? ?(\w+) = (\w+);$/gm,
    to: "  const $1 = ref($2);",
    disabled: false,
  },
  {
    // variable = method(); => const variable = ref(method());
    regex: /^[ ]{2}(?:readonly|public|private)? ?(\w+) = (!?\w+\(\));$/gm,
    to: "  const $1 = ref($2);",
    disabled: false,
  },
  {
    // const myvar = whatever; => const myvar = ref(whatever);
    regex: /[ ]{2}(?:readonly|public|private)? ?(\w+) = (.*?);/gm,
    to: "  const $1 = ref($2);",
    disabled: false,
  },
  {
    // Fix const without type
    regex: /(ref)(<>)/g,
    to: "$1",
    disabled: false,
  },
  {
    // Methods
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(async )?(\w+)\((.*)?\)(:)? ?(.*)? {$/gm,
    to: "  const $2 = $1($3)$4 $5 => {",
    disabled: false,
  },
  {
    // Methods multiline
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(async )?(\w+)\((\n?(.*\/*\w: .*\n)* *)\)(:)? ?(.*)? \{$/gm,
    to: "  const $2 = $1($3)$5 $6 => {",
    disabled: false,
  },
  {
    // Remove Vue Property Decorator
    regex: /import {(.*)} from "vue-property-decorator";/g,
    to: "",
    disabled: false,
  },
  {
    // Find const variable without type, for array and objects.
    regex: /^[ ]{2}(?:readonly|public|private)? ?(\w+) = ([\{\[])$/gm,
    to: "  const $1 = ref($2",
    disabled: true,
  },
  {
    // Find const (to reactive) variable with type, for objects. Multiline
    // Ps. sync with: regex_const_ref_after_replace
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(\w+)(: )?(\w+)? ([A-z0-9\[\]\{\} ."+\-:;,\|\n]*) ?= (\{(.|\n)*?\});$/gm,
    to: "  const $1 = reactive<$3>($5);",
    disabled: false,
  },
  {
    // Find const (to ref) variable with type, for arrays. Multiline
    // Ps. sync with: regex_const_ref_after_replace
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(\w+)(: )?(\w+?\[\])* ([A-z0-9\[\]\{\} ."+\-:;,\|\n]*) ?= (\[(.|\n)*?\]);$/gm,
    to: "  const $1 = ref<$3>($5);",
    disabled: false,
  },
  {
    // data: Object[] = null; => const data = ref<Object[]>(null);
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(\w+): ([\w\| \[\]]+) = ([\w\[\]]+);$/gm,
    to: "  const $1 = ref<$2>($3);",
    disabled: false,
  },
  {
    // myobj: obj = {
    regex:
      /^[ ]{2}(?:readonly|public|private)? ?(\w+)(: )([A-z0-9\[\]\{\} ."+\-:;,\|\n]*) ?= ((.|\n)*?);$/gm,
    to: "  const $1 = ref<$3>($4);",
    disabled: false,
  },
  {
    // variable = object.sub.sub2; => const variable = ref(object.sub.sub2);
    regex: /^[ ]{2}(?:readonly|public|private)? ?(\w+)+ = ([\w\.\[\]]+);$/gm,
    to: "",
    disabled: false,
  },
  {
    // Replace ref<>
    regex: /ref\<\>\(/gm,
    to: "ref(",
    disabled: false,
  },
  {
    // Replace reactive<>
    regex: /reactive\<\>\(/gm,
    to: "reactive(",
    disabled: false,
  },
  {
    // Repair, remove ref on globals
    regex: /^[ ]{2}const (\w+) = ref\((globals.+)\);$/gm,
    to: "  const $1 = $2",
    disabled: true,
  },
  {
    //  as unknown as array[];
    regex: /([ \]\}]*\)) as unknown as (.*);/gm,
    to: "$1;",
    disabled: true,
  },
  {
    // Replace emits in script
    regex: /\$emit\(/gm,
    to: "emit(",
    disabled: false,
  },
  {
    // Replace if ("elevation" in this) {
    // to if ("elevation" in props) {
    regex: /" in this/gm,
    to: '" in props',
    disabled: true,
  },
  {
    regex: /\$vuetify/gm,
    to: "getCurrentInstance()?.proxy.$vuetify",
    disabled: false,
  },
  {
    regex: /\$router/gm,
    to: "getCurrentInstance()?.proxy.$router",
    disabled: false,
  },
  {
    regex: /\$forceUpdate/gm,
    to: "getCurrentInstance()?.proxy.$forceUpdate",
    disabled: false,
  },
];

let import_syncmodel_str =
  "import { syncModel } from '@/modules/modelWrapper';\n";

const comment =
  "// Copy modelWrapper from https://github.com/otv1/vue-property-decorator-to-vue-3-setup-api/blob/main/modelWrapper.txt\n";

if (!argv["no-comment"]) import_syncmodel_str = import_syncmodel_str + comment;

startConversionScript();

function startConversionScript() {
  if (file_name.length > 0) {
    processFile({ Name: file_name, Path: import_path + "/" + file_name });
  } else {
    console.log("Starting processing folder");
    var files = getAllFilesInFolder(import_path);
    for (var i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
    console.log("Finished processing folder");
  }
  console.log("Please run linting on the generated code");
}

function getAllFilesInFolder(folder) {
  // using nodejs

  const files = fs.readdirSync(folder);
  var files_array = [];
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var file_path = node_path.join(folder, file);
    var file_stats = fs.statSync(file_path);
    if (file_stats.isFile()) {
      files_array.push({ Name: file, Path: file_path });
    }
  }
  return files_array;
}

function loadTextFile(filepath) {
  // using nodejs
  var fs = require("fs");
  const content = fs.readFileSync(filepath, { encoding: "utf8", flag: "r" });
  return content;
}

function saveTextFile(filepath, data) {
  var fs = require("fs");
  fs.writeFileSync(filepath, data);
}

function processFile(file) {
  try {
    console.log(" " + file.Name + " - started processing");
    var file_contents_all = loadTextFile(file.Path);
    const processed_file_content = processFileContent(
      file_contents_all,
      file.Name
    );
    saveTextFile(
      node_path.join(destination_path, file.Name),
      processed_file_content
    );
  } catch (e) {
    dumpError(e);
  } finally {
    console.log(" " + file.Name + " - finished processing");
  }
}
function processFileContent(file_contents_all, file_name) {
  var content_array = file_contents_all.split('<script lang="ts">');

  if (content_array.length < 2) {
    throw "No <script lang='ts'> found in " + file_name;
  }
  var script_contents = content_array[1];

  var props_list = [];
  var emits_list = [];
  var refs_list = [];

  var matches;
  var all_imports_array = [];
  var all_interfaces_array = [];
  var all_const_array = [];

  var local_str = script_contents;
  while ((matches = regex_imports.exec(local_str))) {
    all_imports_array.push(matches[0]);
  }

  // removing imports
  script_contents = local_str.replace(regex_imports, "");
  while ((matches = regex_interfaces_multiline.exec(local_str))) {
    all_interfaces_array.push(matches[0]);
  }

  // removing interfaces
  script_contents = script_contents.replace(regex_interfaces_multiline, "");

  // For each @Prop / @PropsSync
  regex_props.forEach((r) => {
    // run regex, get all matches, and add to props_list
    var local_str = script_contents;
    while ((matches = r.regex.exec(local_str))) {
      const object_str = "{" + matches[3].toString() + "}";

      array_prop = ConvertObjectStringToArray(object_str);

      const prop = {
        decorator: matches[1],
        required: array_prop.includes({ name: "required", value: "true" }),
        default: array_prop.find((p) => p.name === "default")?.value ?? "",
        name: matches[2] || matches[5],
        type: matches[6],
        const_name: matches[5],
      };

      // Adding syncmodel for @PropsSync
      if (prop.decorator == "@PropSync") {
        // Add to emits

        emits_list.push("update:" + prop.name);

        // Add import syncmodel
        if (all_imports_array.indexOf(import_syncmodel_str) === -1) {
          all_imports_array.push(import_syncmodel_str);
        }
        // add SyncModel
        var model_str =
          "  const " +
          prop.const_name +
          " = syncModel<" +
          prop.type +
          ">(props, emit, '" +
          prop.name +
          "');";
        all_const_array.push({ line: model_str, name: prop.name, order: 0 });
      }

      // Adding converted const of @Prop or @PropSync to props_list
      props_list.push(prop);
    }
    // Removing all @Props / @PropsSync
    script_contents = script_contents.replace(r.regex, "");
  });
  // End for each @Props / @PropsSync

  // get the list of emits
  while ((matches = regex_emits.exec(file_contents_all))) {
    // if matches[1] is not in emits_list, add it.
    if (!emits_list.includes(matches[1])) emits_list.push(matches[1]);
  }

  // For each $refs
  const local_str2 = script_contents;
  while ((matches = regex_refs.exec(local_str2))) {
    // if matches[1] is not in refs_list, add it.
    if (!refs_list.map((r) => r.name).includes("ref_" + matches[1])) {
      refs_list.push({
        name: "ref_" + matches[1],
        type: matches[2],
        line: (
          "  const " +
          "ref_" +
          matches[1] +
          " = ref<" +
          matches[2] +
          ">(null);"
        ).replace("<>", ""),
      });
    }

    // replace in script_contents, replacing $refs.xxx with ref_xxx.value
    script_contents = script_contents.replace(
      matches[0],
      "ref_" + matches[1] + ".value"
    );
    // replace template adding prefix "ref_"
    content_array[0] = content_array[0].replace(
      'ref="' + matches[1] + '"',
      'ref="ref_' + matches[1] + '"'
    );
  }

  // search for "variable = variable" used for linking to imports.
  var matches;
  var local_str = script_contents;
  while ((matches = regex_var_equals_var.exec(local_str))) {
    if (matches[1] === matches[2]) {
      script_contents = script_contents.replace(matches[0], "");
    }
  }

  // Do the same for regex_const_computed, and replace with .value
  var matches;
  var local_str = script_contents;
  var has_computed = false;
  while ((matches = regex_const_computed.exec(local_str))) {
    var name = matches[1];
    var this_regex = new RegExp("this." + name + "(?![A-z0-9])", "g");
    script_contents = script_contents.replace(this_regex, name + ".value");

    has_computed = true;
  }

  // sort props list by length of name, so that we replace the longest first
  props_list.sort((a, b) => b.name.length - a.name.length);
  // find all variables with this. if they are on the props list, replace with props.$1
  for (var i = 0; i < props_list.length; i++) {
    var prop = props_list[i];
    var prop_name = prop.name;
    this_prop_regex = new RegExp("this." + prop_name + "(?![A-z0-9])", "g");
    script_contents = script_contents.replace(
      this_prop_regex,
      "props." + prop_name
    );
    template_prop_regex = new RegExp('"' + prop_name + "(?![A-z0-9])", "g");
    content_array[0] = content_array[0].replace(
      template_prop_regex,
      '"props.' + prop_name
    );
  }

  // Convert @VModel
  var matches;
  var local_str = script_contents;

  while ((matches = regex_vmodel.exec(local_str))) {
    var name = matches[2];
    var type = matches[3];

    var object_str = matches[1];

    array_prop = ConvertObjectStringToArray(object_str);

    var model_str =
      "  const " + name + " = syncModel<" + type + ">(props, emit)";

    // add to top of list of consts
    all_const_array.push({ line: model_str, name: name, order: 0 });
    // add to top of list of imports

    if (all_imports_array.indexOf(import_syncmodel_str) === -1) {
      all_imports_array.push(import_syncmodel_str);
    }

    // add to top of props_list
    props_list.unshift({
      name: TARGET_VUE_VERSION === 2 ? "value" : "modelValue",
      type,
      required: array_prop.includes({ name: "required", value: "true" }),
      default: array_prop.find((p) => p.name === "default")?.value ?? "",
    });
    // add to top of emits_list // vue 3 "update:modelValue"
    emits_list.unshift(
      TARGET_VUE_VERSION === 2 ? "input" : "update:modelValue"
    );

    // remove the @VModel
    script_contents = script_contents.replace(matches[0], "");
  }

  // Convert this.globals, special for a project
  if (argv["replaceglobals"] && script_contents.includes("globals")) {
    script_contents = script_contents.replace(/this.globals/gm, "globals");
    script_contents = script_contents.replace(/globals/gm, "globals");
    all_imports_array.push('import { getGlobals } from "@/main";\n');
    all_const_array.push({
      name: "globals",
      line: "  const globals = getGlobals();",
      order: 0,
    });
  }

  //////////////////////////////////////////
  // RUN REGEX OTHER
  //////////////////////////////////////////
  regex_other.forEach((r) => {
    if (r.disabled) return;
    script_contents = script_contents.replace(r.regex, r.to);
  });
  //////////////////////////////////////////
  //////////////////////////////////////////
  //////////////////////////////////////////

  // Multiline fix: Add "}" to computed functions: "const myvar = computed((*) => {" functions
  script_contents = replaceEndCharReturn(
    script_contents,
    "computed(",
    /^[ ]{2}const \w+ = computed\((.*)\{$/m,
    "}"
  );

  // Find all variables on root (const) and replace script_contents with the same variable name with .value
  var matches;
  var local_str = script_contents;
  while ((matches = regex_find_ref_reactive_for_grouping.exec(local_str))) {
    var const_name = matches[1];
    // 1 = ref, 2 = reactive
    all_const_array.pus;
    var order = matches[2] === "ref" ? 1 : 2;
    all_const_array.push({
      line: matches[0],
      name: const_name,
      order: order,
    });

    // Remove the line
    if (argv["grouping"])
      script_contents = script_contents.replace(matches[0], "");
  }

  // sort all_const_array by length of name, so that we replace the longest first
  all_const_array.sort((a, b) => b.name.length - a.name.length);

  // for each const_name in all_const_array, Replace this.const_name with const_name.value
  for (var i = 0; i < all_const_array.length; i++) {
    // only order 1 (ref) needs .value
    if (all_const_array[i].order === 1) {
      var const_name = all_const_array[i].name;
      var this_const_name_regex = new RegExp(
        "this." + const_name + "(?![A-z0-9])",
        "g"
      );
      script_contents = script_contents.replace(
        this_const_name_regex,
        const_name + ".value"
      );
    }
  }

  // Convert @Watch
  const watch_var_list = [];
  const watch_props_list = [];
  const watch_other_list = [];

  let found_watch = false;
  const lines = script_contents.split("\n");
  for (var i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.indexOf("@Watch") > -1) {
      const match = regex_watch.exec(line);

      if (match) {
        found_watch = true;

        const watch_name = match[1];
        // If exists as const variable = ref(... or ref<
        if (all_const_array.find((c) => c.name === watch_name.split(".")[0])) {
          watch_var_list.push(watch_name);
        } else if (
          // If exists as props
          props_list.find((p) => p.name === watch_name.split(".")[0])
        ) {
          watch_props_list.push(watch_name);
        }
        // If not ref or props, add to other
        else {
          watch_other_list.push(watch_name);
        }
      }
      if (!match)
        console.error(
          '### Critical error (1) in processing @Watch. IndexOf not matching regex. : \n"' +
            line +
            '" match: ' +
            match
        );

      lines[i] = "";
    } else {
      if (found_watch) {
        found_watch = false;
        if (
          line.indexOf(" = (): void => {") > -1 ||
          line.indexOf(" = async (): Promise<void> => {") > -1
        ) {
          const function_name = line.split(" = ")[0].split("const ")[1];
          lines[i] =
            buildWatchString(
              watch_props_list,
              watch_var_list,
              watch_other_list,
              function_name
            ) +
            "\n" +
            line;
        } else {
          console.error(
            "### Critical error (2) in processing @Watch : " + line
          );
        }
      }
    }
  }
  script_contents = lines.join("\n");

  // Convert $watch
  const regex_watch_2 =
    /^[ ]*(this.)?\$watch\("(\w+(.?\w*)*)", \(\) \=\> \{$/gm;
  while ((matches = regex_watch_2.exec(script_contents))) {
    const watch_name = matches[2];
    let new_watch_name = watch_name;
    if (
      // if exists in props_list
      props_list.find((c) => c.name === watch_name.split(".")[0])
    ) {
      new_watch_name = "props." + watch_name;
    }
    if (new_watch_name.indexOf(".") > -1) {
      new_watch_name = "() => " + new_watch_name + "";
    }
    script_contents = script_contents.replace(
      matches[0],
      "    watch(" + new_watch_name + ", () => {"
    );
  }

  //  if " const created = " is found then add "  void created();" right before </script> tag
  const created_index = script_contents.indexOf("const created = ");
  if (created_index > -1) {
    script_contents = script_contents.replace(
      /<\/script>/,
      "  void created();\n</script>"
    );
  }

  // Add function to run mounted() if exists
  const mounted_index = script_contents.indexOf("const mounted = ");
  if (mounted_index > -1) {
    script_contents = script_contents.replace(
      /<\/script>/,
      "  onMounted(() => mounted());\n</script>"
    );
  }

  // Add import { ref, watch, computed, reactive } from "vue";
  var vue_list = [];

  if (all_const_array.filter((c) => c.line.includes("ref")).length > 0)
    vue_list.push("ref");
  if (has_computed) vue_list.push("computed");
  if (props_list.filter((p) => p.default).length > 0)
    vue_list.push("withDefaults");
  if (script_contents.indexOf("watch") > 0) vue_list.push("watch");
  if (script_contents.indexOf("mounted") > 0) vue_list.push("onMounted");
  if (all_const_array.filter((c) => c.line.includes("reactive")).length > 0)
    vue_list.push("reactive");

  // sort imports alphabetically
  all_imports_array.sort((a, b) => a.localeCompare(b));

  // sort interfaces alphabetically
  all_interfaces_array.sort((a, b) => a.localeCompare(b));

  // Replace $emit with emit in template
  content_array[0] = content_array[0].replace(/\$emit\(/, "emit(");

  // replace all lines with "this." from script_contents
  script_contents = script_contents.replace(regex_find_this, "$1");

  // Manipulate imports
  if (vue_list.length > 0) {
    // remove vue++ from imports array
    all_imports_array = all_imports_array.filter(
      (i) => i.indexOf('from "vue"') < 0
    );
    all_imports_array = all_imports_array.filter(
      (i) => i.indexOf('from "vue-property-decorator"') < 0
    );
    // Adding importing vue
    const imp_str = "import { " + vue_list.join(", ") + ' } from "vue";\n';

    // add to the top of the imports
    all_imports_array.unshift(imp_str);
  }

  // sort const list by name and order
  all_const_array.sort((a, b) => a.name.localeCompare(b.name));
  all_const_array.sort((a, b) => a.order - b.order);

  // sort refs_list by name
  refs_list.sort((a, b) => a.name.localeCompare(b.name));

  // build <script setup tag followed by all imports + defineProps + script_contents
  var define_props_string = createDefinePropsString(props_list);
  var define_emits_string = createDefineEmitsString(emits_list);
  if (!argv["grouping"])
    all_const_array = all_const_array.filter((c) => c.order === 0);
  var add_setup_pluss =
    '<script setup lang="ts">' +
    "\n" +
    //'// #region "imports"' +
    "\n" +
    all_imports_array.join("") +
    "\n" +
    //"// #endregion" +
    "\n";
  if (all_interfaces_array.length > 0)
    add_setup_pluss =
      add_setup_pluss +
      //'// #region "interfaces"' +
      "\n" +
      all_interfaces_array.join("\n") +
      "\n" +
      //"// #endregion" +
      "\n";
  if (define_props_string || define_emits_string)
    add_setup_pluss =
      add_setup_pluss +
      //'// #region "defineProps / defineEmits"' +
      "\n" +
      define_props_string +
      define_emits_string +
      "\n" +
      //"// #endregion" +
      "\n";
  if (all_const_array.length > 0)
    add_setup_pluss =
      add_setup_pluss +
      //'// #region "const"' +
      "\n" +
      all_const_array.map((c) => c.line).join("\n") +
      "\n";
  if (refs_list.length > 0)
    add_setup_pluss =
      add_setup_pluss +
      "// $refs:\n" +
      refs_list.map((c) => c.line).join("\n") +
      "\n" +
      //"// #endregion" +
      "\n";

  script_contents = removeEmptyTrimmedLines(script_contents);
  script_contents = add_setup_pluss + script_contents;

  // Prepare complete file for export
  file_contents_all = content_array[0] + script_contents;
  return file_contents_all;
}

function buildWatchString(
  watch_props_list,
  watch_var_list,
  watch_other_list,
  function_name
) {
  var watch_string = "";
  if (
    watch_props_list.length + watch_var_list.length + watch_other_list.length >
    0
  ) {
    watch_string += "  watch(";
    if (
      watch_props_list.length +
        watch_var_list.length +
        watch_other_list.length >
      1
    ) {
      watch_string += "[";
    }

    //console.log("watch_props_list: " + watch_props_list.length);
    //console.log("watch_var_list: " + watch_var_list.length);
    //console.log("watch_other_list: " + watch_other_list.length);

    var joined_list = [
      ...watch_var_list,
      ...watch_props_list.map((w) => "props." + w),
      ...watch_other_list,
    ].map((w) => (w.indexOf(".") > -1 ? "() => " + w : w));

    watch_string += joined_list.join(", ");

    if (
      watch_props_list.length +
        watch_var_list.length +
        watch_other_list.length >
      1
    ) {
      watch_string += "]";
    }
    watch_string += ", () => void " + function_name + "());\n";
  }
  return watch_string;
}

function createDefinePropsString(props_list) {
  var props_string = "";
  var has_default = false;
  // Order props alphabetically
  props_list = props_list.sort((a, b) => (a.name > b.name ? 1 : -1));
  // Create props string
  props_list.forEach((p) => {
    required_str = p.required ? "" : "?";
    props_string += "  " + p.name + required_str + ": " + p.type + ", \n";
    has_default = has_default || p.default;
  });
  if (props_string == "") return "";
  props_string = "defineProps<{\n" + props_string + "}>()\n";
  if (has_default) {
    props_string = createWithDefaultsString(props_list, props_string);
  }
  props_string = "const props = " + props_string;

  return props_string + "\n";
}

function createWithDefaultsString(props_list, props_string) {
  var default_string = "";
  props_list.forEach((p) => {
    if (p.default === "false") p.default = "";
    else if (p.default === "true") p.default = true;
    else if (p.default) p.default = "'" + p.default + "'";
    if (p.default) {
      default_string += "  " + p.name + ": " + ("" + p.default + "");
      // line break if not last
      default_string += p !== props_list[props_list.length - 1] ? ",\n" : "";
    }
  });
  props_string =
    "withDefaults(" + props_string + ", {\n" + default_string + "\n});" + "";

  return props_string;
}

function createDefineEmitsString(emits_list) {
  var emits_string = "";

  if (emits_list.length === 0) return "";
  // Order emits alphabetically
  emits_list = emits_list.sort((a, b) => (a.name > b.name ? 1 : -1));

  emits_string =
    'const emit = defineEmits(["' + emits_list.join('", "') + '"]);';
  return emits_string;
}

// Function running find and replace on a line matching a regex /^[ \t]{2}\}/gm, but must occur on a line after matching a line containing the string "computed((". Replace to "  });"

function replaceEndCharReturn(
  script_contents,
  match_simple_first,
  then_match_regex,
  then_find_char_for_replacement
) {
  // split script contents into lines

  const lines = script_contents.split("\n");

  let found_end_char = false;
  // loop through lines

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    // check if line contains computed

    if (line.indexOf(match_simple_first) > -1) {
      // check if next line contains regex
      //console.log("match_simple_first : " + line);
      //console.log("then_match_regex : " + then_match_regex);
      var matches = then_match_regex.exec(line);
      if (matches) {
        // we found a match
        //console.log("found match, line: " + line);
        found_end_char = false;
        // check if next line contains end char
        for (var y = i; y < lines.length; y++) {
          if (lines[y].indexOf(then_find_char_for_replacement) === 2) {
            // replace line
            lines[y] = lines[y].replace(
              then_find_char_for_replacement,
              then_find_char_for_replacement + ");"
            );
            found_end_char = true;
            break;
          }
        }
        if (!found_end_char) {
          console.log("could not find end");
        }
      }
    }
  }

  return lines.join("\n");
}
function dumpError(err) {
  if (typeof err === "object") {
    if (err.message) {
      console.log("\nMessage: " + err.message);
    }
    if (err.stack) {
      console.log("\nStacktrace:");
      console.log("====================");
      console.log(err.stack);
    }
  }
  if (typeof err === "string") {
    {
      console.log(err);
    }
  } else {
    console.log("dumpError :: argument is not an object or a string");
  }
}

function ConvertObjectStringToArray(object_str) {
  if (
    [
      "Number",
      "String",
      "Boolean",
      "Object",
      "Array",
      "Function",
      "Symbol",
    ].includes(object_str)
  ) {
    object_str = "{ type: " + object_str + " }";
  }

  // Remove unnecessary characters and split the string into individual name-value pairs
  const pairs = object_str
    .replace(/[{}]/g, "") // Remove curly braces
    .split(","); // Split at commas

  // Initialize an empty array to store the result
  const result = [];

  // Iterate over each pair
  pairs.forEach((pair) => {
    // Split the pair into name and value
    const [name, value] = pair.split(":").map((str) => str.trim());

    // Add the name-value pair to the result array
    result.push({ name, value });
  });

  return result;
}

function removeEmptyTrimmedLines(str) {
  var lines = str.split("\n");
  var last_line = lines[lines.length - 1];
  var new_lines = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (line.trim() !== "") {
      new_lines.push(line);
    }
  }
  return new_lines.join("\n");
}
