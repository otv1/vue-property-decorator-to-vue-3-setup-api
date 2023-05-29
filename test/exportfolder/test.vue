<template>
  <h1>Hello {{ world }}</h1>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { syncModel } from "@/modules/modelWrapper";
// Copy modelWrapper from https://github.com/otv1/vue-property-decorator-to-vue-3-setup-api/blob/main/modelWrapper.txt

const props = withDefaults(
  defineProps<{
    myProp?: string;
    myProp2: string;
    myProp3?: string;
    myProp5?: string;
    myProp6?: boolean;
    mypropvalue: string;
    propname?: string;
    value: boolean;
  }>(),
  {
    myProp3: "test",
    myProp5: "test",
    myProp6: true,
    mypropvalue: "my test default",
    propname: "default text",
  }
);
const emit = defineEmits(["update:propname", "input"]);

const name = syncModel<boolean>(props, emit);
const syncedName = syncModel<string>(props, emit, "propname");
const world = ref("World");
const mydata = reactive(["data1", "data2", "data3"]);
const myobject = reactive({ name: "Name", age: 12 });
const today = computed((): string => {
  return "today";
});
const UpdateWorld = (data: string): void => {
  world.value = data;
};
</script>
<style scoped></style>
