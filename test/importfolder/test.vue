<template>
  <h1>Hello {{ world }}</h1>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
  name: "HelloWorld",
  components: {},
})
export default class TestComponent extends Vue {
  @VModel({ type: Boolean, required: true, default: false }) name!: boolean;
  @Prop({ type: String }) readonly myProp!: string;
  @Prop({ type: String, required: true }) readonly myProp2!: string;
  @Prop({ type: String, default: "test" })
  readonly myProp3!: string;
  @Prop({ type: String, required: true, default: "my test default" })
  readonly mypropvalue!: string;
  @Prop({ default: "test" }) readonly myProp5!: string;
  @Prop({ type: Boolean, default: true }) readonly myProp6!: boolean;
  @PropSync("propname", { type: String, default: "default text" })
  syncedName!: string;

  world = "World";
  mydata = ["data1", "data2", "data3"];
  myobject = { name: "Name", age: 12 };

  get today(): string {
    return "today";
  }

  UpdateWorld(data: string): void {
    this.world = data;
  }
}
</script>
<style scoped></style>
