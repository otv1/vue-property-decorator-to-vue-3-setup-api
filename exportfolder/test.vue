<template>
  <h1>Hello {{ world }}</h1>
</template>

<script setup lang="ts">
// #region "imports"
import { ref, computed } from "vue";
import { syncModel } from "@/modules/modelWrapper"; // take a look at modelwrapper.txt
// #endregion
// #region "defineProps / defineEmits"
const props = withDefaults(
  defineProps<{
    myProp?: string;
    myProp2: string;
    myProp3?: string;
    myProp4: string;
    myProp5?: string;
    myProp6?: boolean;
    syncedName?: string;
    value: boolean;
  }>(),
  {
    myProp3: "test",
    myProp4: "test",
    myProp5: "test",
    myProp6: true,
    syncedName: "test",
  }
);
const emit = defineEmits(["update:name", "input"]);
// #endregion
// #region "const"
const name = syncModel<boolean>(props, emit);
const syncedName = syncModel<string>(props, emit, "name");
const world = ref("World");

const today = computed((): string => {
  return "today";
});

const UpdateWorld = (data: string): void => {
  world.value = data;
};
</script>
<style scoped></style>
