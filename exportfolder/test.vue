<template>
  <h1>Hello {{ world }}</h1>
</template>

<script setup lang="ts">
// #region "imports"
import { ref, computed } from "vue";
import { syncModel } from "@/modules/modelWrapper"; // take a lookat modelwrapper.txt
// #endregion
// #region "defineProps / defineEmits"
const props = defineProps<{
  myProp?: string;
  value?: string;
}>();

const emit = defineEmits(["input"]);
// #endregion
// #region "const"
const name = syncModel<string>(props, emit);
const world = ref("World");

const today = computed((): string => {
  return "today";
});

const UpdateWorld = (data: string): void => {
  world.value = data;
};
</script>
<style scoped></style>
